-- [multi-grupo] 04 Migrate RLS lote B (#73, PRD #69, ADR-0013).
--
-- Sesión viva y gamificación aisladas por grupo: questions, draws,
-- assignments, session_participants, takes (+ take_votes transitiva),
-- trivias, trivia_rounds (+ items/answers/hits transitivas), votes, hearts,
-- badges, awards, counts y season_recognitions pasan de is_member() global
-- a is_group_member(group_id). Las transitivas sin group_id propio se
-- cierran por el grupo del padre (trivia/round/take).
--
--  - is_member() sale de este lote: queda solo para plataforma (Mis Grupos,
--    perfil, catálogo público).
--  - Caen las policies anon del lote B (histórico público por-grupo queda
--    para después, PRD §Out of Scope). El GRANT a anon se conserva donde
--    ya existía para recibir vacío en vez de 42501, igual que el lote A.
--  - Defensa en profundidad: group_id inmutable, coherencia mismo-grupo en
--    FKs del lote, gamificación (conteos, insignias, hitos, niveles) per-grupo
--    y RPCs de sala/minijuegos/rating con cerradura por grupo (salir revoca).
--  - El contract NOT NULL + FKs es del #74; aquí group_id sigue nullable.

-- ============================================================
-- 1. Retirar políticas viejas del lote B
-- ============================================================

drop policy if exists "questions_select_member" on public.questions;
drop policy if exists "questions_insert_member" on public.questions;
drop policy if exists "questions_update_moderator" on public.questions;
drop policy if exists "questions_update_author" on public.questions;
drop policy if exists "questions_delete_author" on public.questions;
drop policy if exists "questions_select_anon" on public.questions;

drop policy if exists "participants_select_member" on public.session_participants;
drop policy if exists "participants_insert_member" on public.session_participants;
drop policy if exists "participants_update_member" on public.session_participants;
drop policy if exists "participants_delete_self" on public.session_participants;
drop policy if exists "participants_select_anon" on public.session_participants;

drop policy if exists "draws_select_after_reveal" on public.draws;
drop policy if exists "draws_select_member" on public.draws;
drop policy if exists "draws_select_anon" on public.draws;

drop policy if exists "assignments_select_after_reveal" on public.assignments;
drop policy if exists "assignments_select_revealed" on public.assignments;
drop policy if exists "assignments_select_after_draw" on public.assignments;
drop policy if exists "assignments_select_anon" on public.assignments;

drop policy if exists "trivias_select" on public.trivias;
drop policy if exists "trivias_insert" on public.trivias;
drop policy if exists "trivias_select_anon" on public.trivias;

drop policy if exists "trivia_items_insert" on public.trivia_items;
drop policy if exists "trivia_items_select_anon" on public.trivia_items;

drop policy if exists "trivia_rounds_select" on public.trivia_rounds;
drop policy if exists "trivia_rounds_select_anon" on public.trivia_rounds;

drop policy if exists "trivia_answers_select_own" on public.trivia_answers;
drop policy if exists "trivia_answers_insert_own" on public.trivia_answers;

drop policy if exists "trivia_hits_select_board" on public.trivia_hits;
drop policy if exists "trivia_hits_select_anon" on public.trivia_hits;

drop policy if exists "takes_select" on public.takes;
drop policy if exists "takes_select_anon" on public.takes;

drop policy if exists "take_votes_select_own" on public.take_votes;
drop policy if exists "take_votes_insert_own" on public.take_votes;

drop policy if exists "votes_select_own" on public.votes;
drop policy if exists "votes_insert_own" on public.votes;
drop policy if exists "votes_update_own" on public.votes;

drop policy if exists "hearts_select_own" on public.hearts;
drop policy if exists "hearts_insert_own" on public.hearts;
drop policy if exists "hearts_update_own" on public.hearts;

drop policy if exists "badges_select_member" on public.badges;
drop policy if exists "badges_select_anon" on public.badges;

drop policy if exists "awards_select_member" on public.awards;
drop policy if exists "awards_insert_moderator" on public.awards;
drop policy if exists "awards_select_anon" on public.awards;

drop policy if exists "counts_select_member" on public.counts;
drop policy if exists "recognitions_select_member" on public.season_recognitions;

-- Sin memoria pública por-grupo todavía: caen las policies anon del lote B.
-- Los GRANTs a anon se conservan (anon recibe vacío, no 42501).

-- ============================================================
-- 2. Políticas nuevas: solo miembros del grupo
-- ============================================================

-- Questions: pool visible por grupo (sin sorteo → abierto; con sorteo →
-- solo propias o reveladas). Crear/editar/borrar exigen membresía del grupo.
create policy "questions_select_group" on public.questions
	for select
	to authenticated
	using (
		public.is_group_member(group_id)
		and (
			not exists (
				select 1 from public.draws d
				where d.session_id = questions.session_id
			)
			or author_id = (select auth.uid())
			or exists (
				select 1 from public.assignments a
				where a.question_id = questions.id
				and a.state <> 'hidden'
			)
		)
	);

create policy "questions_insert_group" on public.questions
	for insert
	to authenticated
	with check (
		group_id is not null
		and public.is_group_member(group_id)
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

-- Solo el moderador de la sesión marca/desmarca "Fuera de sorteo".
create policy "questions_update_moderator_group" on public.questions
	for update
	to authenticated
	using (
		public.is_group_member(group_id)
		and public.is_session_moderator(session_id)
	)
	with check (
		group_id is not null
		and public.is_group_member(group_id)
		and public.is_session_moderator(session_id)
	);

-- El autor reescribe su texto en la etapa de preguntas de la sala viva.
create policy "questions_update_author_group" on public.questions
	for update
	to authenticated
	using (
		public.is_group_member(group_id)
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
		group_id is not null
		and public.is_group_member(group_id)
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.status in ('lobby', 'in_progress')
			and s.room_stage = 'questions'
		)
	);

create policy "questions_delete_author_group" on public.questions
	for delete
	to authenticated
	using (
		public.is_group_member(group_id)
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.status in ('lobby', 'in_progress')
			and s.room_stage = 'questions'
		)
	);

-- Session participants: roster por grupo; confirmación solo en lobby.
create policy "participants_select_group" on public.session_participants
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "participants_insert_group" on public.session_participants
	for insert
	to authenticated
	with check (
		group_id is not null
		and public.is_group_member(group_id)
		and member_id = (select auth.uid())
		and exists (
			select 1 from public.sessions s
			where s.id = session_id and s.status = 'lobby'
		)
	);

create policy "participants_update_group" on public.session_participants
	for update
	to authenticated
	using (
		public.is_group_member(group_id)
		and (member_id = (select auth.uid()) or public.is_session_moderator(session_id))
		and exists (
			select 1 from public.sessions s
			where s.id = session_id and s.status = 'lobby'
		)
	)
	with check (
		group_id is not null
		and public.is_group_member(group_id)
		and (member_id = (select auth.uid()) or public.is_session_moderator(session_id))
		and exists (
			select 1 from public.sessions s
			where s.id = session_id and s.status = 'lobby'
		)
	);

