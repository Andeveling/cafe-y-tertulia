-- Ticket #22: histórico público — acceso sin login a la memoria del club (SPEC §8).
-- El Histórico es solo lectura; los votos individuales ya no existen en archived
-- (se eliminan al cerrar, ADR 0003). Las notas de respuesta sí son visibles:
-- son parte de la memoria del club, no datos sensibles.

-- ============================================================
-- 1. Función auxiliar: ¿la sesión está en histórico?
-- ============================================================

create or replace function public.is_session_archived(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions
    where id = target_session_id and status = 'archived'
  );
$$;

grant execute on function public.is_session_archived(uuid) to anon, authenticated;

-- ============================================================
-- 2. Policies SELECT para anon: solo datos de sesiones archivadas
-- ============================================================

-- materials: la página del Material es pública (memoria del club)
create policy "materials_select_anon" on public.materials
  for select to anon using (true);

-- sessions: solo archivadas
create policy "sessions_select_anon" on public.sessions
  for select to anon using (status = 'archived');

-- questions: solo de sesiones archivadas
create policy "questions_select_anon" on public.questions
  for select to anon using (public.is_session_archived(session_id));

-- session_participants: solo de sesiones archivadas
create policy "participants_select_anon" on public.session_participants
  for select to anon using (public.is_session_archived(session_id));

-- assignments: solo de sesiones archivadas (incluye notes — memoria del club)
create policy "assignments_select_anon" on public.assignments
  for select to anon using (
    exists (
      select 1 from public.draws d
      where d.id = draw_id and d.status <> 'hidden'
    )
    and public.is_session_archived(session_id)
  );

-- draws: solo de sesiones archivadas
create policy "draws_select_anon" on public.draws
  for select to anon using (public.is_session_archived(session_id));

-- members: display_name ya es legible por authenticated; anon solo necesita
-- nombres de participantes del histórico
create policy "members_select_anon" on public.members
  for select to anon using (true);

-- badges: catálogo, siempre público
create policy "badges_select_anon" on public.badges
  for select to anon using (true);

-- awards: solo de sesiones archivadas
create policy "awards_select_anon" on public.awards
  for select to anon using (public.is_session_archived(session_id));

-- trivia_rounds: solo de sesiones archivadas
create policy "trivia_rounds_select_anon" on public.trivia_rounds
  for select to anon using (public.is_session_archived(session_id));

-- trivias: catálogo del material (necesario para título de trivia en histórico)
create policy "trivias_select_anon" on public.trivias
  for select to anon using (true);

-- trivia_items: necesarias para mostrar las preguntas de trivia en histórico
create policy "trivia_items_select_anon" on public.trivia_items
  for select to anon using (true);

-- trivia_hits: resultados agregados de trivia (ya sin respuestas individuales)
create policy "trivia_hits_select_anon" on public.trivia_hits
  for select to anon using (
    exists (
      select 1 from public.trivia_rounds r
      where r.id = round_id and public.is_session_archived(r.session_id)
    )
  );

-- takes: de sesiones archivadas
create policy "takes_select_anon" on public.takes
  for select to anon using (public.is_session_archived(session_id));

-- take_votes: NO se expone a anon — los votos individuales son privados.
-- Los conteos agregados se calculan server-side en getSessionHistory.

-- ============================================================
-- 3. Grants SELECT a anon (RLS sigue gobernando las filas visibles)
-- ============================================================

grant select on public.materials to anon;
grant select on public.sessions to anon;
grant select on public.questions to anon;
grant select on public.session_participants to anon;
grant select on public.assignments to anon;
grant select on public.draws to anon;
grant select on public.members to anon;
grant select on public.badges to anon;
grant select on public.awards to anon;
grant select on public.trivia_rounds to anon;
grant select on public.trivias to anon;
grant select on public.trivia_items to anon;
grant select on public.trivia_hits to anon;
grant select on public.takes to anon;
