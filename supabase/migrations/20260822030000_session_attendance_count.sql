-- Ticket #34: session_attended count + season_id auto-assign
-- Prerequisite for member levels: attendance must feed the counts table.

-- 1. Auto-assign season_id when a session is created (if not already set).
--    Uses ensure_current_season() which creates the month's season on demand.
create or replace function public.sessions_set_season()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.seasons;
begin
  if new.season_id is null then
    select * into s from public.ensure_current_season();
    new.season_id := s.id;
  end if;
  return new;
end;
$$;

create trigger sessions_set_season
  before insert on public.sessions
  for each row
  execute function public.sessions_set_season();

-- 2. Record session_attended counts when a session closes.
--    Counts all participants with role='member' (excludes spectators).
--    Spectators only get counted if they were present (role='spectator' counts as attendance).
--    Per spec: spectators count as attendance only, members count fully.
create or replace function public.record_session_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  season uuid;
  participant record;
begin
  -- Only fire when transitioning to 'closed'.
  if old.status <> 'in_progress' or new.status <> 'closed' then
    return new;
  end if;

  season := new.season_id;
  if season is null then
    -- Fallback: should not happen after sessions_set_season trigger.
    select id into season from public.seasons where status = 'open' order by starts_at desc limit 1;
    if season is null then return new; end if;
  end if;

  -- Record attendance for every participant (member + spectator).
  for participant in
    select sp.member_id
    from public.session_participants sp
    where sp.session_id = new.id
  loop
    update public.counts
      set value = value + 1
      where member_id = participant.member_id
        and event = 'session_attended'
        and season_id = season;
    if not found then
      insert into public.counts (member_id, event, season_id, value)
        values (participant.member_id, 'session_attended', season, 1);
    end if;
  end loop;

  return new;
end;
$$;

create trigger sessions_record_attendance
  after update on public.sessions
  for each row
  execute function public.record_session_attendance();

comment on function public.record_session_attendance() is
  'Registra session_attended en counts para cada participante al cerrar la sesión (Ticket #34).';
