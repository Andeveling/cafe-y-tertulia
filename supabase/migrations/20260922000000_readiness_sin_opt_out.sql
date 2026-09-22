-- Readiness sin espectadores: quien se marca "Sin sorteo" (opt_out)
-- o pasa a espectador por el Moderador no cuenta para el total ni para
-- Listos. Antes, un espectador sin pregunta dejaba "Faltan 1" fantasma
-- en Presentes y all_ready falso bloqueaba el avance a Sorteo.
-- room_snapshot: cuerpo idéntico a 20260920000000_members_avatar.sql
-- salvo los dos conteos de readiness. advance_room_stage: cuerpo idéntico
-- a 20260921210000_questions_min_two_ready.sql salvo el guard de Sorteo.
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
	assignee_avatar text;
	author_avatar text;
	next_assignee_avatar text;
	my_notes text;
	hearts_json json;
	eligible_count int;
	question_author_id uuid;
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
			'avatar', m.avatar,
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
			'author_avatar', m.avatar,
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
		   and sp.role = 'member'
		   and not sp.opt_out) as members_total,
		(select count(*)::int as cnt
		 from session_participants sp
		 where sp.session_id = target_session_id
		   and sp.role = 'member'
		   and not sp.opt_out
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

	-- Asignaciones: incluye columnas aprecio + avatares de autor y asignado
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
			'author_avatar', m_author.avatar,
			'assignee_avatar', m_assignee.avatar,
			'state', a.state,
			'reveal_order', a.reveal_order,
			'question_text',
				case
					when a.state <> 'hidden' then q.text
					when q.author_id = my_id then q.text
					else null
				end,
			'question_visible',
				(a.state <> 'hidden' or q.author_id = my_id),
			'aprecio_exposition_avg', a.aprecio_exposition_avg,
			'aprecio_exposition_count', a.aprecio_exposition_count,
			'aprecio_complement_avg', a.aprecio_complement_avg,
			'aprecio_complement_count', a.aprecio_complement_count
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
			select q.text, m.display_name, ma.display_name, m.avatar, ma.avatar
			into qtext, author, assignee, author_avatar, assignee_avatar
			from questions q
			join members m on m.id = q.author_id
			join members ma on ma.id = active.assignee_id
			where q.id = active.question_id;

			if active.assignee_id = my_id then
				my_notes := active.notes;
			end if;

			-- Hearts: progreso de la fase activa
			if active.state in ('exposition', 'complement') then
				if active.state = 'exposition' then
					-- Todos menos el asignado
					select count(*)::int into eligible_count
					from session_participants sp
					where sp.session_id = target_session_id
					  and sp.member_id <> active.assignee_id;
				else
					-- Complemento: todos menos el autor
					select q.author_id into question_author_id
					from questions q where q.id = active.question_id;

					select count(*)::int into eligible_count
					from session_participants sp
					where sp.session_id = target_session_id
					  and sp.member_id <> question_author_id;
				end if;

				hearts_json := json_build_object(
					'my_heart', (
						select h.value from hearts h
						where h.assignment_id = active.id
						  and h.member_id = my_id
						  and h.phase = active.state
					),
					'voted', (
						select count(*)::int from hearts h
						where h.assignment_id = active.id
						  and h.phase = active.state
					),
					'eligible', eligible_count
				);
			else
				hearts_json := null;
			end if;

			debate_json := json_build_object(
				'mode', 'active',
				'assignmentId', active.id,
				'state', active.state,
				'questionText', qtext,
				'assigneeName', assignee,
				'assigneeId', active.assignee_id,
				'assigneeAvatar', assignee_avatar,
				'authorName', author,
				'authorAvatar', author_avatar,
				'revealOrder', active.reveal_order,
				'myNotes', my_notes,
				'phaseStartedAt', active.phase_started_at,
				'hearts', hearts_json,
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
				select m.display_name, m.avatar into assignee, next_assignee_avatar
				from members m where m.id = nxt.assignee_id;

				debate_json := json_build_object(
					'mode', 'waiting_reveal',
					'nextAssigneeName', assignee,
					'nextAssigneeId', nxt.assignee_id,
					'nextAssigneeAvatar', next_assignee_avatar,
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

-- Guard de Sorteo sin espectadores: igual que el mínimo de Preguntas
-- (20260921210000), el avance a Sorteo solo exige pregunta a quien
-- entra al sorteo (role member sin opt_out).
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
	ready_count int;
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

	is_forward :=
		(current_stage = 'questions' and new_stage in ('presence', 'draw', 'debate'))
		or (current_stage = 'presence' and new_stage in ('draw', 'debate'))
		or (current_stage = 'draw' and new_stage = 'debate')
		or (current_stage = 'debate' and new_stage = 'cierre');

	is_backward :=
		(current_stage = 'presence' and new_stage = 'questions')
		or (current_stage = 'draw' and new_stage = 'presence')
		or (current_stage = 'debate' and new_stage = 'draw');

	if not is_forward and not is_backward then
		raise exception 'Avance de etapa inválido: % → %', current_stage, new_stage;
	end if;

	select count(*)::int into member_count
	from session_participants sp
	where sp.session_id = target_session_id
		and sp.role = 'member';

	if is_forward and new_stage in ('draw', 'debate') and member_count = 0 then
		raise exception 'Se necesita al menos un participante para avanzar';
	end if;

	-- Mínimo para empezar: dos miembros, cada uno con una pregunta.
	-- Un autor con dos preguntas no cuenta como dos.
	if is_forward and current_stage = 'questions' then
		select count(*)::int into ready_count
		from session_participants sp
		where sp.session_id = target_session_id
			and sp.role = 'member'
			and not sp.opt_out
			and exists (
				select 1 from questions q
				where q.session_id = target_session_id
					and q.author_id = sp.member_id
			);
		if ready_count < 2 then
			raise exception 'Se necesitan al menos dos participantes con pregunta para avanzar';
		end if;
	end if;

	if is_backward and new_stage in ('questions', 'presence')
		and exists (select 1 from draws where session_id = target_session_id)
	then
		raise exception 'Ya se ejecutó el sorteo, no se puede volver atrás';
	end if;

	-- Ir a Sorteo no exige Listo de quien especta (opt_out) ni de quien
	-- no tiene pregunta: no entran al 1:1. El mínimo de 2 con pregunta
	-- lo verifica execute_draw.

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
