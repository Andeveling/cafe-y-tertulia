-- Ticket #32 follow-up: guard the debate → cierre transition so the
-- moderator cannot advance to Cierre with an unrevealed Sorteo. Before this,
-- close_session raised 'Revela primero el Sorteo' only after the moderator was
-- already stuck in the Cierre stage with no way back (advance is forward-only).
-- The same guard now fires at the stage advance, while still in Debate, where
-- the remaining assignment can be revealed.
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

	-- Cierre solo con el Sorteo revelado (mismo guard que close_session).
	if new_stage = 'cierre' and exists (
		select 1 from draws
		where session_id = target_session_id
			and status <> 'revealed'
	) then
		raise exception 'Revela primero el Sorteo';
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
