-- Ticket #40: self-edit & self-delete on own questions during the
-- questions room_stage of a live Sala. Once the moderator advances to
-- presence, questions are inputs to the Sorteo and freeze in place.
--
-- Defense in depth:
--   1. RLS gates by author_id + member status + room_stage='questions'.
--   2. questions_frozen_guard (cierre_sesion.sql) blocks when the
--      session is closed/archived — no extra status check needed.
--   3. Server actions (`editQuestion`, `deleteQuestion`) also scope
--      by author_id for explicit feedback on RLS denials.

-- ============================================================
-- 1. RLS: questions_update_author — author can rewrite own text
-- ============================================================

drop policy if exists "questions_update_author" on public.questions;

create policy "questions_update_author" on public.questions
	for update
	to authenticated
	using (
		public.is_member()
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.status in ('lobby', 'in_progress')
			and s.room_stage = 'questions'
		)
	)
	with check (
		public.is_member()
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.status in ('lobby', 'in_progress')
			and s.room_stage = 'questions'
		)
	);

-- ============================================================
-- 2. RLS: questions_delete_author — author can delete own question
-- ============================================================

drop policy if exists "questions_delete_author" on public.questions;

create policy "questions_delete_author" on public.questions
	for delete
	to authenticated
	using (
		public.is_member()
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.status in ('lobby', 'in_progress')
			and s.room_stage = 'questions'
		)
	);

-- ============================================================
-- 3. Grants: extend update(text) and add delete
-- ============================================================

-- Re-grant update so (text) joins the existing (outside_draw) list.
-- authenticated members still cannot touch outside_draw on their own
-- questions — that column is reserved to the moderator's policy.
grant update (text) on table public.questions to authenticated;
grant delete on table public.questions to authenticated;
