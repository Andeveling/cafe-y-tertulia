-- El canje de Invitación (service role) actualiza status y display_name.
-- El trigger de last_seen solo debe limitar al Miembro autenticado.

create or replace function public.members_last_seen_only()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	if coalesce(auth.role(), current_setting('role', true), '') is distinct from 'authenticated' then
		return new;
	end if;
	if new.id is distinct from old.id
		or new.status is distinct from old.status
		or new.display_name is distinct from old.display_name
		or new.invited_by is distinct from old.invited_by
		or new.created_at is distinct from old.created_at
	then
		raise exception 'Solo se puede actualizar last_seen de la propia fila'
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;
