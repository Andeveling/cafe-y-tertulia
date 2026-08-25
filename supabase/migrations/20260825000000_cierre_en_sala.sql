-- Ticket #32: Cierre dentro de la Sala — rating + cerrar sesión.
-- Agrega 'cierre' al enum room_stage: al completarse la última Intervención la
-- Sala pasa a Cierre en realtime para todos (advance_intervention hace el flip
-- y el UPDATE en sessions dispara la suscripción existente). El Moderador
-- también puede avanzar debate → cierre manualmente. El snapshot expone los
-- pendientes del checklist (trivia/takes abiertos); el cierre consolidado
-- sigue siendo el RPC close_session de cierre_sesion.sql (#20).

-- ============================================================
-- 1. Enum room_stage += 'cierre'
-- ============================================================

alter type public.room_stage add value if not exists 'cierre';

comment on column public.sessions.room_stage is
	'Etapa activa de la Sala: questions → presence → draw → debate → cierre (#29, #30, #32).';

-- ============================================================
-- 2. advance_room_stage: avance lineal hasta cierre
-- ============================================================

create or replace function public.advance_room_stage(
	target_session_id uuid,
	new_stage public.room_stage
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	current_stage public.room_stage;
begin
	-- Solo el Moderador puede avanzar etapas.
	if not exists (
		select 1 from sessions
		where id = target_session_id
			and moderator_id = auth.uid()
			and status in ('lobby', 'in_progress')
	) then
		raise exception 'Solo el Moderador puede avanzar etapas de la Sala';
	end if;

	select room_stage into current_stage
	from sessions where id = target_session_id;

	-- Avance lineal: questions → presence → draw → debate → cierre.
	-- Cierre solo se alcanza desde Debate: nunca con saltos.
	if (current_stage = 'questions' and new_stage not in ('presence', 'draw', 'debate'))
		or (current_stage = 'presence' and new_stage not in ('draw', 'debate'))
		or (current_stage = 'draw' and new_stage <> 'debate')
		or (current_stage = 'debate' and new_stage <> 'cierre')
		or (current_stage = 'cierre')
	then
		raise exception 'Avance de etapa inválido: % → %', current_stage, new_stage;
	end if;

	-- Para avanzar a draw, todos los members deben estar listos.
	if new_stage = 'draw' then
		if exists (
			select 1 from session_participants sp
			where sp.session_id = target_session_id
				and sp.role = 'member'
				and (
					not exists (
						select 1 from session_participants sp2
						where sp2.session_id = target_session_id
							and sp2.member_id = sp.member_id
					)
					or not exists (
						select 1 from questions q
						where q.session_id = target_session_id
							and q.author_id = sp.member_id
					)
				)
		) then
			raise exception 'No todos los participantes están Listos';
		end if;
	end if;

	-- Al pasar a debate, la sesión arranca (lobby → in_progress).
	if new_stage = 'debate' then
		update sessions
		set room_stage = 'debate',
		    status = 'in_progress'
		where id = target_session_id;
	else
		update sessions set room_stage = new_stage where id = target_session_id;
	end if;
end;
$$;

grant execute on function public.advance_room_stage(uuid, public.room_stage) to authenticated;

-- ============================================================
-- 3. advance_intervention: última Intervención completa → Cierre
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
		and a.state in ('preparation', 'exposition', 'complement')
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

	if cur.state = 'preparation' then
		nxt := 'exposition';
	elsif cur.state = 'exposition' then
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

	-- Al completarse la última Intervención, la Sala cambia a Cierre en
	-- realtime para todos (#32). El guard room_stage='debate' evita retroceder
	-- si el Moderador ya avanzó a mano.
	if nxt = 'complete' and not exists (
		select 1 from assignments a2
		where a2.session_id = target_session_id
			and a2.state <> 'complete'
	) then
		update sessions set room_stage = 'cierre'
		where id = target_session_id and room_stage = 'debate';
	end if;

	return nxt;
end;
$$;

grant execute on function public.advance_intervention(uuid) to authenticated;

-- ============================================================
-- ============================================================
-- 3b. reveal_next_assignment: cast del CASE a draw_status.
--     El original (lobby_sorteo.sql) asigna texto a la columna enum y falla
--     con 42883 en cada revelación; sin revelar no hay debate ni Cierre.
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
	update assignments set state = 'preparation' where session_id = target_session_id and reveal_order = next_order;
	return query select * from assignments where session_id = target_session_id and reveal_order = next_order;
end;
$$;

grant execute on function public.reveal_next_assignment(uuid) to authenticated;
revoke all on function public.reveal_next_assignment(uuid) from public;

-- ============================================================
-- 4. room_snapshot: pendientes del checklist de Cierre
--    Además corrige dos defectos heredados de 20260821140000/20260823000000
--    que nunca llegaron en migración: el agregado aplicaba `->>` al RECORD del
--    subquery (42883 para miembros autenticados) y emitía claves camelCase que
--    room.ts no parsea (la convención del proyecto es snake_case; solo el
--    bloque debate queda camelCase, como lo espera room.ts).
-- ============================================================

create or replace function public.room_snapshot(target_session_id uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
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

	-- Participantes con displayName, role, optOut
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

	-- Preguntas con visibilidad-aware
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

	-- Readiness
	select json_build_object(
		'total', coalesce(members_total.cnt, 0),
		'ready', coalesce(ready_cnt.cnt, 0),
		'all_ready', (coalesce(ready_cnt.cnt, 0) >= coalesce(members_total.cnt, 1))
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

	-- Draw
	select json_build_object(
		'done', exists (select 1 from draws d where d.session_id = target_session_id),
		'status', (select d.status from draws d where d.session_id = target_session_id)
	)
	into draw_json;

	-- Asignaciones post-sorteo
	select coalesce(json_agg(a.item order by (a.item->>'reveal_order')::int), '[]'::json)
	into assignments_json
	from (
		select json_build_object(
			'assignment_id', a.id,
			'question_id', a.question_id,
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

	-- Debate: solo cuando room_stage = 'debate'
	if sess.room_stage = 'debate' then
		-- Intervención activa (preparation, exposition, complement)
		select a.id, a.state, a.reveal_order, a.question_id, a.assignee_id, a.notes
		into active
		from assignments a
		where a.session_id = target_session_id
			and a.state in ('preparation', 'exposition', 'complement')
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
				'remainingHidden', (
					select count(*)::int from assignments
					where session_id = target_session_id and state = 'hidden'
				)
			);
		else
			-- Sin intervención activa: buscar próximo oculto o done
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

	-- Cierre: checklist de pendientes solo cuando room_stage = 'cierre'
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
$$;

grant execute on function public.room_snapshot(uuid) to authenticated;
revoke all on function public.room_snapshot(uuid), public.advance_room_stage(uuid, public.room_stage) from public;