create policy "participants_delete_group" on public.session_participants
	for delete
	to authenticated
	using (
		member_id = (select auth.uid())
		and public.is_group_member(group_id)
	);

-- Draws: el sorteo vive en el grupo de su sesión.
create policy "draws_select_group" on public.draws
	for select
	to authenticated
	using (public.is_group_member(group_id));

-- Assignments: visibles por grupo una vez hay sorteo (el pool oculto no se
-- expone eligiendo orden; el reveal va por RPC).
create policy "assignments_select_group" on public.assignments
	for select
	to authenticated
	using (
		public.is_group_member(group_id)
		and exists (
			select 1 from public.draws d
			where d.session_id = assignments.session_id
		)
	);

-- Trivias: banco por grupo; crear solo en preparación del mismo grupo.
create policy "trivias_select_group" on public.trivias
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "trivias_insert_group" on public.trivias
	for insert
	to authenticated
	with check (
		group_id is not null
		and public.is_group_member(group_id)
		and author_id = (select auth.uid())
		and exists (
			select 1 from public.sessions s
			where s.material_id = trivias.material_id
			and s.status = 'preparation'
		)
	);

-- Items: sin SELECT directo (solo RPCs); insertar exige autoría + grupo.
create policy "trivia_items_insert_group" on public.trivia_items
	for insert
	to authenticated
	with check (
		exists (
			select 1 from public.trivias t
			where t.id = trivia_id
			and t.author_id = (select auth.uid())
			and public.is_group_member(t.group_id)
		)
	);

-- Trivia rounds: rondas por grupo.
create policy "trivia_rounds_select_group" on public.trivia_rounds
	for select
	to authenticated
	using (public.is_group_member(group_id));

-- Answers: solo propias y solo dentro del grupo de la ronda.
create policy "trivia_answers_select_group" on public.trivia_answers
	for select
	to authenticated
	using (
		member_id = (select auth.uid())
		and exists (
			select 1 from public.trivia_rounds r
			where r.id = round_id
			and public.is_group_member(r.group_id)
		)
	);

create policy "trivia_answers_insert_group" on public.trivia_answers
	for insert
	to authenticated
	with check (
		member_id = (select auth.uid())
		and exists (
			select 1 from public.trivia_rounds r
			where r.id = round_id
			and public.is_group_member(r.group_id)
		)
	);

-- Hits: agregados visibles solo con tablero y dentro del grupo.
create policy "trivia_hits_select_group" on public.trivia_hits
	for select
	to authenticated
	using (
		exists (
			select 1 from public.trivia_rounds r
			where r.id = round_id
			and r.status = 'board'
			and public.is_group_member(r.group_id)
		)
	);

-- Takes: posturas por grupo.
create policy "takes_select_group" on public.takes
	for select
	to authenticated
	using (public.is_group_member(group_id));

-- Take votes: solo propios y dentro del grupo del take.
create policy "take_votes_select_group" on public.take_votes
	for select
	to authenticated
	using (
		member_id = (select auth.uid())
		and exists (
			select 1 from public.takes tk
			where tk.id = take_id
			and public.is_group_member(tk.group_id)
		)
	);

create policy "take_votes_insert_group" on public.take_votes
	for insert
	to authenticated
	with check (
		member_id = (select auth.uid())
		and exists (
			select 1 from public.takes tk
			where tk.id = take_id
			and public.is_group_member(tk.group_id)
		)
	);

-- Votes (rating efímero): solo propios dentro del grupo.
create policy "votes_select_group" on public.votes
	for select
	to authenticated
	using (
		member_id = (select auth.uid())
		and public.is_group_member(group_id)
	);

create policy "votes_insert_group" on public.votes
	for insert
	to authenticated
	with check (
		member_id = (select auth.uid())
		and group_id is not null
		and public.is_group_member(group_id)
	);

create policy "votes_update_group" on public.votes
	for update
	to authenticated
	using (
		member_id = (select auth.uid())
		and public.is_group_member(group_id)
	)
	with check (
		member_id = (select auth.uid())
		and group_id is not null
		and public.is_group_member(group_id)
	);

-- Hearts (aprecio anónimo): mismo patrón que votes.
create policy "hearts_select_group" on public.hearts
	for select
	to authenticated
	using (
		member_id = (select auth.uid())
		and public.is_group_member(group_id)
	);

create policy "hearts_insert_group" on public.hearts
	for insert
	to authenticated
	with check (
		member_id = (select auth.uid())
		and group_id is not null
		and public.is_group_member(group_id)
	);

create policy "hearts_update_group" on public.hearts
	for update
	to authenticated
	using (
		member_id = (select auth.uid())
		and public.is_group_member(group_id)
	)
	with check (
		member_id = (select auth.uid())
		and group_id is not null
		and public.is_group_member(group_id)
	);

-- Gamificación: cada grupo tiene su catálogo, conteos e insignias.
create policy "badges_select_group" on public.badges
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "awards_select_group" on public.awards
	for select
	to authenticated
	using (public.is_group_member(group_id));

-- Otorgamientos subjetivos: moderador del grupo, insignia individual del
-- mismo grupo y sesión del mismo grupo.
create policy "awards_insert_moderator_group" on public.awards
	for insert
	to authenticated
	with check (
		group_id is not null
		and public.is_group_member(group_id)
		and session_id is not null
		and public.is_session_moderator(session_id)
		and exists (
			select 1 from public.badges b
			where b.id = badge_id
			and b.kind = 'individual'
			and b.group_id = awards.group_id
		)
		and exists (
			select 1 from public.sessions s
			where s.id = session_id
			and s.group_id = awards.group_id
		)
	);

create policy "counts_select_group" on public.counts
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "recognitions_select_group" on public.season_recognitions
	for select
	to authenticated
	using (public.is_group_member(group_id));

-- ============================================================
-- 3. Índices por grupo
-- ============================================================

create index if not exists questions_group_idx on public.questions (group_id);
create index if not exists draws_group_idx on public.draws (group_id);
create index if not exists assignments_group_idx on public.assignments (group_id);
create index if not exists session_participants_group_idx on public.session_participants (group_id);
create index if not exists takes_group_idx on public.takes (group_id);
create index if not exists trivia_rounds_group_idx on public.trivia_rounds (group_id);
create index if not exists trivias_group_idx on public.trivias (group_id);
create index if not exists votes_group_idx on public.votes (group_id);
create index if not exists hearts_group_idx on public.hearts (group_id);
create index if not exists badges_group_idx on public.badges (group_id);
create index if not exists awards_group_idx on public.awards (group_id);
create index if not exists counts_group_idx on public.counts (group_id);
create index if not exists season_recognitions_group_idx on public.season_recognitions (group_id);

-- Transitivas: el filtro real va por el padre.
create index if not exists trivia_items_trivia_idx on public.trivia_items (trivia_id);
create index if not exists trivia_answers_round_idx on public.trivia_answers (round_id);
create index if not exists trivia_hits_round_idx on public.trivia_hits (round_id);
create index if not exists take_votes_take_idx on public.take_votes (take_id);

