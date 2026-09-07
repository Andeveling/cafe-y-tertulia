-- Unblock debate → cierre when every assignment is already out of 'hidden'
-- but draws.status never flipped to 'revealed' (count-of-hidden = 1 check
-- misses the 0-hidden case). Also mark the draw revealed when the last
-- intervención completes.

-- 1. Backfill stuck draws
update public.draws d
set status = 'revealed'
where d.status <> 'revealed'
	and not exists (
		select 1
		from public.assignments a
		where a.session_id = d.session_id
			and a.state = 'hidden'
	);

-- 2. advance_room_stage: allow Cierre if the Sorteo is consumed
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

	if (current_stage = 'questions' and new_stage not in ('presence', 'draw', 'debate'))
		or (current_stage = 'presence' and new_stage not in ('draw', 'debate'))
		or (current_stage = 'draw' and new_stage <> 'debate')
		or (current_stage = 'debate' and new_stage <> 'cierre')
		or (current_stage = 'cierre')
	then
		raise exception 'Avance de etapa inválido: % → %', current_stage, new_stage;
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

-- 3. Last intervención: mark draw revealed + jump to Cierre
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
