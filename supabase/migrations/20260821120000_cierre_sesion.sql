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
begin
  -- Histórico: inmutable, nadie lo toca.
  if old.status = 'archived' then
    raise exception 'La sesión en histórico es inmutable'
      using errcode = 'P0001';
  end if;

  -- Cierre `en_curso → cerrada`: solo el moderador (o un rol de servicio, que
  -- es quien ejecuta el RPC `close_session`). Impide saltarse el RPC con un
  -- UPDATE directo (SPEC §3.1, AC3).
  if old.status = 'in_progress' and new.status = 'closed' then
    if auth.uid() <> old.moderator_id
       and current_user not in ('service_role', 'postgres')
    then
      raise exception 'Solo el moderador puede cerrar la sesión'
        using errcode = 'P0001';
    end if;
  end if;

  if old.status = 'closed' then
    -- Cerrada → histórico: solo el moderador (o servicio) puede archivar.
    if old.status = 'closed' and new.status = 'archived' then
      if auth.uid() <> old.moderator_id
         and current_user not in ('service_role', 'postgres')
      then
        raise exception 'Solo el moderador puede archivar la sesión'
          using errcode = 'P0001';
      end if;
    end if;

    -- Rango y fecha programada: los corrige el moderador (o servicio).
    if new.range is distinct from old.range
       or new.scheduled_at is distinct from old.scheduled_at
    then
      if auth.uid() <> old.moderator_id
         and current_user not in ('service_role', 'postgres')
      then
        raise exception 'Solo el moderador de la sesión puede corregirla'
          using errcode = 'P0001';
      end if;
    end if;

    -- Agregado de rating: solo se mueve vía `clear_session_rating` (rol de
    -- servicio). Un UPDATE directo no puede tocarlo, y en cerrada no se puede
    -- reabrir la votación (AC4).
    if new.rating_avg is distinct from old.rating_avg
       or new.rating_count is distinct from old.rating_count
       or new.rating_open is distinct from old.rating_open
    then
      if current_user not in ('service_role', 'postgres') then
        raise exception 'El rating de una sesión cerrada solo se mueve con clear_session_rating'
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
-- 5. Participantes: solo se confirman en el lobby. Una vez que la Sesión avanza
--    (en_curso/cerrada/histórico) los participantes quedan congelados (AC4).
-- ============================================================

drop policy if exists "participants_insert_member" on public.session_participants;
drop policy if exists "participants_update_member" on public.session_participants;

create policy "participants_insert_member" on public.session_participants
  for insert to authenticated
  with check (
    public.is_member()
    and member_id = auth.uid()
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.status = 'lobby'
    )
  );

create policy "participants_update_member" on public.session_participants
  for update to authenticated
  using (
    (member_id = auth.uid() or public.is_session_moderator(session_id))
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.status = 'lobby'
    )
  )
  with check (
    (member_id = auth.uid() or public.is_session_moderator(session_id))
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.status = 'lobby'
    )
  );

-- ============================================================
-- 5b. Inmutabilidad de tablas hijas en cerrada/histórico (SPEC §3.1 AC4).
--     En `cerrada` solo se permite corregir `assignments.notes` vía
--     `correct_assignment_notes` (o directo por moderador); todo lo demás
--     (preguntas, sorteo, minijuegos, votos) queda congelado. En `archived`
--     todo es inmutable, a nivel DB.
-- ============================================================

create or replace function public.assignments_frozen_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  sess_status public.session_status;
  sess_mod uuid;
  sess_id uuid;