-- ============================================================
-- 4. Defensa en profundidad: group_id inmutable (lote B)
-- ============================================================

do $$
declare
	t text;
begin
	foreach t in array array[
		'questions', 'draws', 'assignments', 'session_participants',
		'takes', 'trivia_rounds', 'trivias', 'votes', 'hearts',
		'badges', 'awards', 'counts', 'season_recognitions'
	] loop
		execute format('drop trigger if exists groups_freeze_group on public.%I', t);
		execute format(
			'create trigger groups_freeze_group '
			'before update of group_id on public.%I '
			'for each row execute function public.groups_prevent_group_change()',
			t
		);
	end loop;
end
$$;

-- ============================================================
-- 5. Coherencia mismo-grupo en las FKs del lote B
-- ============================================================

-- La pregunta cuelga de sesión y material de su mismo grupo; el autor es
-- Miembro activo del grupo.
create or replace function public.questions_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
	v_mat_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	select group_id into v_mat_group from public.materials where id = new.material_id;
	if v_ses_group is distinct from new.group_id
		or v_mat_group is distinct from new.group_id
	then
		raise exception 'La pregunta, su sesión y su material deben ser del mismo grupo'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.author_id
		and m.status = 'active'
	) then
		raise exception 'El autor no es Miembro activo de este grupo'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists questions_group_coherence on public.questions;
create trigger questions_group_coherence
	before insert or update of session_id, material_id, group_id, author_id on public.questions
	for each row execute function public.questions_group_coherence();

-- El sorteo vive en el grupo de su sesión.
create or replace function public.draws_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	if v_ses_group is null or v_ses_group is distinct from new.group_id then
		raise exception 'El sorteo vive en el grupo de su sesión'
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;

drop trigger if exists draws_group_coherence on public.draws;
create trigger draws_group_coherence
	before insert or update of session_id, group_id on public.draws
	for each row execute function public.draws_group_coherence();

-- La asignación une sesión, sorteo, pregunta y asignado del mismo grupo.
create or replace function public.assignments_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
	v_draw_group uuid;
	v_q_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	select group_id into v_draw_group from public.draws where id = new.draw_id;
	select group_id into v_q_group from public.questions where id = new.question_id;
	if v_ses_group is distinct from new.group_id
		or v_draw_group is distinct from new.group_id
		or v_q_group is distinct from new.group_id
	then
		raise exception 'Sesión, sorteo, pregunta y asignación deben ser del mismo grupo'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.assignee_id
		and m.status = 'active'
	) then
		raise exception 'El asignado no es Miembro activo de este grupo'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists assignments_group_coherence on public.assignments;
create trigger assignments_group_coherence
	before insert or update of session_id, draw_id, question_id, assignee_id, group_id on public.assignments
	for each row execute function public.assignments_group_coherence();

-- El participante confirma dentro de su grupo.
create or replace function public.session_participants_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	if v_ses_group is null or v_ses_group is distinct from new.group_id then
		raise exception 'La presencia vive en el grupo de su sesión'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.member_id
		and m.status = 'active'
	) then
		raise exception 'Solo Miembros activos del grupo confirman presencia'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists session_participants_group_coherence on public.session_participants;
create trigger session_participants_group_coherence
	before insert or update of session_id, member_id, group_id on public.session_participants
	for each row execute function public.session_participants_group_coherence();

-- Takes y trivia rounds viven en el grupo de su sesión (y la trivia es del
-- mismo grupo que la ronda).
create or replace function public.takes_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	if v_ses_group is null or v_ses_group is distinct from new.group_id then
		raise exception 'El take vive en el grupo de su sesión'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.created_by
		and m.status = 'active'
	) then
		raise exception 'Solo Miembros del grupo abren takes'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists takes_group_coherence on public.takes;
create trigger takes_group_coherence
	before insert or update of session_id, group_id, created_by on public.takes
	for each row execute function public.takes_group_coherence();

create or replace function public.trivia_rounds_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
	v_trivia_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	select group_id into v_trivia_group from public.trivias where id = new.trivia_id;
	if v_ses_group is null or v_ses_group is distinct from new.group_id then
		raise exception 'La ronda vive en el grupo de su sesión'
			using errcode = 'P0001';
	end if;
	if v_trivia_group is distinct from new.group_id then
		raise exception 'La trivia y su ronda deben ser del mismo grupo'
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;

drop trigger if exists trivia_rounds_group_coherence on public.trivia_rounds;
create trigger trivia_rounds_group_coherence
	before insert or update of session_id, trivia_id, group_id on public.trivia_rounds
	for each row execute function public.trivia_rounds_group_coherence();

-- La trivia cuelga del material de su grupo; el autor es del grupo.
create or replace function public.trivias_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_mat_group uuid;
begin
	select group_id into v_mat_group from public.materials where id = new.material_id;
	if v_mat_group is distinct from new.group_id then
		raise exception 'La trivia y su material deben ser del mismo grupo'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.author_id
		and m.status = 'active'
	) then
		raise exception 'El autor no es Miembro activo de este grupo'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists trivias_group_coherence on public.trivias;
create trigger trivias_group_coherence
	before insert or update of material_id, group_id, author_id on public.trivias
	for each row execute function public.trivias_group_coherence();

-- Votos y corazones: sesión/asignación y votante del mismo grupo.
create or replace function public.votes_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	if v_ses_group is null or v_ses_group is distinct from new.group_id then
		raise exception 'El voto vive en el grupo de su sesión'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.member_id
		and m.status = 'active'
	) then
		raise exception 'Solo Miembros del grupo votan'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists votes_group_coherence on public.votes;
create trigger votes_group_coherence
	before insert or update of session_id, member_id, group_id on public.votes
	for each row execute function public.votes_group_coherence();

create or replace function public.hearts_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ass_group uuid;
	v_ses_group uuid;
begin
	select group_id, session_id into v_ass_group, v_ses_group
	from public.assignments where id = new.assignment_id;
	if v_ass_group is distinct from new.group_id
		or v_ses_group is distinct from new.session_id
	then
		raise exception 'El corazón vive en el grupo de su intervención'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1 from public.sessions s
		where s.id = new.session_id and s.group_id = new.group_id
	) then
		raise exception 'El corazón vive en el grupo de su sesión'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.member_id
		and m.status = 'active'
	) then
		raise exception 'Solo Miembros del grupo dan corazones'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists hearts_group_coherence on public.hearts;
create trigger hearts_group_coherence
	before insert or update of assignment_id, member_id, session_id, group_id on public.hearts
	for each row execute function public.hearts_group_coherence();

-- Gamificación: insignia, temporada, sesión y miembro del mismo grupo.
create or replace function public.awards_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_badge_group uuid;
	v_ses_group uuid;
	v_sea_group uuid;
