-- Ticket #28: parejas del Sorteo visibles, texto oculto hasta turno.
-- Enmienda ADR 0001: la sorpresa pasa a ser el texto y el momento, no la pareja.
-- 1) Asignaciones visibles para todo Participante tras ejecutar el Sorteo.
-- 2) Texto de Pregunta solo legible por su autor; se hace público al revelarse.
-- 3) RPC lobby_assignments: parejas autor→asignado con texto visibilidad-aware.

-- ============================================================
-- 1. Asignaciones: visibles para miembros cuando existe el Sorteo
-- ============================================================

drop policy if exists "assignments_select_revealed" on public.assignments;

-- Antes del Sorteo no hay filas; tras ejecutarlo, todo Participante ve las
-- parejas (autor→asignado). El contenido de la Pregunta se controla en la
-- tabla questions (RLS separada).
create policy "assignments_select_after_draw" on public.assignments
	for select to authenticated using (
		public.is_member()
		and exists (
			select 1 from public.draws d
			where d.session_id = assignments.session_id
		)
	);

-- ============================================================
-- 2. Preguntas: texto oculto para no-autores hasta revelar
-- ============================================================

drop policy if exists "questions_select_member" on public.questions;

-- Antes del Sorteo: todo Miembro ve el pool completo (texto incluido).
-- Después del Sorteo: el texto solo es legible por el autor; se hace público
-- cuando la Intervención se revela (assignment.state <> 'hidden').
-- Para no-autores, la fila entera queda oculta (Postgres RLS es row-level).
-- El lobby usa el RPC lobby_assignments para mostrar las parejas.
create policy "questions_select_member" on public.questions
	for select
	to authenticated
	using (
		public.is_member()
		and (
			-- No hay Sorteo aún: el pool es abierto, todos ven todo.
			not exists (
				select 1 from public.draws d
				where d.session_id = questions.session_id
			)
			-- El autor siempre ve su propia Pregunta.
			or author_id = auth.uid()
			-- Tras revelar: la Pregunta es pública.
			or exists (
				select 1 from public.assignments a
				where a.question_id = questions.id
				and a.state <> 'hidden'
			)
		)
	);

-- ============================================================
-- 3. RPC lobby_assignments: parejas con texto visibilidad-aware
-- ============================================================

create or replace function public.lobby_assignments(target_session_id uuid)
returns json
language sql
security definer
set search_path = public
stable
as $$
	select coalesce(json_agg(row order by row->>'revealOrder'), '[]'::json)
	from (
		select json_build_object(
			'assignmentId', a.id,
			'questionId', a.question_id,
			'authorName', m_author.display_name,
			'assigneeName', m_assignee.display_name,
			'state', a.state,
			'revealOrder', a.reveal_order,
			'questionText',
				case
					when a.state <> 'hidden' then q.text
					when q.author_id = auth.uid() then q.text
					else null
				end,
			'questionVisible',
				(a.state <> 'hidden' or q.author_id = auth.uid())
		) as row
		from public.assignments a
		join public.questions q on q.id = a.question_id
		join public.members m_author on m_author.id = q.author_id
		join public.members m_assignee on m_assignee.id = a.assignee_id
		where a.session_id = target_session_id
		order by a.reveal_order
	) sub;
$$;

grant execute on function public.lobby_assignments(uuid) to authenticated;
revoke all on function public.lobby_assignments(uuid) from public;
