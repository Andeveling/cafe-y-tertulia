-- Debate sin Preparación: la Intervención pasa a
-- oculta → exposición → complemento → completa. En la práctica la tertulia
-- ya funciona así (exposición con reloj + complemento del autor).
--
-- 1. Backfill: lo que esté en preparation pasa a exposition.
-- 2. Enum assignment_state recreado sin 'preparation' (Postgres no permite
--    borrar valores de un enum en uso).
-- 3. reveal_next_assignment revela directo en exposition.
-- 4. advance_intervention pierde la rama preparation.
-- 5. save_assignment_notes se elimina: las Notas salen del debate (la
--    columna queda como historia; las notas personales serán otra tarjeta).
-- 6. room_snapshot: la Intervención activa ya no incluye preparation.
-- 7. Nuevo evento question_hot + RPC extend_exposition: el +1 del moderador
--    suma 60 s (mueve el ancla atrás) y registra el bono al autor.

-- ============================================================
-- 1. Backfill + 2. recrear enum
-- ============================================================

update public.assignments set state = 'exposition' where state = 'preparation';

-- advance_intervention devuelve el enum: hay que soltarla para el swap.
drop function if exists public.advance_intervention(uuid);

-- Tres policies referencian assignments.state y bloquean el cambio de tipo:
-- se sueltan y se recrean idénticas tras el swap.
drop policy if exists "assignments_select_after_draw" on public.assignments;
drop policy if exists "assignments_select_anon" on public.assignments;
drop policy if exists "questions_select_member" on public.questions;

-- El trigger del reloj también referencia la columna: soltar y recrear.
drop trigger if exists assignments_touch_phase_clock on public.assignments;

alter type public.assignment_state rename to assignment_state_old;

create type public.assignment_state as enum (
	'hidden', 'exposition', 'complement', 'complete'
);

alter table public.assignments alter column state drop default;

alter table public.assignments
	alter column state type public.assignment_state
	using state::text::public.assignment_state;

alter table public.assignments alter column state set default 'hidden';

drop type public.assignment_state_old;

create or replace function public.assignments_touch_phase_clock()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	if tg_op = 'INSERT' or new.state is distinct from old.state then
		new.phase_started_at := now();
	end if;
	return new;
end;
$$;

drop trigger if exists assignments_touch_phase_clock on public.assignments;
create trigger assignments_touch_phase_clock
	before insert or update of state on public.assignments
	for each row
	execute function public.assignments_touch_phase_clock();

