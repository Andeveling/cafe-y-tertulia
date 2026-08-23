-- Ticket #30: Debate dentro de la Sala — unifica la etapa Debate en la Sala
-- de Sesión. Agrega 'debate' al enum room_stage, extiende advance_room_stage
-- para permitir draw → debate (cambiando session status a in_progress), y
-- extiende room_snapshot para devolver datos de debate cuando room_stage = 'debate'.

-- ============================================================
-- 1. Agregar 'debate' al enum room_stage
-- ============================================================

alter type public.room_stage add value if not exists 'debate';

-- ============================================================
-- 2. Actualizar advance_room_stage: draw → debate
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

	-- Avance lineal: questions → presence → draw → debate.
	if (current_stage = 'questions' and new_stage not in ('presence', 'draw', 'debate'))
		or (current_stage = 'presence' and new_stage not in ('draw', 'debate'))
		or (current_stage = 'draw' and new_stage <> 'debate')
		or (current_stage = 'debate')
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
-- 3. Extender room_snapshot con datos de debate
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
	select coalesce(json_agg(p order by p->>'displayName'), '[]'::json)
	into participants_json
	from (
		select json_build_object(
			'memberId', sp.member_id,
			'displayName', coalesce(m.display_name, 'Miembro'),
			'role', sp.role,
			'optOut', sp.opt_out
		) as json
		from session_participants sp
		join members m on m.id = sp.member_id
		where sp.session_id = target_session_id
	) p;

	-- Preguntas con visibilidad-aware
	select coalesce(json_agg(q order by q->>'createdAt'), '[]'::json)
	into questions_json
	from (
		select json_build_object(
			'id', q.id,
			'authorId', q.author_id,
			'authorName', coalesce(m.display_name, 'Miembro'),
			'text', case
				when q.author_id = my_id then q.text
				else null
			end,
			'isMine', (q.author_id = my_id),
			'outsideDraw', q.outside_draw,
			'createdAt', q.created_at
		) as json
		from questions q
		join members m on m.id = q.author_id
		where q.session_id = target_session_id
	) q;

	-- Readiness
	select json_build_object(
		'total', coalesce(members_total.cnt, 0),
		'ready', coalesce(ready_cnt.cnt, 0),
		'allReady', (coalesce(ready_cnt.cnt, 0) >= coalesce(members_total.cnt, 1))
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
	select coalesce(json_agg(a order by (a->>'revealOrder')::int), '[]'::json)
	into assignments_json
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
					when q.author_id = my_id then q.text
					else null
				end,
			'questionVisible',
				(a.state <> 'hidden' or q.author_id = my_id)
		) as json
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

	return json_build_object(
		'sessionId', sess.id,
		'materialId', sess.material_id,
		'range', sess.range,
		'status', sess.status,
		'moderatorId', sess.moderator_id,
		'roomStage', sess.room_stage,
		'participants', participants_json,
		'questions', questions_json,
		'readiness', readiness_json,
		'draw', draw_json,
		'assignments', assignments_json,
		'debate', debate_json
	);
end;
$$;

grant execute on function public.room_snapshot(uuid) to authenticated;
revoke all on function public.room_snapshot(uuid), public.advance_room_stage(uuid, public.room_stage) from public;
