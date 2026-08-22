-- Collective hitos that celebrate group interaction.
-- Each hito is data-driven: a function checks the condition and awards it once.

-- ==========================================================================
-- 0. Seed the new hito badges
-- ==========================================================================
insert into public.badges (key, emoji, name, description, kind) values
  ('mesa_llena', '🫂', 'Mesa llena', 'Primera sesión donde estuvieron todos los miembros activos', 'collective'),
  ('triviantes', '🧩', 'Triviantes', 'Primera sesión donde todos respondieron la trivia', 'collective'),
  ('debate_intenso', '💬', 'Debate intenso', 'Primera sesión con 10 o más preguntas', 'collective'),
  ('exploradores', '🧭', 'Exploradores', 'El club cubrió 5 materiales distintos', 'collective'),
  ('club_de_plata', '🥈', 'Club de plata', '25 sesiones completadas', 'collective')
on conflict (key) do nothing;

-- ==========================================================================
-- 1. Mesa llena — first session where ALL active members attended
-- ==========================================================================
create or replace function public.check_mesa_llena()
returns void language plpgsql security definer set search_path = public
as $$
declare
  active_count int;
  session_rec record;
  badge_id uuid;
begin
  select id into badge_id from badges where key = 'mesa_llena';
  if badge_id is null then return; end if;
  -- Already awarded?
  if exists (select 1 from awards where badge_id = check_mesa_llena.badge_id) then
    return;
  end if;

  select count(*) into active_count from members where status = 'active';
  if active_count < 2 then return; end if;

  -- Find the first session where every active member attended
  for session_rec in
    select s.id, s.created_at
    from sessions s
    where s.status in ('closed', 'archived')
    order by s.created_at
  loop
    if (
      select count(distinct sp.member_id)
      from session_participants sp
      where sp.session_id = session_rec.id
        and sp.role != 'spectator'
    ) >= active_count then
      insert into awards (badge_id, member_id, session_id, trigger)
      values (badge_id, null, session_rec.id, 'mesa_llena');
      return;
    end if;
  end loop;
end $$;

-- ==========================================================================
-- 2. Triviantes — first session where every participant answered trivia
-- ==========================================================================
create or replace function public.check_triviantes(target_session_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  participant_count int;
  answerer_count int;
  badge_id uuid;
begin
  select id into badge_id from badges where key = 'triviantes';
  if badge_id is null then return; end if;
  if exists (select 1 from awards where badge_id = check_triviantes.badge_id) then
    return;
  end if;

  -- Participants (non-spectators) in this session
  select count(*) into participant_count
  from session_participants
  where session_id = target_session_id and role != 'spectator';

  if participant_count < 2 then return; end if;

  -- Unique members who answered any trivia round in this session
  select count(distinct ta.member_id) into answerer_count
  from trivia_answers ta
  join trivia_rounds tr on tr.id = ta.round_id
  where tr.session_id = target_session_id;

  if answerer_count >= participant_count then
    insert into awards (badge_id, member_id, session_id, trigger)
    values (badge_id, null, target_session_id, 'triviantes');
  end if;
end $$;

-- ==========================================================================
-- 3. Debate intenso — first session with 10+ questions
-- ==========================================================================
create or replace function public.check_debate_intenso(target_session_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  question_count int;
  badge_id uuid;
begin
  select id into badge_id from badges where key = 'debate_intenso';
  if badge_id is null then return; end if;
  if exists (select 1 from awards where badge_id = check_debate_intenso.badge_id) then
    return;
  end if;

  select count(*) into question_count
  from questions
  where session_id = target_session_id;

  if question_count >= 10 then
    insert into awards (badge_id, member_id, session_id, trigger)
    values (badge_id, null, target_session_id, 'debate_intenso');
  end if;
end $$;

-- ==========================================================================
-- 4. Exploradores — club covered 5 different materials
-- ==========================================================================
create or replace function public.check_exploradores()
returns void language plpgsql security definer set search_path = public
as $$
declare
  material_count int;
  badge_id uuid;
begin
  select id into badge_id from badges where key = 'exploradores';
  if badge_id is null then return; end if;
  if exists (select 1 from awards where badge_id = check_exploradores.badge_id) then
    return;
  end if;

  select count(*) into material_count
  from materials
  where status in ('en_curso', 'finished');

  if material_count >= 5 then
    insert into awards (badge_id, member_id, session_id, trigger)
    values (badge_id, null, null, 'exploradores');
  end if;
end $$;

-- ==========================================================================
-- 5. Club de plata — 25 sessions completed
-- ==========================================================================
create or replace function public.check_club_de_plata()
returns void language plpgsql security definer set search_path = public
as $$
declare
  session_count int;
  badge_id uuid;
begin
  select id into badge_id from badges where key = 'club_de_plata';
  if badge_id is null then return; end if;
  if exists (select 1 from awards where badge_id = check_club_de_plata.badge_id) then
    return;
  end if;

  select count(*) into session_count
  from sessions
  where status in ('closed', 'archived');

  if session_count >= 25 then
    insert into awards (badge_id, member_id, session_id, trigger)
    values (badge_id, null, null, 'club_de_plata');
  end if;
end $$;

-- ==========================================================================
-- Triggers
-- ==========================================================================

-- After session closes: check mesa_llena, debate_intenso, club_de_plata
create or replace function public.on_session_closed_hitos()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'closed' and old.status = 'en_curso' then
    perform public.check_mesa_llena();
    perform public.check_debate_intenso(new.id);
    perform public.check_club_de_plata();
  end if;
  return new;
end $$;

create trigger session_closed_hitos
  after update on public.sessions
  for each row execute function public.on_session_closed_hitos();

-- After material finishes: check exploradores
create or replace function public.on_material_finished_hitos()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'finished' and old.status != 'finished' then
    perform public.check_exploradores();
  end if;
  return new;
end $$;

create trigger material_finished_hitos
  after update on public.materials
  for each row execute function public.on_material_finished_hitos();

-- After trivia round finalizes: check triviantes
create or replace function public.on_trivia_round_closed_hitos()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'board' and old.status = 'live' then
    perform public.check_triviantes(new.session_id);
  end if;
  return new;
end $$;

create trigger trivia_round_closed_hitos
  after update on public.trivia_rounds
  for each row execute function public.on_trivia_round_closed_hitos();