-- Recrear las policies tal cual (ver ticket #28 e histórico público).
create policy "assignments_select_after_draw" on public.assignments
	for select to authenticated using (
		public.is_member()
		and exists (
			select 1 from public.draws d
			where d.session_id = assignments.session_id
		)
	);

create policy "assignments_select_anon" on public.assignments
	for select to anon using (
		exists (
			select 1 from public.draws d
			where d.id = draw_id and d.status <> 'hidden'
		)
		and public.is_session_archived(session_id)
	);

create policy "questions_select_member" on public.questions
	for select
	to authenticated
	using (
		public.is_member()
		and (
			not exists (
				select 1 from public.draws d
				where d.session_id = questions.session_id
			)
			or author_id = auth.uid()
			or exists (
				select 1 from public.assignments a
				where a.question_id = questions.id
				and a.state <> 'hidden'
			)
		)
	);

-- ============================================================
-- 3. reveal_next_assignment: directo a exposition
-- ============================================================

create or replace function public.reveal_next_assignment(target_session_id uuid)
returns setof public.assignments
language plpgsql
security definer
set search_path = public
as $$
declare next_order int;
begin
	if not exists (select 1 from sessions where id = target_session_id and moderator_id = auth.uid()) then
		raise exception 'Solo el Moderador puede revelar';
	end if;
	select min(a.reveal_order) into next_order from assignments a join draws d on d.id = a.draw_id where a.session_id = target_session_id and a.state = 'hidden';
	if next_order is null then return; end if;
	update draws set status = case when (select count(*) from assignments where session_id = target_session_id and state = 'hidden') = 1 then 'revealed'::public.draw_status else 'revealing'::public.draw_status end where session_id = target_session_id;
	update assignments set state = 'exposition' where session_id = target_session_id and reveal_order = next_order;
	return query select * from assignments where session_id = target_session_id and reveal_order = next_order;
end;
$$;

grant execute on function public.reveal_next_assignment(uuid) to authenticated;
revoke all on function public.reveal_next_assignment(uuid) from public;

-- ============================================================
-- 4. advance_intervention: sin rama preparation
-- ============================================================

create or replace function public.advance_intervention(target_session_id uuid)
returns public.assignment_state
language plpgsql
security definer
set search_path = public
as $$
declare
	cur record;
	nxt public.assignment_state;
	author_here boolean;
	last_for_q boolean;
begin
	if not exists (
		select 1 from sessions
		where id = target_session_id
			and moderator_id = auth.uid()
			and status = 'in_progress'
	) then
		raise exception 'Solo el Moderador puede avanzar en en_curso';
	end if;

	select a.* into cur
	from assignments a
	where a.session_id = target_session_id
		and a.state in ('exposition', 'complement')
	order by a.reveal_order
	limit 1;

	if not found then
		raise exception 'No hay Intervención activa';
	end if;

	select exists (
		select 1 from session_participants sp
		join questions q on q.id = cur.question_id
		where sp.session_id = target_session_id
			and sp.member_id = q.author_id
	) into author_here;

	select not exists (
		select 1 from assignments a2
		where a2.session_id = target_session_id
			and a2.question_id = cur.question_id
			and a2.id <> cur.id
			and a2.state <> 'complete'
	) into last_for_q;

	if cur.state = 'exposition' then
		if author_here and last_for_q then
			nxt := 'complement';
		else
			nxt := 'complete';
		end if;
	elsif cur.state = 'complement' then
		nxt := 'complete';
	else
		raise exception 'Estado no avanzable';
	end if;

	update assignments set state = nxt where id = cur.id;

	if nxt = 'complete' and not exists (
		select 1 from assignments a2
		where a2.session_id = target_session_id
			and a2.state <> 'complete'
	) then
		update draws set status = 'revealed'
		where session_id = target_session_id and status <> 'revealed';
		update sessions set room_stage = 'cierre'
		where id = target_session_id and room_stage = 'debate';
	end if;

	return nxt;
end;
$$;

grant execute on function public.advance_intervention(uuid) to authenticated;

-- ============================================================
-- 5. Fuera Notas del debate (columna queda como historia)
-- ============================================================

drop function if exists public.save_assignment_notes(uuid, text);
drop function if exists public.stage_snapshot(uuid);

-- ============================================================
-- 7. Evento question_hot + RPC extend_exposition (+60 s y bono al autor)
-- ============================================================

alter type public.count_event add value if not exists 'question_hot';

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

	update public.assignments
	set phase_started_at = coalesce(phase_started_at, now()) - interval '60 seconds'
	where id = target_assignment_id;

	select q.author_id into author
	from public.assignments a
	join public.questions q on q.id = a.question_id
	where a.id = target_assignment_id;

	select id into season from public.seasons
	where status = 'open' order by starts_at desc limit 1;
	if season is null then return; end if;

	update public.counts
	set value = value + 1
	where member_id = author and event = 'question_hot' and season_id = season;
	if not found then
		insert into public.counts (member_id, event, season_id, value)
		values (author, 'question_hot', season, 1);
	end if;
end;
$$;

grant execute on function public.extend_exposition(uuid) to authenticated;

-- ============================================================
-- 6. room_snapshot vigente: activa sin preparation (definición generada
--    desde la DB local el 2026-09-15 + cambio de una línea)
-- ============================================================

CREATE OR REPLACE FUNCTION public.room_snapshot(target_session_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
	sess record;
	my_id uuid := auth.uid();
	participants_json json;
	questions_json json;
	draw_json json;
	readiness_json json;
	assignments_json json;
	debate_json json;
	cierre_json json;
	active record;
	nxt record;
	qtext text;
	aname text;
	assignee text;
	author text;
	my_notes text;
begin
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	select s.id, s.material_id, s.range, s.status, s.moderator_id, s.room_stage
	into sess
	from sessions s
	where s.id = target_session_id;

	if not found then
		return null;
	end if;

	select coalesce(json_agg(p.item order by p.item->>'display_name'), '[]'::json)
	into participants_json
	from (
		select json_build_object(
			'member_id', sp.member_id,
			'display_name', coalesce(m.display_name, 'Miembro'),
			'role', sp.role,
			'opt_out', sp.opt_out
		) as item
		from session_participants sp
		join members m on m.id = sp.member_id
		where sp.session_id = target_session_id
	) p;

	select coalesce(json_agg(q.item order by q.item->>'created_at'), '[]'::json)
	into questions_json
	from (
		select json_build_object(
			'id', q.id,
			'author_id', q.author_id,
			'author_name', coalesce(m.display_name, 'Miembro'),
			'text', case
				when q.author_id = my_id then q.text
				else null
			end,
			'is_mine', (q.author_id = my_id),
			'outside_draw', q.outside_draw,
			'created_at', q.created_at
		) as item
		from questions q
		join members m on m.id = q.author_id
		where q.session_id = target_session_id
	) q;

	select json_build_object(
		'total', coalesce(members_total.cnt, 0),
		'ready', coalesce(ready_cnt.cnt, 0),
		'all_ready', (
			coalesce(members_total.cnt, 0) > 0
			and coalesce(ready_cnt.cnt, 0) >= coalesce(members_total.cnt, 0)
		)
	)
	into readiness_json
	from
		(select count(*)::int as cnt
		 from session_participants sp
		 where sp.session_id = target_session_id
		   and sp.role = 'member') as members_total,
		(select count(*)::int as cnt
		 from session_participants sp
		 where sp.session_id = target_session_id
		   and sp.role = 'member'
		   and exists (
			   select 1 from questions q
			   where q.session_id = target_session_id
			     and q.author_id = sp.member_id
		   )) as ready_cnt;

	select json_build_object(
		'done', exists (select 1 from draws d where d.session_id = target_session_id),
		'status', (select d.status from draws d where d.session_id = target_session_id),
		'created_at', (select d.created_at from draws d where d.session_id = target_session_id)
	)
	into draw_json;

	select coalesce(json_agg(a.item order by (a.item->>'reveal_order')::int), '[]'::json)
	into assignments_json
	from (
		select json_build_object(
			'assignment_id', a.id,
			'question_id', a.question_id,
			'author_id', q.author_id,
			'assignee_id', a.assignee_id,
			'author_name', m_author.display_name,
			'assignee_name', m_assignee.display_name,
			'state', a.state,
			'reveal_order', a.reveal_order,
			'question_text',
				case
					when a.state <> 'hidden' then q.text
					when q.author_id = my_id then q.text
					else null
				end,
			'question_visible',
				(a.state <> 'hidden' or q.author_id = my_id)
		) as item
		from assignments a
		join questions q on q.id = a.question_id
		join members m_author on m_author.id = q.author_id
		join members m_assignee on m_assignee.id = a.assignee_id
		where a.session_id = target_session_id
	) a;

	if sess.room_stage = 'debate' then
		select a.id, a.state, a.reveal_order, a.question_id, a.assignee_id, a.notes, a.phase_started_at
		into active
		from assignments a
		where a.session_id = target_session_id
			and a.state in ('exposition', 'complement')
		order by a.reveal_order
		limit 1;

		if found then
			select q.text, m.display_name, ma.display_name
			into qtext, author, assignee
			from questions q
			join members m on m.id = q.author_id
			join members ma on ma.id = active.assignee_id
			where q.id = active.question_id;

			if active.assignee_id = my_id then
				my_notes := active.notes;
			end if;

			debate_json := json_build_object(
				'mode', 'active',
				'assignmentId', active.id,
				'state', active.state,
				'questionText', qtext,
				'assigneeName', assignee,
				'assigneeId', active.assignee_id,
				'authorName', author,
				'revealOrder', active.reveal_order,
				'myNotes', my_notes,
				'phaseStartedAt', active.phase_started_at,
				'remainingHidden', (
					select count(*)::int from assignments
					where session_id = target_session_id and state = 'hidden'
				)
			);
		else
			select a.id, a.assignee_id, a.reveal_order
			into nxt
			from assignments a
			where a.session_id = target_session_id
				and a.state = 'hidden'
			order by a.reveal_order
			limit 1;

			if found then
				select m.display_name into assignee
				from members m where m.id = nxt.assignee_id;

				debate_json := json_build_object(
					'mode', 'waiting_reveal',
					'nextAssigneeName', assignee,
					'nextAssigneeId', nxt.assignee_id,
					'revealOrder', nxt.reveal_order,
					'remainingHidden', (
						select count(*)::int from assignments
						where session_id = target_session_id and state = 'hidden'
					)
				);
			else
				debate_json := json_build_object(
					'mode', 'done',
					'remainingHidden', 0
				);
			end if;
		end if;
	else
		debate_json := null;
	end if;

	if sess.room_stage = 'cierre' then
		cierre_json := json_build_object(
			'open_trivia', (
				select count(*)::int from trivia_rounds
				where session_id = target_session_id and status = 'live'
			),
			'open_takes', (
				select count(*)::int from takes
				where session_id = target_session_id and status = 'open'
			)
		);
	else
		cierre_json := null;
	end if;

	return json_build_object(
		'session_id', sess.id,
		'material_id', sess.material_id,
		'range', sess.range,
		'status', sess.status,
		'moderator_id', sess.moderator_id,
		'room_stage', sess.room_stage,
		'participants', participants_json,
		'questions', questions_json,
		'readiness', readiness_json,
		'draw', draw_json,
		'assignments', assignments_json,
		'debate', debate_json,
		'cierre', cierre_json
	);
end;
$function$

;
