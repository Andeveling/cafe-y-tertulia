-- Ticket #18: trivia + takes (SPEC §5)
-- Privacy: answers/votes never exposed as person×item; only aggregates + final scoreboard.

create type public.trivia_round_status as enum ('live', 'board');
create type public.take_status as enum ('open', 'closed');
create type public.take_position as enum ('agree', 'disagree', 'neutral');

-- Banco reutilizable por Material (prep colaborativa)
create table public.trivias (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  author_id uuid not null references public.members (id),
  title text not null check (length(trim(title)) > 0),
  created_at timestamptz not null default now()
);

create table public.trivia_items (
  id uuid primary key default gen_random_uuid(),
  trivia_id uuid not null references public.trivias (id) on delete cascade,
  prompt text not null check (length(trim(prompt)) > 0),
  options text[] not null,
  correct_index int not null check (correct_index between 0 and 3),
  sort_order int not null check (sort_order >= 1),
  constraint trivia_items_options_len check (cardinality(options) = 4),
  unique (trivia_id, sort_order)
);

create table public.trivia_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  trivia_id uuid not null references public.trivias (id),
  status public.trivia_round_status not null default 'live',
  question_index int not null default 0 check (question_index >= 0),
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.trivia_answers (
  round_id uuid not null references public.trivia_rounds (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  question_index int not null check (question_index >= 0),
  option_index int not null check (option_index between 0 and 3),
  primary key (round_id, member_id, question_index)
);

create table public.trivia_hits (
  round_id uuid not null references public.trivia_rounds (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  hits int not null default 0 check (hits >= 0),
  primary key (round_id, member_id)
);

create table public.takes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  prompt text not null check (length(trim(prompt)) > 0),
  status public.take_status not null default 'open',
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now()
);

create table public.take_votes (
  take_id uuid not null references public.takes (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  position public.take_position not null,
  primary key (take_id, member_id)
);

create index trivias_material_idx on public.trivias (material_id);
create index trivia_rounds_session_idx on public.trivia_rounds (session_id);
create index takes_session_idx on public.takes (session_id);

alter table public.trivias enable row level security;
alter table public.trivia_items enable row level security;
alter table public.trivia_rounds enable row level security;
alter table public.trivia_answers enable row level security;
alter table public.trivia_hits enable row level security;
alter table public.takes enable row level security;
alter table public.take_votes enable row level security;

-- Bank visible to members; create in prep only (material has a prep session)
create policy "trivias_select" on public.trivias for select to authenticated
  using (public.is_member());
create policy "trivias_insert" on public.trivias for insert to authenticated
  with check (
    public.is_member()
    and author_id = auth.uid()
    and exists (
      select 1 from public.sessions s
      where s.material_id = trivias.material_id
        and s.status = 'preparation'
    )
  );

-- Items (incl. correct_index) only via security definer RPCs — no direct SELECT grant.
create policy "trivia_items_insert" on public.trivia_items for insert to authenticated
  with check (
    public.is_member()
    and exists (
      select 1 from public.trivias t
      where t.id = trivia_id and t.author_id = auth.uid()
    )
  );

create policy "trivia_rounds_select" on public.trivia_rounds for select to authenticated
  using (public.is_member());

-- Own answers only (never others' option picks)
create policy "trivia_answers_select_own" on public.trivia_answers for select to authenticated
  using (public.is_member() and member_id = auth.uid());
create policy "trivia_answers_insert_own" on public.trivia_answers for insert to authenticated
  with check (public.is_member() and member_id = auth.uid());

-- Hits readable only when board is shown
create policy "trivia_hits_select_board" on public.trivia_hits for select to authenticated
  using (
    public.is_member()
    and exists (
      select 1 from public.trivia_rounds r
      where r.id = round_id and r.status = 'board'
    )
  );

create policy "takes_select" on public.takes for select to authenticated
  using (public.is_member());

-- Votes: own only via table; aggregates via RPC
create policy "take_votes_select_own" on public.take_votes for select to authenticated
  using (public.is_member() and member_id = auth.uid());
create policy "take_votes_insert_own" on public.take_votes for insert to authenticated
  with check (public.is_member() and member_id = auth.uid());

grant select, insert on public.trivias to authenticated;
grant insert on public.trivia_items to authenticated;
grant select on public.trivia_rounds, public.trivia_hits, public.takes to authenticated;
grant select, insert on public.trivia_answers, public.take_votes to authenticated;

-- ─── RPCs ───────────────────────────────────────────────────

create or replace function public.create_trivia_with_items(
  p_material_id uuid,
  p_title text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  item jsonb;
  i int := 0;
  n int;
begin
  if not public.is_member() then
    raise exception 'Solo miembros';
  end if;
  if not exists (
    select 1 from sessions s
    where s.material_id = p_material_id and s.status = 'preparation'
  ) then
    raise exception 'Solo en preparación';
  end if;

  n := jsonb_array_length(p_items);
  if n < 3 or n > 5 then
    raise exception 'Una trivia necesita 3 a 5 preguntas';
  end if;

  insert into trivias (material_id, author_id, title)
  values (p_material_id, auth.uid(), trim(p_title))
  returning id into tid;

  for item in select * from jsonb_array_elements(p_items)
  loop
    i := i + 1;
    insert into trivia_items (trivia_id, prompt, options, correct_index, sort_order)
    values (
      tid,
      trim(item->>'prompt'),
      array[
        item->'options'->>0,
        item->'options'->>1,
        item->'options'->>2,
        item->'options'->>3
      ],
      (item->>'correct_index')::int,
      i
    );
  end loop;

  return tid;
end;
$$;

create or replace function public.start_trivia_round(
  target_session_id uuid,
  target_trivia_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
  mid uuid;
  n int;
begin
  select material_id into mid from sessions
  where id = target_session_id and status = 'in_progress' and moderator_id = auth.uid();
  if mid is null then
    raise exception 'Solo el moderador en sesión en curso';
  end if;

  if not exists (
    select 1 from trivias t where t.id = target_trivia_id and t.material_id = mid
  ) then
    raise exception 'Trivia no pertenece al material';
  end if;

  select count(*) into n from trivia_rounds where session_id = target_session_id;
  if n >= 2 then
    raise exception 'Máximo 2 trivias por sesión';
  end if;

  if exists (
    select 1 from trivia_rounds
    where session_id = target_session_id and status = 'live'
  ) then
    raise exception 'Ya hay una trivia en curso';
  end if;

  select count(*) into n from trivia_items where trivia_id = target_trivia_id;
  if n < 3 or n > 5 then
    raise exception 'Trivia inválida';
  end if;

  insert into trivia_rounds (session_id, trivia_id)
  values (target_session_id, target_trivia_id)
  returning id into rid;

  return rid;
end;
$$;

create or replace function public.answer_trivia(
  target_round_id uuid,
  p_option_index int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select * into r from trivia_rounds where id = target_round_id;
  if not found or r.status <> 'live' or r.locked then
    raise exception 'No hay pregunta abierta';
  end if;
  if p_option_index < 0 or p_option_index > 3 then
    raise exception 'Opción inválida';
  end if;
  if not exists (
    select 1 from sessions s where s.id = r.session_id and s.status = 'in_progress'
  ) then
    raise exception 'Sesión no en curso';
  end if;

  insert into trivia_answers (round_id, member_id, question_index, option_index)
  values (target_round_id, auth.uid(), r.question_index, p_option_index)
  on conflict do nothing;
end;
$$;

create or replace function public.lock_trivia_question(target_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
  correct int;
  a record;
begin
  select tr.* into r from trivia_rounds tr
  join sessions s on s.id = tr.session_id
  where tr.id = target_round_id and s.moderator_id = auth.uid() and tr.status = 'live';
  if not found then raise exception 'Solo el moderador'; end if;
  if r.locked then raise exception 'Ya cerrada'; end if;

  select correct_index into correct
  from trivia_items
  where trivia_id = r.trivia_id and sort_order = r.question_index + 1;

  update trivia_rounds set locked = true where id = target_round_id;

  for a in
    select member_id, option_index from trivia_answers
    where round_id = target_round_id and question_index = r.question_index
  loop
    if a.option_index = correct then
      insert into trivia_hits (round_id, member_id, hits)
      values (target_round_id, a.member_id, 1)
      on conflict (round_id, member_id)
      do update set hits = trivia_hits.hits + 1;
    end if;
  end loop;
end;
$$;

create or replace function public.next_trivia_question(target_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
  n int;
begin
  select tr.* into r
  from trivia_rounds tr
  join sessions s on s.id = tr.session_id
  where tr.id = target_round_id and s.moderator_id = auth.uid() and tr.status = 'live';
  if not found then raise exception 'Solo el moderador'; end if;
  if not r.locked then raise exception 'Cierra la pregunta primero'; end if;

  select count(*) into n from trivia_items where trivia_id = r.trivia_id;
  if r.question_index + 1 >= n then
    perform public.finish_trivia_round(target_round_id);
    return;
  end if;

  update trivia_rounds
  set question_index = question_index + 1, locked = false
  where id = target_round_id;
end;
$$;

create or replace function public.finish_trivia_round(target_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
  correct int;
  a record;
  winner uuid;
  top_hits int;
  ties int;
  badge uuid;
  season uuid;
begin
  select tr.* into r
  from trivia_rounds tr
  join sessions s on s.id = tr.session_id
  where tr.id = target_round_id and s.moderator_id = auth.uid();
  if not found then raise exception 'Solo el moderador'; end if;
  if r.status = 'board' then return; end if;

  if not r.locked then
    select correct_index into correct
    from trivia_items
    where trivia_id = r.trivia_id and sort_order = r.question_index + 1;
    for a in
      select member_id, option_index from trivia_answers
      where round_id = target_round_id and question_index = r.question_index
    loop
      if a.option_index = correct then
        insert into trivia_hits (round_id, member_id, hits)
        values (target_round_id, a.member_id, 1)
        on conflict (round_id, member_id)
        do update set hits = trivia_hits.hits + 1;
      end if;
    end loop;
  end if;

  update trivia_rounds set status = 'board', locked = false where id = target_round_id;

  select max(hits) into top_hits from trivia_hits where round_id = target_round_id;
  if top_hits is null or top_hits <= 0 then return; end if;

  select count(*) into ties from trivia_hits
  where round_id = target_round_id and hits = top_hits;
  if ties <> 1 then return; end if;

  select member_id into winner from trivia_hits
  where round_id = target_round_id and hits = top_hits;

  select id into badge from badges where key = 'elephant_memory';
  if badge is null then return; end if;

  if not exists (
    select 1 from awards where badge_id = badge and member_id = winner
  ) then
    insert into awards (badge_id, member_id, session_id, trigger)
    values (badge, winner, r.session_id, 'trivia_won');
  end if;

  select id into season from seasons where status = 'open' order by starts_at desc limit 1;
  if season is not null then
    update counts set value = value + 1
    where member_id = winner and event = 'trivia_won' and season_id = season;
    if not found then
      insert into counts (member_id, event, season_id, value)
      values (winner, 'trivia_won', season, 1);
    end if;
  end if;
end;
$$;

create or replace function public.trivia_round_snapshot(target_round_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
  item trivia_items%rowtype;
  n int;
  answered int;
  my_ans int;
  opt_counts int[] := array[0,0,0,0];
  board jsonb := '[]'::jsonb;
  winner_id uuid;
  winner_name text;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select * into r from trivia_rounds where id = target_round_id;
  if not found then return null; end if;

  select count(*) into n from trivia_items where trivia_id = r.trivia_id;
  select * into item from trivia_items
  where trivia_id = r.trivia_id and sort_order = r.question_index + 1;

  select count(*) into answered from trivia_answers
  where round_id = r.id and question_index = r.question_index;

  select option_index into my_ans from trivia_answers
  where round_id = r.id and question_index = r.question_index and member_id = auth.uid();

  if r.locked or r.status = 'board' then
    select array[
      count(*) filter (where option_index = 0),
      count(*) filter (where option_index = 1),
      count(*) filter (where option_index = 2),
      count(*) filter (where option_index = 3)
    ] into opt_counts
    from trivia_answers
    where round_id = r.id and question_index = r.question_index;
  end if;

  if r.status = 'board' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'memberId', h.member_id,
      'displayName', m.display_name,
      'hits', h.hits
    ) order by h.hits desc, m.display_name), '[]'::jsonb)
    into board
    from trivia_hits h
    join members m on m.id = h.member_id
    where h.round_id = r.id;

    select h.member_id, m.display_name into winner_id, winner_name
    from trivia_hits h
    join members m on m.id = h.member_id
    where h.round_id = r.id
    order by h.hits desc
    limit 1;

    if winner_id is not null then
      if (select count(*) from trivia_hits where round_id = r.id and hits = (
        select max(hits) from trivia_hits where round_id = r.id
      )) <> 1 or (select max(hits) from trivia_hits where round_id = r.id) <= 0 then
        winner_id := null;
        winner_name := null;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'roundId', r.id,
    'sessionId', r.session_id,
    'triviaId', r.trivia_id,
    'status', r.status,
    'questionIndex', r.question_index,
    'questionCount', n,
    'locked', r.locked,
    'prompt', case when r.status = 'live' then item.prompt else null end,
    'options', case when r.status = 'live' then to_jsonb(item.options) else null end,
    'answeredCount', answered,
    'myOption', my_ans,
    'optionCounts', case when r.locked or r.status = 'board' then to_jsonb(opt_counts) else null end,
    'scoreboard', board,
    'winnerId', winner_id,
    'winnerName', winner_name
  );
end;
$$;

create or replace function public.session_minigame_state(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  live_id uuid;
  board_id uuid;
  open_take uuid;
  bank jsonb;
  takes_json jsonb;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;

  select id into live_id from trivia_rounds
  where session_id = target_session_id and status = 'live'
  order by created_at desc limit 1;

  select id into board_id from trivia_rounds
  where session_id = target_session_id and status = 'board'
  order by created_at desc limit 1;

  select id into open_take from takes
  where session_id = target_session_id and status = 'open'
  order by created_at desc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'itemCount', (select count(*) from trivia_items i where i.trivia_id = t.id)
  ) order by t.created_at), '[]'::jsonb)
  into bank
  from trivias t
  join sessions s on s.material_id = t.material_id
  where s.id = target_session_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', tk.id,
    'prompt', tk.prompt,
    'status', tk.status,
    'counts', (
      select jsonb_build_object(
        'agree', count(*) filter (where position = 'agree'),
        'disagree', count(*) filter (where position = 'disagree'),
        'neutral', count(*) filter (where position = 'neutral')
      ) from take_votes v where v.take_id = tk.id
    )
  ) order by tk.created_at), '[]'::jsonb)
  into takes_json
  from takes tk where tk.session_id = target_session_id;

  return jsonb_build_object(
    'liveRoundId', live_id,
    'lastBoardRoundId', board_id,
    'openTakeId', open_take,
    'bank', bank,
    'takes', takes_json,
    'triviaRoundCount', (select count(*) from trivia_rounds where session_id = target_session_id),
    'takeCount', (select count(*) from takes where session_id = target_session_id)
  );
end;
$$;

create or replace function public.start_take(
  target_session_id uuid,
  p_prompt text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  n int;
begin
  if not exists (
    select 1 from sessions
    where id = target_session_id and status = 'in_progress' and moderator_id = auth.uid()
  ) then
    raise exception 'Solo el moderador en sesión en curso';
  end if;

  if exists (select 1 from takes where session_id = target_session_id and status = 'open') then
    raise exception 'Ya hay un take abierto';
  end if;

  select count(*) into n from takes where session_id = target_session_id;
  if n >= 3 then
    raise exception 'Máximo 3 takes por sesión';
  end if;

  insert into takes (session_id, prompt, created_by)
  values (target_session_id, trim(p_prompt), auth.uid())
  returning id into tid;
  return tid;
end;
$$;

create or replace function public.vote_take(
  target_take_id uuid,
  p_position public.take_position
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  if not exists (
    select 1 from takes tk
    join sessions s on s.id = tk.session_id
    where tk.id = target_take_id and tk.status = 'open' and s.status = 'in_progress'
  ) then
    raise exception 'Take no abierto';
  end if;

  insert into take_votes (take_id, member_id, position)
  values (target_take_id, auth.uid(), p_position)
  on conflict do nothing;
end;
$$;

create or replace function public.close_take(target_take_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update takes tk set status = 'closed'
  from sessions s
  where tk.id = target_take_id
    and s.id = tk.session_id
    and s.moderator_id = auth.uid()
    and tk.status = 'open';
  if not found then
    raise exception 'Solo el moderador puede cerrar el take';
  end if;
end;
$$;

grant execute on function public.create_trivia_with_items(uuid, text, jsonb) to authenticated;
grant execute on function public.start_trivia_round(uuid, uuid) to authenticated;
grant execute on function public.answer_trivia(uuid, int) to authenticated;
grant execute on function public.lock_trivia_question(uuid) to authenticated;
grant execute on function public.next_trivia_question(uuid) to authenticated;
grant execute on function public.finish_trivia_round(uuid) to authenticated;
grant execute on function public.trivia_round_snapshot(uuid) to authenticated;
grant execute on function public.session_minigame_state(uuid) to authenticated;
grant execute on function public.start_take(uuid, text) to authenticated;
grant execute on function public.vote_take(uuid, public.take_position) to authenticated;
grant execute on function public.close_take(uuid) to authenticated;
