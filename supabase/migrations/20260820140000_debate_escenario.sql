-- Ticket #17: Escenario del moderador + Notas (SPEC §3.3 · ADR 0002)

-- Asignado guarda Notas solo en preparación (no puede mutar state).
create or replace function public.save_assignment_notes(
	target_assignment_id uuid,
	new_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	update assignments
	set notes = coalesce(new_notes, '')
	where id = target_assignment_id
		and assignee_id = auth.uid()
		and state = 'preparation';

	if not found then
		raise exception 'Solo el asignado puede guardar Notas en preparación';
	end if;
end;
$$;

grant execute on function public.save_assignment_notes(uuid, text) to authenticated;

-- Avanza la Intervención actual un paso (nunca corta por tiempo).
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
	return nxt;
end;
$$;

grant execute on function public.advance_intervention(uuid) to authenticated;

-- Snapshot del Escenario: no filtra la siguiente Pregunta oculta.
create or replace function public.stage_snapshot(target_session_id uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
	sess record;
	active record;
	nxt record;
	qtext text;
	aname text;
	assignee text;
	author text;
	my_notes text;
	my_id uuid := auth.uid();
begin
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	select s.id, s.status, s.moderator_id, s.material_id, s.range
	into sess
	from sessions s
	where s.id = target_session_id;

	if not found then
		return null;
	end if;

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

		return json_build_object(
			'sessionId', sess.id,
			'materialId', sess.material_id,
			'range', sess.range,
			'status', sess.status,
			'moderatorId', sess.moderator_id,
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
	end if;

	-- Entre intervenciones o al inicio: solo nombre del próximo, sin pregunta.
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

		return json_build_object(
			'sessionId', sess.id,
			'materialId', sess.material_id,
			'range', sess.range,
			'status', sess.status,
			'moderatorId', sess.moderator_id,
			'mode', 'waiting_reveal',
			'nextAssigneeName', assignee,
			'nextAssigneeId', nxt.assignee_id,
			'revealOrder', nxt.reveal_order,
			'remainingHidden', (
				select count(*)::int from assignments
				where session_id = target_session_id and state = 'hidden'
			)
		);
	end if;

	return json_build_object(
		'sessionId', sess.id,
		'materialId', sess.material_id,
		'range', sess.range,
		'status', sess.status,
		'moderatorId', sess.moderator_id,
		'mode', 'done',
		'remainingHidden', 0
	);
end;
$$;

grant execute on function public.stage_snapshot(uuid) to authenticated;

revoke all on function public.save_assignment_notes(uuid, text),
	public.advance_intervention(uuid),
	public.stage_snapshot(uuid)
from public;
