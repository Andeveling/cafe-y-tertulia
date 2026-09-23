-- Multi-grupo admin del grupo (#76, PRD #69, ADR-0013).
--
-- RPCs pendientes del PRD: invite_to_group, remove_member,
-- update_member_role, delete_group (create/join/leave ya existen del
-- expand). Aditivo: no toca políticas de contenido.

-- Invitaciones a grupos privados: el enlace lleva un JWT firmado por la app
-- (patrón ADR-0011); aquí vive el registro para revocar y caducar. El hash
-- lo escribe la app tras firmar (jti = id de la fila).
create table if not exists public.group_invites (
	id uuid primary key default gen_random_uuid(),
	group_id uuid not null references public.groups (id) on delete cascade,
	token_hash text unique,
	created_by uuid references public.members (id) on delete set null,
	expires_at timestamptz not null default (now() + interval '30 days'),
	created_at timestamptz not null default now()
);

comment on table public.group_invites is 'Invitación al Grupo privado: enlace compartible con token (PRD #69). Revocar = borrar la fila.';

create index if not exists group_invites_group_idx on public.group_invites (group_id);

alter table public.group_invites enable row level security;

-- Invitaciones: visibles y gestionables solo por admins del grupo; el
-- canje lo hace la app con service role tras verificar el JWT.
drop policy if exists "group_invites_admin_all" on public.group_invites;
create policy "group_invites_admin_all" on public.group_invites
	for all to authenticated
	using (public.is_group_admin(group_id))
	with check (public.is_group_admin(group_id));

-- Admin: registra una invitación (un enlace activo por grupo; regenerar
-- invalida el anterior). Devuelve el id para atarlo al JWT (jti).
create or replace function public.invite_to_group(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	v_id uuid;
begin
	if not public.is_group_admin(p_group_id) then
		raise exception 'Solo un administrador puede invitar.'
			using errcode = '42501';
	end if;
	delete from public.group_invites where group_id = p_group_id;
	insert into public.group_invites (group_id, created_by)
	values (p_group_id, auth.uid())
	returning id into v_id;
	return v_id;
end;
$$;

comment on function public.invite_to_group(uuid) is 'Admin genera invitación al grupo privado; la app firma el JWT con jti = id (PRD #69, ADR-0011).';

-- Admin: expulsa a un miembro. Solo cae la membresía: sus aportes
-- permanecen como memoria del grupo. No deja al grupo sin admins.
create or replace function public.remove_member(p_group_id uuid, p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role public.group_member_role;
begin
	if not public.is_group_admin(p_group_id) then
		raise exception 'Solo un administrador puede expulsar.'
			using errcode = '42501';
	end if;
	select role into v_role from public.group_members
	where group_id = p_group_id and member_id = p_member_id;
	if not found then return; end if;
	if v_role = 'admin' and (
		select count(*) from public.group_members
		where group_id = p_group_id and role = 'admin'
	) <= 1 then
		raise exception 'No se puede expulsar al último administrador.'
			using errcode = '42501';
	end if;
	delete from public.group_members
	where group_id = p_group_id and member_id = p_member_id;
end;
$$;

comment on function public.remove_member(uuid, uuid) is 'Admin expulsa; los aportes del expulsado permanecen (PRD #69).';

-- Admin: nombra co-admins o degrada a miembro. Nunca deja al grupo sin
-- admins (degradar al último admin falla).
create or replace function public.update_member_role(
	p_group_id uuid,
	p_member_id uuid,
	p_role public.group_member_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if not public.is_group_admin(p_group_id) then
		raise exception 'Solo un administrador puede cambiar roles.'
			using errcode = '42501';
	end if;
	if p_role = 'member' and (
		select count(*) from public.group_members
		where group_id = p_group_id and role = 'admin'
	) <= 1 and exists (
		select 1 from public.group_members
		where group_id = p_group_id and member_id = p_member_id and role = 'admin'
	) then
		raise exception 'El grupo necesita al menos un administrador.'
			using errcode = '42501';
	end if;
	update public.group_members set role = p_role
	where group_id = p_group_id and member_id = p_member_id;
	if not found then
		raise exception 'Ese miembro no pertenece al grupo.'
			using errcode = 'P0001';
	end if;
end;
$$;

comment on function public.update_member_role(uuid, uuid, public.group_member_role) is 'Admin promueve/degrada entre admin y member (PRD #69).';

-- Admin: borra el grupo con todo su contenido (cascada por FKs).
create or replace function public.delete_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if not public.is_group_admin(p_group_id) then
		raise exception 'Solo un administrador puede borrar el grupo.'
			using errcode = '42501';
	end if;
	delete from public.groups where id = p_group_id;
end;
$$;

comment on function public.delete_group(uuid) is 'Admin borra el grupo con cascada dura (PRD #69).';

grant select, insert, update, delete on table public.group_invites to authenticated;
grant select, insert, update, delete on table public.group_invites to service_role;
grant execute on function public.invite_to_group(uuid) to authenticated, service_role;
grant execute on function public.remove_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.update_member_role(uuid, uuid, public.group_member_role) to authenticated, service_role;
grant execute on function public.delete_group(uuid) to authenticated, service_role;
