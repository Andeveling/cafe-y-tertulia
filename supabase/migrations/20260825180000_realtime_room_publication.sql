-- Publish the Sala (room) tables to Realtime so every participant sees the
-- same state without reloading the page between stages. Presence (online
-- roster on `club-roster`) already works without this; these tables feed the
-- postgres_changes subscriptions in useRoomRealtime (`room:{sessionId}`).
--
-- Idempotent: only adds tables not already members of the publication, so
-- `db push` stays safe even if the ALTER was applied manually first.
do $$
declare
  t text;
begin
  foreach t in array array[
    'sessions',
    'session_participants',
    'questions',
    'draws',
    'assignments',
    'trivia_rounds',
    'takes'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