begin
	select group_id into v_badge_group from public.badges where id = new.badge_id;
	if v_badge_group is distinct from new.group_id then
		raise exception 'La insignia y su otorgamiento deben ser del mismo grupo'
			using errcode = 'P0001';
	end if;
	if new.session_id is not null then
		select group_id into v_ses_group from public.sessions where id = new.session_id;
		if v_ses_group is distinct from new.group_id then
			raise exception 'La sesión y su insignia deben ser del mismo grupo'
				using errcode = 'P0001';
		end if;
	end if;
	if new.member_id is not null and not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.member_id
		and m.status = 'active'
	) then
		raise exception 'El reconocido no es Miembro activo de este grupo'
			using errcode = '42501';
	end if;
	-- La temporada se deriva de la sesión cuando hay una: misma regla.
	if new.session_id is not null then
		select s.season_id into v_sea_group from public.sessions s where s.id = new.session_id;
		if v_sea_group is not null then
			select group_id into v_sea_group from public.seasons where id = v_sea_group;
			if v_sea_group is distinct from new.group_id then
				raise exception 'La temporada y su insignia deben ser del mismo grupo'
					using errcode = 'P0001';
			end if;
		end if;
	end if;
	return new;
end;
$$;

drop trigger if exists awards_group_coherence on public.awards;
create trigger awards_group_coherence
	before insert or update of badge_id, session_id, member_id, group_id on public.awards
	for each row execute function public.awards_group_coherence();

create or replace function public.counts_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_sea_group uuid;
begin
	select group_id into v_sea_group from public.seasons where id = new.season_id;
	if v_sea_group is distinct from new.group_id then
		raise exception 'El conteo vive en el grupo de su temporada'
			using errcode = 'P0001';
	end if;
	if new.member_id is not null and not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.member_id
		and m.status = 'active'
	) then
		raise exception 'El conteo es de un Miembro activo de este grupo'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists counts_group_coherence on public.counts;
create trigger counts_group_coherence
	before insert or update of season_id, member_id, group_id on public.counts
	for each row execute function public.counts_group_coherence();

create or replace function public.season_recognitions_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_sea_group uuid;
begin
	select group_id into v_sea_group from public.seasons where id = new.season_id;
	if v_sea_group is distinct from new.group_id then
		raise exception 'El reconocimiento vive en el grupo de su temporada'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.member_id
		and m.status = 'active'
	) then
		raise exception 'El reconocido no es Miembro activo de este grupo'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists season_recognitions_group_coherence on public.season_recognitions;
create trigger season_recognitions_group_coherence
	before insert or update of season_id, member_id, group_id on public.season_recognitions
	for each row execute function public.season_recognitions_group_coherence();

-- Transitivas sin group_id: el votante/respuesta solo existe si es del grupo
-- del padre (take, ronda, trivia). Fail-closed aunque RLS oculte filas.
create or replace function public.take_votes_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_group uuid;
begin
	select group_id into v_group from public.takes where id = coalesce(new.take_id, old.take_id);
	if v_group is null then
		raise exception 'El take no existe'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = v_group
		and gm.member_id = coalesce(new.member_id, old.member_id)
		and m.status = 'active'
	) then
		raise exception 'Solo Miembros del grupo votan takes'
			using errcode = '42501';
	end if;
	return coalesce(new, old);
end;
$$;

drop trigger if exists take_votes_group_coherence on public.take_votes;
create trigger take_votes_group_coherence
	before insert or update or delete on public.take_votes
	for each row execute function public.take_votes_group_coherence();

create or replace function public.trivia_items_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_trivia_group uuid;
	v_trivia_author uuid;
begin
	select group_id, author_id into v_trivia_group, v_trivia_author
	from public.trivias where id = coalesce(new.trivia_id, old.trivia_id);
	if v_trivia_group is null then
		raise exception 'La trivia no existe'
			using errcode = 'P0001';
	end if;
	if coalesce(new.trivia_id, old.trivia_id) is not null
		and v_trivia_author is distinct from auth.uid()
		and current_user not in ('service_role', 'postgres')
	then
		raise exception 'Solo el autor edita su banco'
			using errcode = '42501';
	end if;
	return coalesce(new, old);
end;
$$;

drop trigger if exists trivia_items_group_coherence on public.trivia_items;
create trigger trivia_items_group_coherence
	before insert or update or delete on public.trivia_items
	for each row execute function public.trivia_items_group_coherence();

create or replace function public.trivia_answers_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_group uuid;
begin
	select group_id into v_group from public.trivia_rounds where id = coalesce(new.round_id, old.round_id);
	if v_group is null then
		raise exception 'La ronda no existe'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = v_group
		and gm.member_id = coalesce(new.member_id, old.member_id)
		and m.status = 'active'
	) then
		raise exception 'Solo Miembros del grupo responden trivia'
			using errcode = '42501';
	end if;
	return coalesce(new, old);
end;
$$;

drop trigger if exists trivia_answers_group_coherence on public.trivia_answers;
create trigger trivia_answers_group_coherence
	before insert or update or delete on public.trivia_answers
	for each row execute function public.trivia_answers_group_coherence();

create or replace function public.trivia_hits_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_group uuid;
begin
	select group_id into v_group from public.trivia_rounds where id = coalesce(new.round_id, old.round_id);
	if v_group is null then
		raise exception 'La ronda no existe'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = v_group
		and gm.member_id = coalesce(new.member_id, old.member_id)
		and m.status = 'active'
	) then
		raise exception 'Solo Miembros del grupo puntúan trivia'
			using errcode = '42501';
	end if;
	return coalesce(new, old);
end;
$$;

drop trigger if exists trivia_hits_group_coherence on public.trivia_hits;
create trigger trivia_hits_group_coherence
	before insert or update or delete on public.trivia_hits
	for each row execute function public.trivia_hits_group_coherence();

-- ============================================================
-- 6. Gamificación per-grupo
-- ============================================================
-- Cada pregunta alimenta la temporada abierta DE SU grupo y la insignia
-- first_question DE SU grupo. Maestro en A, semilla en B: posible.

create or replace function public.record_question_gamification()
returns trigger language plpgsql security definer set search_path = public
as $$
declare season uuid; badge uuid; n integer; v_group uuid;
begin
  v_group := new.group_id;
  if v_group is null then
    select group_id into v_group from public.sessions where id = new.session_id;
  end if;
  if v_group is null then return new; end if;

  select id into season from public.seasons
  where group_id = v_group and status = 'open'
  order by starts_at desc limit 1;
  if season is null then return new; end if;

  update public.counts
    set value = value + 1
    where member_id = new.author_id and event = 'question_created' and season_id = season;
  if not found then
    insert into public.counts (member_id, event, season_id, group_id, value)
      values (new.author_id, 'question_created', season, v_group, 1);
  end if;
  select value into n from public.counts where member_id = new.author_id and event = 'question_created' and season_id = season;
  select id into badge from public.badges where group_id = v_group and key = 'first_question';
  if n = 1 and badge is not null
    and not exists (select 1 from public.awards where badge_id = badge and member_id = new.author_id and group_id = v_group)
  then
    insert into public.awards (badge_id, member_id, session_id, group_id, trigger)
    values (badge, new.author_id, new.session_id, v_group, 'first_question');
  end if;
  return new;
