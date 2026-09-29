-- El moderador no se nombra al crear ni al abrir la Sala.
-- Lo toma el primero que ya está sentado en lobby / Preguntas.
-- Ceder sigue siendo solo el moderador, en el lobby, antes del sorteo.

create or replace function public.create_session(
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
	v_status public.session_status;
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

	v_status := case
		when p_scheduled_at is not null and p_scheduled_at > now() then 'preparation'::public.session_status
		else 'lobby'::public.session_status
	end;

	insert into public.sessions (
		material_id, range, status, moderator_id, scheduled_at, group_id
	)
	values (
		p_material_id, nullif(trim(p_range), ''), v_status, null,
		p_scheduled_at, v_group_id
	)
	returning id into new_id;

	return new_id;
end;
$$;

-- Definer: el chequeo de asiento y de sorteo no puede depender de la RLS de quien escribe.
create or replace function public.sessions_moderator_first_arrival()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.moderator_id is not distinct from old.moderator_id then
		return new;
	end if;

	-- Semillas y SQL sin JWT no pasan por la regla de llegada.
	if auth.uid() is null then
		return new;
	end if;

	if old.moderator_id is null then
		if new.moderator_id is distinct from auth.uid() then
			raise exception 'El moderador es quien llega primero';
		end if;
		if new.status <> 'lobby' or new.room_stage <> 'questions' then
			raise exception 'El moderador se toma al sentarse en Preguntas';
		end if;
		if not exists (
			select 1 from public.session_participants
			where session_id = new.id
				and member_id = auth.uid()
		) then
			raise exception 'Hay que estar sentado para moderar';
		end if;
		return new;
	end if;

	if old.moderator_id is distinct from auth.uid() then
		raise exception 'Solo el moderador puede ceder la moderación';
	end if;

	if old.status <> 'lobby' or new.status <> 'lobby' then
		raise exception 'Solo se puede ceder en el lobby';
	end if;

	if exists (select 1 from public.draws where session_id = new.id) then
		raise exception 'Ya no se puede ceder tras el sorteo';
	end if;

	if not exists (
		select 1 from public.session_participants
		where session_id = new.id
			and member_id = new.moderator_id
			and role = 'member'
	) then
		raise exception 'El nuevo moderador debe ser participante';
	end if;

	return new;
end;
$$;

drop trigger if exists sessions_moderator_first_arrival on public.sessions;
create trigger sessions_moderator_first_arrival
	before update of moderator_id on public.sessions
	for each row
	execute function public.sessions_moderator_first_arrival();

revoke all on function public.sessions_moderator_first_arrival() from public;
grant execute on function public.sessions_moderator_first_arrival() to authenticated, service_role;
