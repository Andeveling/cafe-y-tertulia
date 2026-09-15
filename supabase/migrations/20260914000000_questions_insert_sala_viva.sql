-- Sala viva: permitir aportar Preguntas en room_stage='questions' también cuando
-- la Sesión ya está en `in_progress`.
--
-- Contexto: el ticket #40 amplió UPDATE/DELETE de autor a
-- status in ('lobby', 'in_progress') + room_stage='questions', pero el INSERT
-- (`questions_insert_member`, ticket #36) quedó en
-- status in ('preparation', 'lobby') sin noción de etapa. Una Sala en
-- in_progress/questions (Sala viva) podía editar/borrar pero no crear:
-- `new row violates row-level security policy for table "questions"`.
--
-- Fix mínimo: mantener `preparation`/`lobby` como hasta ahora y sumar el caso
-- `in_progress` + room_stage='questions'. El invariante de material
-- denormalizado (IS NOT DISTINCT FROM, SPEC §2.5) y la autoría indelegable se
-- conservan. El frozen_guard (cierre_sesion.sql) sigue bloqueando
-- closed/archived antes de RLS.

drop policy if exists "questions_insert_member" on public.questions;

create policy "questions_insert_member" on public.questions
	for insert
	to authenticated
	with check (
		public.is_member()
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.members m
			where m.id = author_id
			and m.status = 'active'
		)
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.material_id is not distinct from material_id
			and (
				s.status in ('preparation', 'lobby')
				or (s.status = 'in_progress' and s.room_stage = 'questions')
			)
		)
	);
