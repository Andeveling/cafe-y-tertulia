-- Realtime postgres_changes filters on non-PK columns (session_id) drop
-- UPDATE/DELETE events when replica identity is the default (PK only): the
-- WAL old row has no session_id, so the filter never matches.
--
-- Presentes → Sorteo needs this for:
--   sessions.room_stage UPDATE (stepper) — PK filter, already ok, included
--     for consistency
--   session_participants opt_out / presence UPDATE (moderator roster)
--   draws / assignments after execute_draw (moderator "Ejecutar sorteo")
--
-- FULL adds whole-row WAL. These tables are small (one Sala at a time).
alter table public.sessions replica identity full;
alter table public.session_participants replica identity full;
alter table public.questions replica identity full;
alter table public.draws replica identity full;
alter table public.assignments replica identity full;
alter table public.trivia_rounds replica identity full;
alter table public.takes replica identity full;
