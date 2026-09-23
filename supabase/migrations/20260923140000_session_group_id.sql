-- La sesión nace en un Grupo. Sin p_group_id, solo vale si el Miembro
-- pertenece a exactamente uno: no hay grupo por defecto.

drop function if exists public.create_session(uuid, text, timestamptz);

create function public.create_session(
	p_material_id uuid default null,
	p_range text default null,
	p_scheduled_at timestamptz default null,
	p_group_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_id uuid;
	v_group_id uuid;
	v_count integer;
begin
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	if p_group_id is not null then
		if not public.is_group_member(p_group_id) then
			raise exception 'No perteneces a ese grupo';
		end if;
		v_group_id := p_group_id;
	else
		select count(*) into v_count
		from public.group_members
		where member_id = auth.uid();
		if v_count <> 1 then
			raise exception 'Grupo requerido';
		end if;
		select group_id into v_group_id
		from public.group_members
		where member_id = auth.uid();
	end if;

	if p_material_id is not null and (p_range is null or length(trim(p_range)) = 0) then
		raise exception 'El rango es obligatorio cuando hay material';
	end if;

	if p_material_id is not null then
		if not exists (
			select 1 from public.materials
			where id = p_material_id and group_id = v_group_id
		) then
			raise exception 'Material no encontrado';
		end if;
	end if;

	if p_scheduled_at is not null and p_scheduled_at > now() then
		insert into public.sessions (
			material_id, range, status, moderator_id, scheduled_at, group_id
		)
		values (
			p_material_id, nullif(trim(p_range), ''), 'preparation', null,
			p_scheduled_at, v_group_id
		)
		returning id into new_id;
	else
		insert into public.sessions (
			material_id, range, status, moderator_id, scheduled_at, group_id
		)
		values (
			p_material_id, nullif(trim(p_range), ''), 'lobby', auth.uid(),
			p_scheduled_at, v_group_id
		)
		returning id into new_id;
	end if;

	return new_id;
end;
$$;

grant execute on function public.create_session(uuid, text, timestamptz, uuid) to authenticated;
