-- Ceder moderación en el lobby antes del sorteo (CONTEXT Moderador).
create or replace function public.transfer_moderator(
	target_session_id uuid,
	new_moderator_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_moderator uuid;
	v_status public.session_status;
begin
	select moderator_id, status into v_moderator, v_status
	from public.sessions
	where id = target_session_id;

	if not found then
		raise exception 'Sesión no encontrada';
	end if;

	if v_moderator is distinct from auth.uid() then
		raise exception 'Solo el moderador puede ceder la moderación';
	end if;

	if v_status <> 'lobby' then
		raise exception 'Solo se puede ceder en el lobby';
	end if;

	if exists (select 1 from public.draws where session_id = target_session_id) then
		raise exception 'Ya no se puede ceder tras el sorteo';
	end if;

	if not exists (
		select 1 from public.session_participants
		where session_id = target_session_id
			and member_id = new_moderator_id
			and role = 'member'
	) then
		raise exception 'El nuevo moderador debe ser participante';
	end if;

	update public.sessions
	set moderator_id = new_moderator_id
	where id = target_session_id;
end;
$$;

grant execute on function public.transfer_moderator(uuid, uuid) to authenticated;
revoke all on function public.transfer_moderator(uuid, uuid) from public;
