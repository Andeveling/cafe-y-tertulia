-- Salir de Preguntas exige al menos dos miembros con pregunta.
-- Antes, 0 participantes hacía missing=[] y la UI decía "Todos tienen
-- pregunta"; el RPC dejaba llegar a Presentes vacío.

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