begin
  sess_id := coalesce(new.session_id, old.session_id);
  select status, moderator_id into sess_status, sess_mod from public.sessions where id = sess_id;
  if sess_status is null then
    return coalesce(new, old);
  end if;
  if sess_status in ('closed', 'archived') then
    -- Histórico: siempre inmutable, incluso para service_role.
    if sess_status = 'archived' then
      raise exception 'La sesión en histórico es inmutable (asignaciones)'
        using errcode = 'P0001';
    end if;
    -- Cerrada: solo se permite corregir Notas (typos). El RPC
    -- correct_assignment_notes corre como service_role y toca solo notes.
    if TG_OP = 'UPDATE' then
      -- Service_role vía RPC: solo notes cambia
      if current_user in ('service_role', 'postgres') then
        if new.notes is not distinct from old.notes then
          raise exception 'Asignaciones de sesión cerrada solo permiten corregir Notas' using errcode='P0001';
        end if;
        if new.id is distinct from old.id
           or new.session_id is distinct from old.session_id
           or new.question_id is distinct from old.question_id
           or new.assignee_id is distinct from old.assignee_id
           or new.draw_id is distinct from old.draw_id
           or new.reveal_order is distinct from old.reveal_order
           or new.state is distinct from old.state then
          raise exception 'Asignaciones de sesión cerrada solo permiten corregir Notas' using errcode='P0001';
        end if;
        return new;
      end if;
      -- Moderador directo: también solo notes
      if auth.uid() = sess_mod
         and new.notes is distinct from old.notes
         and new.id = old.id
         and new.session_id = old.session_id
         and new.question_id = old.question_id
         and new.assignee_id = old.assignee_id
         and new.draw_id = old.draw_id
         and new.reveal_order = old.reveal_order
         and new.state = old.state then
        return new;
      end if;
    end if;
    raise exception 'La sesión cerrada solo permite corregir Notas vía el moderador' using errcode='P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger assignments_frozen_guard
  before insert or update or delete on public.assignments
  for each row execute function public.assignments_frozen_guard();

-- Helper genérico: bloquea cualquier mutación si la sesión está cerrada/histórico.
create or replace function public.session_child_frozen_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  sess_status public.session_status;
  sess_id uuid;
begin
  -- Resolver session_id según la tabla que dispara
  if TG_TABLE_NAME = 'questions' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'draws' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'session_participants' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'takes' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'trivia_rounds' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'votes' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'take_votes' then
    -- take_votes -> takes -> session_id
    if TG_OP = 'DELETE' then
      select session_id into sess_id from public.takes where id = old.take_id;
    else
      select session_id into sess_id from public.takes where id = new.take_id;
    end if;
  elsif TG_TABLE_NAME = 'trivia_answers' then
    if TG_OP = 'DELETE' then
      select session_id into sess_id from public.trivia_rounds where id = old.round_id;
    else
      select session_id into sess_id from public.trivia_rounds where id = new.round_id;
    end if;
  else
    sess_id := null;
  end if;

  if sess_id is not null then
    select status into sess_status from public.sessions where id = sess_id;
    if sess_status in ('closed', 'archived') then
      -- En histórico todo es inmutable; en cerrada también para estas tablas.
      if sess_status = 'archived' then
        raise exception 'La sesión en histórico es inmutable (%)', TG_TABLE_NAME using errcode='P0001';
      else
        raise exception 'No se puede modificar % en sesión cerrada', TG_TABLE_NAME using errcode='P0001';
      end if;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger questions_frozen_guard
  before insert or update or delete on public.questions
  for each row execute function public.session_child_frozen_guard();
create trigger draws_frozen_guard
  before insert or update or delete on public.draws
  for each row execute function public.session_child_frozen_guard();
create trigger session_participants_frozen_guard
  before insert or update or delete on public.session_participants
  for each row execute function public.session_child_frozen_guard();
create trigger takes_frozen_guard
  before insert or update or delete on public.takes
  for each row execute function public.session_child_frozen_guard();
create trigger trivia_rounds_frozen_guard
  before insert or update or delete on public.trivia_rounds
  for each row execute function public.session_child_frozen_guard();
create trigger votes_frozen_guard
  before insert or update or delete on public.votes
  for each row execute function public.session_child_frozen_guard();
create trigger take_votes_frozen_guard
  before insert or update or delete on public.take_votes
  for each row execute function public.session_child_frozen_guard();
create trigger trivia_answers_frozen_guard
  before insert or update or delete on public.trivia_answers
  for each row execute function public.session_child_frozen_guard();

-- ============================================================
-- 6. Job diario: cerrada → histórico tras 48h sin actividad.
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
