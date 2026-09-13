-- La Sala escucha `votes` en useRoomRealtime pero la tabla nunca entró a la
-- publicación (ver 20260825180000_realtime_room_publication.sql). Sin ella el
-- canal `room:{sessionId}` no entrega postgres_changes al instante y Presentes
-- solo se entera por el polling de 4-5s. Idempotente.
do $$
declare
  t text;
begin
  foreach t in array array['votes']
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

-- Filtro `session_id=eq.*` en UPDATE/DELETE exige REPLICA IDENTITY FULL
-- (ver 20260907150741_realtime_replica_identity_full.sql).
alter table public.votes replica identity full;
