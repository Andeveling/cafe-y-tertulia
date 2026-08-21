-- Ticket #20: cierre de sesión y estados (SPEC §3.1, §7 · ADR 0003)
-- `in_progress → closed` es atómico vía el RPC `close_session`; en `closed` solo
-- el moderador corrige `range`, `scheduled_at`, `assignments.notes` y el agregado
-- de rating; `closed → archived` es manual + job diario (48h); en `archived` la
-- sesión es inmutable a nivel base de datos.

-- ============================================================
-- 1. updated_at: el job de archivado automático usa la última actividad.
-- ============================================================

alter table public.sessions
  add column updated_at timestamptz not null default now();

create or replace function public.sessions_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sessions_touch_updated_at
  before update on public.sessions
  for each row
  execute function public.sessions_touch_updated_at();

-- ============================================================
-- 2. Guarda de edición: en `closed` solo el moderador y solo columnas
--    permitidas; en `archived` la sesión es inmutable (ni el moderador).
--    La dirección de estados la sigue acotando `sessions_status_forward_only`.
-- ============================================================

create or replace function public.sessions_closed_archived_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  is_privileged boolean;
begin
  -- Histórico: inmutable, nadie lo toca.
  if old.status = 'archived' then
    raise exception 'La sesión en histórico es inmutable'
      using errcode = 'P0001';
  end if;

  if old.status = 'closed' then
    -- Cualquier cambio de contenido (rango, fecha, agregado de rating) lo
    -- ejecuta el moderador, o un rol de servicio (RPC `clear_session_rating`,
    -- `correct_assignment_notes`, job de archivado).
    if new.range is distinct from old.range
       or new.scheduled_at is distinct from old.scheduled_at
       or new.rating_avg is distinct from old.rating_avg
       or new.rating_count is distinct from old.rating_count
       or new.rating_open is distinct from old.rating_open
    then
      is_privileged := auth.uid() = old.moderator_id
        or current_user in ('service_role', 'postgres');
      if not is_privileged then
        raise exception 'Solo el moderador de la sesión puede corregirla'
          using errcode = 'P0001';
      end if;
    end if;

    -- Columnas siempre inmutables en `closed`/`archived`: identidad, material,
    -- moderador, temporada y creación.
    if new.id is distinct from old.id
       or new.material_id is distinct from old.material_id
       or new.moderator_id is distinct from old.moderator_id
       or new.season_id is distinct from old.season_id
       or new.created_at is distinct from old.created_at
    then
      raise exception 'Ese dato de la sesión no puede modificarse'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger sessions_closed_archived_guard
  before update on public.sessions
  for each row
  execute function public.sessions_closed_archived_guard();

comment on function public.sessions_closed_archived_guard() is
	'En cerrada solo el moderador corrige rango/fecha/rating; en histórico nada cambia (SPEC §3.1, ticket #20)';

-- ============================================================
-- 3. close_session: in_progress → closed, atómico (SPEC §3.1, §7).
--    Congela el rating si estaba abierto (promedio 1 decimal + conteo),
--    descarta los votos individuales (ADR 0003), recalcula el material y solo
--    entonces cambia el estado. Tolera que nunca se haya abierto votación.
-- ============================================================

create or replace function public.close_session(target_session_id uuid)
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
  n int;
begin
  select material_id into mid
  from sessions
  where id = target_session_id
    and status = 'in_progress'
    and moderator_id = auth.uid();
  if mid is null then
    raise exception 'Solo el moderador puede cerrar una sesión en curso'
      using errcode = 'P0001';
  end if;

  -- Bloquea el cierre si queda un minijuego o el Sorteo sin terminar.
  select count(*) into n from trivia_rounds
  where session_id = target_session_id and status = 'live';
  if n > 0 then
    raise exception 'Cierra primero la trivia en curso';
  end if;

  select count(*) into n from takes
  where session_id = target_session_id and status = 'open';
  if n > 0 then
    raise exception 'Cierra primero la votación abierta';
  end if;

  select count(*) into n from draws
  where session_id = target_session_id and status <> 'revealed';
  if n > 0 then
    raise exception 'Revela primero el Sorteo';
  end if;

  -- Congela el rating solo si estaba abierto; si nunca se abrió, cierra igual.
  if exists (select 1 from sessions where id = target_session_id and rating_open) then
    select count(*), coalesce(sum(stars), 0)
    into cnt, sum_v
    from votes where session_id = target_session_id;

    if cnt = 0 then
      avg_v := null;
    else
      avg_v := round(sum_v / cnt, 1);
    end if;

    update sessions
    set rating_open = false, rating_avg = avg_v, rating_count = cnt
    where id = target_session_id;

    -- Privacidad por eliminación (ADR 0003): solo persiste el aporte al agregado.
    delete from votes where session_id = target_session_id;

    perform public.refresh_material_rating(mid);
  end if;

  update sessions set status = 'closed' where id = target_session_id;

  select rating_avg, rating_count into avg_v, cnt
  from sessions where id = target_session_id;
  return jsonb_build_object('rating_avg', avg_v, 'rating_count', cnt);
end;
$$;

grant execute on function public.close_session(uuid) to authenticated;

-- ============================================================
-- 4. correct_assignment_notes: en `closed` el moderador corrige las Notas
--    de respuesta (typos). El asignado ya no puede (el Sorteo quedó revelado).
-- ============================================================

create or replace function public.correct_assignment_notes(
  target_assignment_id uuid,
  new_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update assignments a
  set notes = coalesce(new_notes, '')
  from sessions s
  where a.id = target_assignment_id
    and s.id = a.session_id
    and s.status = 'closed'
    and s.moderator_id = auth.uid();
  if not found then
    raise exception 'Solo el moderador puede corregir Notas en sesión cerrada';
  end if;
end;
$$;

grant execute on function public.correct_assignment_notes(uuid, text) to authenticated;

-- ============================================================
-- 5. Job diario: cerrada → histórico tras 48h sin actividad.
-- ============================================================

create extension if not exists pg_cron;

-- Idempotente: quita un job previo con el mismo nombre antes de recrearlo.
select cron.unschedule(jobid) from cron.job where jobname = 'archive-closed-sessions-48h';

select cron.schedule(
  'archive-closed-sessions-48h',
  '0 3 * * *',
  $archive$
    update public.sessions
    set status = 'archived'
    where status = 'closed'
      and updated_at < now() - interval '48 hours'
  $archive$
);