end $$;

-- La asistencia se registra en la temporada (ya por grupo tras el lote A)
-- con su group_id: salir del grupo no arrastra conteos ajenos.
create or replace function public.record_session_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  season uuid;
  v_group uuid;
  participant record;
begin
  if old.status <> 'in_progress' or new.status <> 'closed' then
    return new;
  end if;

  season := new.season_id;
  if season is null then
    select id into season from public.seasons
    where group_id = new.group_id and status = 'open'
    order by starts_at desc limit 1;
    if season is null then return new; end if;
  end if;

  select group_id into v_group from public.seasons where id = season;
  if v_group is null then v_group := new.group_id; end if;

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
      insert into public.counts (member_id, event, season_id, group_id, value)
        values (participant.member_id, 'session_attended', season, v_group, 1);
    end if;
  end loop;

  return new;
end;
$$;

-- Cierre de trivia: insignia y conteo en el grupo de la sesión.
create or replace function public.finish_trivia_round(target_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
  correct int;
  a record;
  winner uuid;
  top_hits int;
  ties int;
  badge uuid;
  season uuid;
  v_group uuid;
begin
  select tr.* into r
  from trivia_rounds tr
  join sessions s on s.id = tr.session_id
  where tr.id = target_round_id and s.moderator_id = auth.uid();
  if not found then raise exception 'Solo el moderador'; end if;
  if r.status = 'board' then return; end if;

  v_group := r.group_id;
  if v_group is null then
    select group_id into v_group from sessions where id = r.session_id;
  end if;
  if v_group is not null and not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;

  if not r.locked then
    select correct_index into correct
    from trivia_items
    where trivia_id = r.trivia_id and sort_order = r.question_index + 1;
    for a in
      select member_id, option_index from trivia_answers
      where round_id = target_round_id and question_index = r.question_index
    loop
      if a.option_index = correct then
        insert into trivia_hits (round_id, member_id, hits)
        values (target_round_id, a.member_id, 1)
        on conflict (round_id, member_id)
        do update set hits = trivia_hits.hits + 1;
      end if;
    end loop;
  end if;

  update trivia_rounds set status = 'board', locked = false where id = target_round_id;

  select max(hits) into top_hits from trivia_hits where round_id = target_round_id;
  if top_hits is null or top_hits <= 0 then return; end if;

  select count(*) into ties from trivia_hits
  where round_id = target_round_id and hits = top_hits;
  if ties <> 1 then return; end if;

  select member_id into winner from trivia_hits
  where round_id = target_round_id and hits = top_hits;

  if v_group is null then return; end if;
  select id into badge from badges where group_id = v_group and key = 'elephant_memory';
  if badge is null then return; end if;

  if not exists (
    select 1 from awards where badge_id = badge and member_id = winner and group_id = v_group
  ) then
    insert into awards (badge_id, member_id, session_id, group_id, trigger)
    values (badge, winner, r.session_id, v_group, 'trivia_won');
  end if;

  select id into season from seasons where group_id = v_group and status = 'open' order by starts_at desc limit 1;
  if season is not null then
    update counts set value = value + 1
    where member_id = winner and event = 'trivia_won' and season_id = season;
    if not found then
      insert into counts (member_id, event, season_id, group_id, value)
      values (winner, 'trivia_won', season, v_group, 1);
    end if;
  end if;
end;
$$;

-- Bono del moderador (+1 pregunta caliente): temporada y conteo del grupo.
create or replace function public.extend_exposition(target_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  assignee_session uuid;
  author uuid;
  season uuid;
  v_group uuid;
begin
  select a.session_id into assignee_session
  from public.assignments a
  join public.sessions s on s.id = a.session_id
  where a.id = target_assignment_id
    and a.state = 'exposition'
    and s.status = 'in_progress'
    and s.moderator_id = auth.uid();
  if not found then
    raise exception 'Solo el Moderador puede extender en Exposición';
  end if;

  select s.group_id into v_group from public.sessions s where s.id = assignee_session;
  if v_group is not null and not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;

  update public.assignments
  set phase_started_at = coalesce(phase_started_at, now()) - interval '60 seconds'
  where id = target_assignment_id;

  select q.author_id into author
  from public.assignments a
  join public.questions q on q.id = a.question_id
  where a.id = target_assignment_id;

  if v_group is null then return; end if;
  select id into season from public.seasons
  where group_id = v_group and status = 'open' order by starts_at desc limit 1;
  if season is null then return; end if;

  update public.counts
  set value = value + 1
  where member_id = author and event = 'question_hot' and season_id = season;
  if not found then
    insert into public.counts (member_id, event, season_id, group_id, value)
    values (author, 'question_hot', season, v_group, 1);
  end if;
end;
$$;

-- Niveles: sesiones e insignias del grupo indicado; sin grupo, global
-- (compatibilidad con lecturas previas al multi-grupo).
drop function if exists public.compute_member_level(uuid);
create function public.compute_member_level(target_member_id uuid, p_group_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  sessions_total int := 0;
  insignias_count int := 0;
  lvl int := 0;
  title text := '';
  current_threshold int := 0;
  next_threshold int := 1;
  next_title text := 'Novato';
  next_insignias_required int := 0;
begin
  if p_group_id is null then
    select coalesce(sum(value), 0) into sessions_total
    from public.counts
    where member_id = target_member_id
      and event = 'session_attended';
    select count(*) into insignias_count
    from public.awards a
    join public.badges b on b.id = a.badge_id
    where a.member_id = target_member_id
      and b.kind = 'individual';
  else
    select coalesce(sum(value), 0) into sessions_total
    from public.counts
    where member_id = target_member_id
      and event = 'session_attended'
      and group_id = p_group_id;
    select count(*) into insignias_count
    from public.awards a
    join public.badges b on b.id = a.badge_id
    where a.member_id = target_member_id
      and a.group_id = p_group_id
      and b.kind = 'individual';
  end if;

  if sessions_total >= 50 and insignias_count >= 3 then
    lvl := 5; title := 'Sabio'; current_threshold := 50;
    next_threshold := 50; next_title := 'Sabio'; next_insignias_required := 3;
  elsif sessions_total >= 25 and insignias_count >= 2 then
    lvl := 4; title := 'Veterano'; current_threshold := 25;
    next_threshold := 50; next_title := 'Sabio'; next_insignias_required := 3;
  elsif sessions_total >= 12 and insignias_count >= 1 then
    lvl := 3; title := 'Habitual'; current_threshold := 12;
    next_threshold := 25; next_title := 'Veterano'; next_insignias_required := 2;
  elsif sessions_total >= 5 then
    lvl := 2; title := 'Parroquiano'; current_threshold := 5;
    next_threshold := 12; next_title := 'Habitual'; next_insignias_required := 1;
  elsif sessions_total >= 1 then
    lvl := 1; title := 'Novato'; current_threshold := 1;
    next_threshold := 5; next_title := 'Parroquiano'; next_insignias_required := 0;
  else
    lvl := 0; title := ''; current_threshold := 0;
    next_threshold := 1; next_title := 'Novato'; next_insignias_required := 0;
  end if;

  return jsonb_build_object(
    'level', lvl,
    'title', title,
    'sessions_attended', sessions_total,
    'insignias_count', insignias_count,
    'current_threshold', current_threshold,
    'next_threshold', next_threshold,
    'next_title', next_title,
    'next_insignias_required', next_insignias_required
  );
end;
$$;

grant execute on function public.compute_member_level(uuid, uuid) to authenticated, service_role;

-- Hitos colectivos por grupo: cada grupo celebra los suyos (mesa llena,
-- triviantes, debate intenso, exploradores, club de plata). El badge y el
-- award viven en el grupo del evento.
create or replace function public.check_mesa_llena()
returns void language plpgsql security definer set search_path = public
as $$
declare
  session_rec record;
  v_badge_id uuid;
  v_group uuid;
  v_active int;
begin
  for session_rec in
    select s.id, s.group_id, s.created_at
    from sessions s
    where s.status in ('closed', 'archived') and s.group_id is not null
    order by s.created_at
  loop
    v_group := session_rec.group_id;
    select id into v_badge_id from badges where group_id = v_group and key = 'mesa_llena';
    if v_badge_id is null then continue; end if;
    if exists (select 1 from awards a where a.badge_id = v_badge_id and a.group_id = v_group) then
      continue;
    end if;
    select count(*) into v_active from group_members gm
    join members m on m.id = gm.member_id
    where gm.group_id = v_group and m.status = 'active';
    if v_active < 2 then continue; end if;
    if (
      select count(distinct sp.member_id)
      from session_participants sp
      where sp.session_id = session_rec.id
        and sp.role != 'spectator'
    ) >= v_active then
      insert into awards (badge_id, member_id, session_id, group_id, trigger)
      values (v_badge_id, null, session_rec.id, v_group, 'mesa_llena');
    end if;
  end loop;
end $$;

create or replace function public.check_triviantes(target_session_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  participant_count int;
  answerer_count int;
  v_badge_id uuid;
  v_group uuid;
begin
  select group_id into v_group from sessions where id = target_session_id;
  if v_group is null then return; end if;
  select id into v_badge_id from badges where group_id = v_group and key = 'triviantes';
  if v_badge_id is null then return; end if;
  if exists (select 1 from awards a where a.badge_id = v_badge_id and a.group_id = v_group) then
    return;
  end if;
  select count(*) into participant_count
  from session_participants
  where session_id = target_session_id and role != 'spectator';
  if participant_count < 2 then return; end if;
  select count(distinct ta.member_id) into answerer_count
  from trivia_answers ta
  join trivia_rounds tr on tr.id = ta.round_id
  where tr.session_id = target_session_id;
  if answerer_count >= participant_count then
    insert into awards (badge_id, member_id, session_id, group_id, trigger)
    values (v_badge_id, null, target_session_id, v_group, 'triviantes');
  end if;
end $$;

create or replace function public.check_debate_intenso(target_session_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  question_count int;
  v_badge_id uuid;
  v_group uuid;
begin
  select group_id into v_group from sessions where id = target_session_id;
  if v_group is null then return; end if;
  select id into v_badge_id from badges where group_id = v_group and key = 'debate_intenso';
  if v_badge_id is null then return; end if;
  if exists (select 1 from awards a where a.badge_id = v_badge_id and a.group_id = v_group) then
    return;
  end if;
  select count(*) into question_count
  from questions
  where session_id = target_session_id;
  if question_count >= 10 then
    insert into awards (badge_id, member_id, session_id, group_id, trigger)
    values (v_badge_id, null, target_session_id, v_group, 'debate_intenso');
  end if;
end $$;

create or replace function public.check_exploradores()
returns void language plpgsql security definer set search_path = public
as $$
declare
  g record;
  material_count int;
  v_badge_id uuid;
begin
  for g in select id from groups loop
    select id into v_badge_id from badges where group_id = g.id and key = 'exploradores';
    if v_badge_id is null then continue; end if;
    if exists (select 1 from awards a where a.badge_id = v_badge_id and a.group_id = g.id) then
      continue;
    end if;
    select count(*) into material_count
    from materials
    where group_id = g.id and status in ('in_progress', 'finished');
    if material_count >= 5 then
      insert into awards (badge_id, member_id, session_id, group_id, trigger)
      values (v_badge_id, null, null, g.id, 'exploradores');
    end if;
  end loop;
end $$;

create or replace function public.check_club_de_plata()
returns void language plpgsql security definer set search_path = public
as $$
declare
  g record;
  session_count int;
  v_badge_id uuid;
begin
  for g in select id from groups loop
    select id into v_badge_id from badges where group_id = g.id and key = 'club_de_plata';
    if v_badge_id is null then continue; end if;
    if exists (select 1 from awards a where a.badge_id = v_badge_id and a.group_id = g.id) then
      continue;
    end if;
    select count(*) into session_count
    from sessions
    where group_id = g.id and status in ('closed', 'archived');
    if session_count >= 25 then
      insert into awards (badge_id, member_id, session_id, group_id, trigger)
      values (v_badge_id, null, null, g.id, 'club_de_plata');
    end if;
  end loop;
end $$;

-- ============================================================
-- 7. RPCs de sala/minijuegos/rating con cerradura por grupo
-- ============================================================
-- Salir del grupo revoca: cada RPC verifica is_group_member del grupo de
-- la sesión/take/ronda antes de operar (además de sus checks previos).

create or replace function public.create_trivia_with_items(
  p_material_id uuid,
  p_title text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  item jsonb;
  i int := 0;
  n int;
  v_group uuid;
begin
  if not public.is_member() then
    raise exception 'Solo miembros';
  end if;
  select group_id into v_group from materials where id = p_material_id;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de este material'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from sessions s
    where s.material_id = p_material_id and s.status = 'preparation' and s.group_id = v_group
  ) then
    raise exception 'Solo en preparación';
  end if;

  n := jsonb_array_length(p_items);
  if n < 3 or n > 5 then
    raise exception 'Una trivia necesita 3 a 5 preguntas';
  end if;

  insert into trivias (material_id, group_id, author_id, title)
  values (p_material_id, v_group, auth.uid(), trim(p_title))
  returning id into tid;

  for item in select * from jsonb_array_elements(p_items)
  loop
    i := i + 1;
    insert into trivia_items (trivia_id, prompt, options, correct_index, sort_order)
    values (
      tid,
      trim(item->>'prompt'),
      array[
        item->'options'->>0,
        item->'options'->>1,
        item->'options'->>2,
        item->'options'->>3
      ],
      (item->>'correct_index')::int,
      i
    );
  end loop;

  return tid;
end;
$$;

create or replace function public.start_trivia_round(
  target_session_id uuid,
  target_trivia_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
  mid uuid;
  n int;
  v_group uuid;
  v_trivia_group uuid;
begin
  select group_id into v_group from sessions where id = target_session_id;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;
  select material_id into mid from sessions
  where id = target_session_id and status = 'in_progress' and moderator_id = auth.uid() and group_id = v_group;
  if mid is null then
    raise exception 'Solo el moderador en sesión en curso';
  end if;

  select group_id into v_trivia_group from trivias where id = target_trivia_id;
  if v_trivia_group is distinct from v_group then
    raise exception 'Trivia no pertenece al grupo de la sesión'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from trivias t where t.id = target_trivia_id and t.material_id = mid
  ) then
    raise exception 'Trivia no pertenece al material';
  end if;

  select count(*) into n from trivia_rounds where session_id = target_session_id;
  if n >= 2 then
    raise exception 'Máximo 2 trivias por sesión';
  end if;

  if exists (
    select 1 from trivia_rounds
    where session_id = target_session_id and status = 'live'
  ) then
    raise exception 'Ya hay una trivia en curso';
  end if;

  select count(*) into n from trivia_items where trivia_id = target_trivia_id;
  if n < 3 or n > 5 then
    raise exception 'Trivia inválida';
  end if;

  insert into trivia_rounds (session_id, group_id, trivia_id)
  values (target_session_id, v_group, target_trivia_id)
  returning id into rid;

  return rid;
end;
$$;

create or replace function public.answer_trivia(
  target_round_id uuid,
  p_option_index int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
  v_group uuid;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select * into r from trivia_rounds where id = target_round_id;
  if not found then raise exception 'No hay pregunta abierta'; end if;
  v_group := r.group_id;
  if v_group is null then
    select group_id into v_group from sessions where id = r.session_id;
  end if;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;
  if r.status <> 'live' or r.locked then
    raise exception 'No hay pregunta abierta';
  end if;
  if p_option_index < 0 or p_option_index > 3 then
    raise exception 'Opción inválida';
  end if;
  if not exists (
    select 1 from sessions s where s.id = r.session_id and s.status = 'in_progress'
  ) then
    raise exception 'Sesión no en curso';
  end if;

  insert into trivia_answers (round_id, member_id, question_index, option_index)
  values (target_round_id, auth.uid(), r.question_index, p_option_index)
  on conflict do nothing;
end;
$$;

create or replace function public.start_take(
  target_session_id uuid,
  p_prompt text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  n int;
  v_group uuid;
begin
  select group_id into v_group from sessions where id = target_session_id;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from sessions
    where id = target_session_id and status = 'in_progress' and moderator_id = auth.uid()
  ) then
    raise exception 'Solo el moderador en sesión en curso';
  end if;

  if exists (select 1 from takes where session_id = target_session_id and status = 'open') then
    raise exception 'Ya hay un take abierto';
  end if;

  select count(*) into n from takes where session_id = target_session_id;
  if n >= 3 then
    raise exception 'Máximo 3 takes por sesión';
  end if;

  insert into takes (session_id, group_id, prompt, created_by)
  values (target_session_id, v_group, trim(p_prompt), auth.uid())
  returning id into tid;
  return tid;
end;
$$;

create or replace function public.vote_take(
  target_take_id uuid,
  p_position public.take_position
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select group_id into v_group from takes where id = target_take_id;
  if v_group is null then
    select group_id into v_group from sessions s join takes tk on tk.session_id = s.id where tk.id = target_take_id;
  end if;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from takes tk
    join sessions s on s.id = tk.session_id
    where tk.id = target_take_id and tk.status = 'open' and s.status = 'in_progress'
  ) then
    raise exception 'Take no abierto';
  end if;

  insert into take_votes (take_id, member_id, position)
  values (target_take_id, auth.uid(), p_position)
  on conflict do nothing;
end;
$$;

create or replace function public.cast_session_vote(
  target_session_id uuid,
  p_stars int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select group_id into v_group from sessions where id = target_session_id;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;
  if p_stars < 1 or p_stars > 5 then raise exception 'Estrellas 1-5'; end if;

  if not exists (
    select 1 from sessions s
    where s.id = target_session_id
      and s.status = 'in_progress'
      and s.rating_open
  ) then
    raise exception 'Votación cerrada';
  end if;

  if not exists (
    select 1 from session_participants sp
    where sp.session_id = target_session_id and sp.member_id = auth.uid()
  ) then
    raise exception 'Solo participantes confirmados';
  end if;

  insert into votes (session_id, group_id, member_id, stars)
  values (target_session_id, v_group, auth.uid(), p_stars)
  on conflict (session_id, member_id)
  do update set stars = excluded.stars;
end;
$$;

create or replace function public.cast_heart(
  target_assignment_id uuid,
  p_phase public.assignment_state,
  p_value int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a_rec record;
  sess_id uuid;
  v_group uuid;
  question_author_id uuid;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  if p_phase not in ('exposition', 'complement') then
    raise exception 'Fase inválida para corazones';
  end if;
  if p_value < 1 or p_value > 5 then raise exception 'Valor 1-5'; end if;

  select a.id, a.session_id, a.group_id, a.assignee_id, a.question_id, a.state
  into a_rec
  from assignments a
  where a.id = target_assignment_id and a.state = p_phase;

  if not found then
    raise exception 'La intervención no está en esa fase';
  end if;

  sess_id := a_rec.session_id;
  v_group := a_rec.group_id;
  if v_group is null then
    select group_id into v_group from sessions where id = sess_id;
  end if;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from sessions
    where id = sess_id and status = 'in_progress'
  ) then
    raise exception 'Sesión no en curso';
  end if;

  if not exists (
    select 1 from session_participants sp
    where sp.session_id = sess_id
      and sp.member_id = auth.uid()
  ) then
    raise exception 'Solo participantes presentes';
  end if;

  if p_phase = 'exposition' and a_rec.assignee_id = auth.uid() then
    raise exception 'No puedes votar en tu propia exposición';
  end if;

  if p_phase = 'complement' then
    select q.author_id into question_author_id
    from questions q where q.id = a_rec.question_id;

    if question_author_id = auth.uid() then
      raise exception 'No puedes votar en tu propio complemento';
    end if;
  end if;

  insert into hearts (assignment_id, member_id, phase, value, session_id, group_id)
  values (target_assignment_id, auth.uid(), p_phase, p_value, sess_id, v_group)
  on conflict (assignment_id, member_id, phase)
  do update set value = excluded.value;
end;
$$;

-- Lecturas de sala: solo miembros del grupo de la sesión.
create or replace function public.rating_progress(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s sessions%rowtype;
  voted int;
  total int;
  my_stars int;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select * into s from sessions where id = target_session_id;
  if not found then return null; end if;
  if s.group_id is null or not public.is_group_member(s.group_id) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;

  select count(*) into total from session_participants where session_id = target_session_id;
  select count(*) into voted from votes where session_id = target_session_id;
  select stars into my_stars from votes
  where session_id = target_session_id and member_id = auth.uid();

  return jsonb_build_object(
    'sessionId', s.id,
    'materialId', s.material_id,
    'ratingOpen', s.rating_open,
    'ratingAvg', s.rating_avg,
    'ratingCount', s.rating_count,
    'voted', voted,
    'total', total,
    'myStars', my_stars,
    'isModerator', s.moderator_id = auth.uid(),
    'isParticipant', exists (
      select 1 from session_participants sp
      where sp.session_id = s.id and sp.member_id = auth.uid()
    ),
    'sessionStatus', s.status
  );
end;
$$;

create or replace function public.trivia_round_snapshot(target_round_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r trivia_rounds%rowtype;
  item trivia_items%rowtype;
  n int;
  answered int;
  my_ans int;
  opt_counts int[] := array[0,0,0,0];
  board jsonb := '[]'::jsonb;
  winner_id uuid;
  winner_name text;
  v_group uuid;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select * into r from trivia_rounds where id = target_round_id;
  if not found then return null; end if;
  v_group := r.group_id;
  if v_group is null then
    select group_id into v_group from sessions where id = r.session_id;
  end if;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;

  select count(*) into n from trivia_items where trivia_id = r.trivia_id;
  select * into item from trivia_items
  where trivia_id = r.trivia_id and sort_order = r.question_index + 1;

  select count(*) into answered from trivia_answers
  where round_id = r.id and question_index = r.question_index;

  select option_index into my_ans from trivia_answers
  where round_id = r.id and question_index = r.question_index and member_id = auth.uid();

  if r.locked or r.status = 'board' then
    select array[
      count(*) filter (where option_index = 0),
      count(*) filter (where option_index = 1),
      count(*) filter (where option_index = 2),
      count(*) filter (where option_index = 3)
    ] into opt_counts
    from trivia_answers
    where round_id = r.id and question_index = r.question_index;
  end if;

  if r.status = 'board' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'memberId', h.member_id,
      'displayName', m.display_name,
      'hits', h.hits
    ) order by h.hits desc, m.display_name), '[]'::jsonb)
    into board
    from trivia_hits h
    join members m on m.id = h.member_id
    where h.round_id = r.id;

    select h.member_id, m.display_name into winner_id, winner_name
    from trivia_hits h
    join members m on m.id = h.member_id
    where h.round_id = r.id
    order by h.hits desc
    limit 1;

    if winner_id is not null then
      if (select count(*) from trivia_hits where round_id = r.id and hits = (
        select max(hits) from trivia_hits where round_id = r.id
      )) <> 1 or (select max(hits) from trivia_hits where round_id = r.id) <= 0 then
        winner_id := null;
        winner_name := null;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'roundId', r.id,
    'sessionId', r.session_id,
    'triviaId', r.trivia_id,
    'status', r.status,
    'questionIndex', r.question_index,
    'questionCount', n,
    'locked', r.locked,
    'prompt', case when r.status = 'live' then item.prompt else null end,
    'options', case when r.status = 'live' then to_jsonb(item.options) else null end,
    'answeredCount', answered,
    'myOption', my_ans,
    'optionCounts', case when r.locked or r.status = 'board' then to_jsonb(opt_counts) else null end,
    'scoreboard', board,
    'winnerId', winner_id,
    'winnerName', winner_name
  );
end;
$$;

create or replace function public.session_minigame_state(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  live_id uuid;
  board_id uuid;
  open_take uuid;
  bank jsonb;
  takes_json jsonb;
  v_group uuid;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  select group_id into v_group from sessions where id = target_session_id;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;

  select id into live_id from trivia_rounds
  where session_id = target_session_id and status = 'live'
  order by created_at desc limit 1;

  select id into board_id from trivia_rounds
  where session_id = target_session_id and status = 'board'
  order by created_at desc limit 1;

  select id into open_take from takes
  where session_id = target_session_id and status = 'open'
  order by created_at desc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'itemCount', (select count(*) from trivia_items i where i.trivia_id = t.id)
  ) order by t.created_at), '[]'::jsonb)
  into bank
  from trivias t
  join sessions s on s.material_id = t.material_id
  where s.id = target_session_id and t.group_id = v_group;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', tk.id,
    'prompt', tk.prompt,
    'status', tk.status,
    'counts', (
      select jsonb_build_object(
        'agree', count(*) filter (where position = 'agree'),
        'disagree', count(*) filter (where position = 'disagree'),
        'neutral', count(*) filter (where position = 'neutral')
      ) from take_votes v where v.take_id = tk.id
    )
  ) order by tk.created_at), '[]'::jsonb)
  into takes_json
  from takes tk where tk.session_id = target_session_id;

  return jsonb_build_object(
    'liveRoundId', live_id,
    'lastBoardRoundId', board_id,
    'openTakeId', open_take,
    'bank', bank,
    'takes', takes_json,
    'triviaRoundCount', (select count(*) from trivia_rounds where session_id = target_session_id),
    'takeCount', (select count(*) from takes where session_id = target_session_id)
  );
