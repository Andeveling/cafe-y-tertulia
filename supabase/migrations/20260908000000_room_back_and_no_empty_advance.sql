-- No avanzar sin participantes + el Moderador puede volver atrás un paso.
-- 1. advance_room_stage: bloquea avances sin members y permite retroceso
--    inmediato (presence→questions, draw→presence, debate→draw). Cierre sigue
--    terminal (ticket #32 test 5). Retroceder a presence/questions con sorteo
--    ya ejecutado se bloquea para no dejar asignaciones huérfanas.
-- 2. room_snapshot: all_ready = false cuando no hay members (0/0 no es listo).
-- 3. execute_draw: exige al menos un member y una pregunta sorteable.

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
	is_forward boolean;
	is_backward boolean;
	member_count int;
begin
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

	-- Avance lineal hacia adelante (igual que antes).
	is_forward :=
		(current_stage = 'questions' and new_stage in ('presence', 'draw', 'debate'))
		or (current_stage = 'presence' and new_stage in ('draw', 'debate'))
		or (current_stage = 'draw' and new_stage = 'debate')
		or (current_stage = 'debate' and new_stage = 'cierre');

	-- Retroceso de un paso (cierre terminal: sin salida).
	is_backward :=
		(current_stage = 'presence' and new_stage = 'questions')
		or (current_stage = 'draw' and new_stage = 'presence')
		or (current_stage = 'debate' and new_stage = 'draw');

	if not is_forward and not is_backward then
		if current_stage = 'cierre' then
			raise exception 'Avance de etapa inválido: % → %', current_stage, new_stage;
		end if;
		raise exception 'Avance de etapa inválido: % → %', current_stage, new_stage;
	end if;

	select count(*)::int into member_count
	from session_participants sp
	where sp.session_id = target_session_id
		and sp.role = 'member';

	-- Presentes es el paso de unirse: se puede llegar vacío.
	-- Sorteo y Debate sí exigen al menos un member.
	if is_forward and new_stage in ('draw', 'debate') and member_count = 0 then
		raise exception 'Se necesita al menos un participante para avanzar';
	end if;

	-- Con sorteo ya ejecutado no se vuelve a preguntas/presentes.
	if is_backward and new_stage in ('questions', 'presence')
		and exists (select 1 from draws where session_id = target_session_id)
	then
		raise exception 'Ya se ejecutó el sorteo, no se puede volver atrás';
	end if;

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

	-- Cierre: sorteo revelado, o ya no queda ninguna asignación oculta.
	if new_stage = 'cierre' and exists (
		select 1 from draws
		where session_id = target_session_id
			and status <> 'revealed'
	) and exists (
		select 1 from assignments
		where session_id = target_session_id
			and state = 'hidden'
	) then
		raise exception 'Revela primero el Sorteo';
	end if;

	if new_stage = 'cierre' then
		update draws
		set status = 'revealed'
		where session_id = target_session_id
			and status <> 'revealed'
			and not exists (
				select 1 from assignments
				where session_id = target_session_id
					and state = 'hidden'
			);
	end if;

	if new_stage = 'debate' and current_stage <> 'debate' then
		update sessions
		set room_stage = 'debate',
		    status = 'in_progress'
		where id = target_session_id;
	elsif new_stage = 'draw' and current_stage = 'debate' then
		-- Volver del debate al sorteo reabre el lobby.
		update sessions
		set room_stage = 'draw',
		    status = 'lobby'
		where id = target_session_id;
	else
		update sessions set room_stage = new_stage where id = target_session_id;
	end if;
end;
$$;

grant execute on function public.advance_room_stage(uuid, public.room_stage) to authenticated;

-- room_snapshot: 0/0 no es "todos listos".
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
$$;

grant execute on function public.room_snapshot(uuid) to authenticated;

-- execute_draw: sin participantes o sin preguntas no hay sorteo.
create or replace function public.execute_draw(target_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_draw uuid;
	person uuid;
	pick uuid;
begin
	if not exists (
		select 1 from sessions
		where id = target_session_id
			and moderator_id = auth.uid()
			and status = 'lobby'
	) then
		raise exception 'Solo el Moderador puede ejecutar el Sorteo en el lobby';
	end if;

	if exists (select 1 from draws where session_id = target_session_id) then
		raise exception 'El Sorteo solo puede ejecutarse una vez';
	end if;

	if not exists (
		select 1 from session_participants sp
		where sp.session_id = target_session_id
			and sp.role = 'member'
	) then
		raise exception 'Se necesita al menos un participante para el sorteo';
	end if;

	if not exists (
		select 1 from questions q
		where q.session_id = target_session_id
			and not q.outside_draw
	) then
		raise exception 'Se necesita al menos una pregunta para el sorteo';
	end if;

	insert into draws (session_id, status)
	values (target_session_id, 'hidden')
	returning id into new_draw;

	create temporary table _draw_pairs (
		question_id uuid not null,
		assignee_id uuid not null
	) on commit drop;

	for person in
		select sp.member_id
		from session_participants sp
		where sp.session_id = target_session_id
			and not sp.opt_out
			and sp.role = 'member'
		order by gen_random_uuid()
	loop
		pick := null;
		select q.id into pick
		from questions q
		where q.session_id = target_session_id
			and not q.outside_draw
			and q.author_id is distinct from person
			and (
				select count(*) from _draw_pairs p where p.question_id = q.id
			) < 2
		order by gen_random_uuid()
		limit 1;

		if pick is not null then
			insert into _draw_pairs (question_id, assignee_id)
			values (pick, person);
		end if;
	end loop;

	insert into assignments (
		session_id, question_id, assignee_id, reveal_order, draw_id
	)
	select
		target_session_id,
		question_id,
		assignee_id,
		row_number() over (order by gen_random_uuid()),
		new_draw
	from _draw_pairs;

	return new_draw;
end;
$$;

grant execute on function public.execute_draw(uuid) to authenticated;
