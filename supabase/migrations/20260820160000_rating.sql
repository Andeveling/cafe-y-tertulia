-- Ticket #19: rating efímero (SPEC §7 · ADR 0003)
-- Votes live only while rating_open; close freezes avg+count and DELETEs votes.

alter table public.sessions
  add column rating_avg numeric(2,1) check (rating_avg is null or (rating_avg >= 1 and rating_avg <= 5)),
  add column rating_count int not null default 0 check (rating_count >= 0),
  add column rating_open boolean not null default false;

alter table public.materials
  add column rating_avg numeric(2,1) check (rating_avg is null or (rating_avg >= 1 and rating_avg <= 5)),
  add column rating_count int not null default 0 check (rating_count >= 0);

create table public.votes (
  session_id uuid not null references public.sessions (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  primary key (session_id, member_id)
);

alter table public.votes enable row level security;

-- Own vote only (never others')
create policy "votes_select_own" on public.votes for select to authenticated
  using (public.is_member() and member_id = auth.uid());
create policy "votes_insert_own" on public.votes for insert to authenticated
  with check (public.is_member() and member_id = auth.uid());
create policy "votes_update_own" on public.votes for update to authenticated
  using (public.is_member() and member_id = auth.uid())
  with check (public.is_member() and member_id = auth.uid());

grant select, insert, update on public.votes to authenticated;

-- Recompute material aggregate from frozen session ratings
create or replace function public.refresh_material_rating(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tot numeric;
  cnt int;
  avg_v numeric(2,1);
begin
  select coalesce(sum(rating_avg * rating_count), 0), coalesce(sum(rating_count), 0)
  into tot, cnt
  from sessions
  where material_id = p_material_id and rating_count > 0 and rating_avg is not null;

  if cnt = 0 then
    update materials set rating_avg = null, rating_count = 0 where id = p_material_id;
  else
    avg_v := round(tot / cnt, 1);
    update materials set rating_avg = avg_v, rating_count = cnt where id = p_material_id;
  end if;
end;
$$;

create or replace function public.open_session_rating(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update sessions
  set rating_open = true
  where id = target_session_id
    and status = 'in_progress'
    and moderator_id = auth.uid()
    and rating_open = false
    and rating_count = 0; -- not already frozen
  if not found then
    raise exception 'Solo el moderador puede abrir el rating en sesión en curso';
  end if;
end;
$$;

create or replace function public.cast_session_vote(
  target_session_id uuid,
  p_stars int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  if p_stars < 1 or p_stars > 5 then raise exception 'Estrellas 1-5'; end if;

  if not exists (
    select 1 from sessions s
    where s.id = target_session_id
      and s.status = 'in_progress'
      and s.rating_open
  ) then
    raise exception 'Votación cerrada';
  end if;

  if not exists (
    select 1 from session_participants sp
    where sp.session_id = target_session_id and sp.member_id = auth.uid()
  ) then
    raise exception 'Solo participantes confirmados';
  end if;

  insert into votes (session_id, member_id, stars)
  values (target_session_id, auth.uid(), p_stars)
  on conflict (session_id, member_id)
  do update set stars = excluded.stars;
end;
$$;

create or replace function public.close_session_rating(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
  avg_v numeric(2,1);
  cnt int;
  sum_v numeric;
begin
  select material_id into mid from sessions
  where id = target_session_id
    and status = 'in_progress'
    and moderator_id = auth.uid()
    and rating_open;
  if mid is null then
    raise exception 'Solo el moderador puede cerrar el rating';
  end if;

  select count(*), coalesce(sum(stars), 0)
  into cnt, sum_v
  from votes where session_id = target_session_id;

  if cnt = 0 then
    avg_v := null;
  else
    avg_v := round(sum_v / cnt, 1);
  end if;

  update sessions
  set rating_open = false,
      rating_avg = avg_v,
      rating_count = cnt
  where id = target_session_id;

  -- Privacy by deletion (ADR 0003)
  delete from votes where session_id = target_session_id;

  perform public.refresh_material_rating(mid);

  return jsonb_build_object('avg', avg_v, 'count', cnt);
end;
$$;

-- Moderator progress: X of Y, never names
create or replace function public.rating_progress(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s sessions%rowtype;
  voted int;
  total int;
  my_stars int;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select * into s from sessions where id = target_session_id;
  if not found then return null; end if;

  select count(*) into total from session_participants where session_id = target_session_id;
  select count(*) into voted from votes where session_id = target_session_id;
  select stars into my_stars from votes
  where session_id = target_session_id and member_id = auth.uid();

  return jsonb_build_object(
    'sessionId', s.id,
    'materialId', s.material_id,
    'ratingOpen', s.rating_open,
    'ratingAvg', s.rating_avg,
    'ratingCount', s.rating_count,
    'voted', voted,
    'total', total,
    'myStars', my_stars,
    'isModerator', s.moderator_id = auth.uid(),
    'isParticipant', exists (
      select 1 from session_participants sp
      where sp.session_id = s.id and sp.member_id = auth.uid()
    ),
    'sessionStatus', s.status
  );
end;
$$;

-- In closed: moderator may clear frozen aggregate (not individual votes — already gone)
create or replace function public.clear_session_rating(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  select material_id into mid from sessions
  where id = target_session_id
    and status = 'closed'
    and moderator_id = auth.uid();
  if mid is null then
    raise exception 'Solo el moderador en sesión cerrada';
  end if;

  update sessions set rating_avg = null, rating_count = 0, rating_open = false
  where id = target_session_id;
  perform public.refresh_material_rating(mid);
end;
$$;

grant execute on function public.refresh_material_rating(uuid) to authenticated;
grant execute on function public.open_session_rating(uuid) to authenticated;
grant execute on function public.cast_session_vote(uuid, int) to authenticated;
grant execute on function public.close_session_rating(uuid) to authenticated;
grant execute on function public.rating_progress(uuid) to authenticated;
grant execute on function public.clear_session_rating(uuid) to authenticated;