end;
$$;

-- Sorteo y avance: el moderador opera solo dentro de su grupo (un sorteo en
-- A nunca mezcla preguntas de B: la coherencia mismo-grupo lo impide y el
-- RPC lo verifica).
create or replace function public.execute_draw(target_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_draw uuid;
  v_group uuid;
begin
  select group_id into v_group from sessions where id = target_session_id;
  if v_group is null or not public.is_group_member(v_group) then
    raise exception 'No perteneces al grupo de esta sesión'
      using errcode = '42501';
  end if;
  if not exists (select 1 from sessions where id = target_session_id and moderator_id = auth.uid() and status = 'lobby') then
    raise exception 'Solo el Moderador puede ejecutar el Sorteo en el lobby';
  end if;
  if exists (select 1 from draws where session_id = target_session_id) then
    raise exception 'El Sorteo solo puede ejecutarse una vez';
  end if;

  insert into draws (session_id, group_id, status) values (target_session_id, v_group, 'hidden') returning id into new_draw;
  with eligible as (
    select sp.member_id, row_number() over (order by gen_random_uuid()) as slot
    from session_participants sp
    where sp.session_id = target_session_id and not sp.opt_out
  ), questions as (
    select q.id, q.author_id, row_number() over (order by gen_random_uuid()) as slot
    from questions q
    where q.session_id = target_session_id and not q.outside_draw and q.group_id = v_group
  ), pairs as (
    select q.id as question_id, e.member_id, row_number() over (order by gen_random_uuid()) as reveal_order
    from questions q cross join eligible e
    where q.author_id <> e.member_id
    order by gen_random_uuid()
    limit (select count(*) from eligible)
  )
  insert into assignments (session_id, group_id, question_id, assignee_id, reveal_order, draw_id)
  select target_session_id, v_group, question_id, member_id, reveal_order, new_draw from pairs;

  return new_draw;
end;
$$;
