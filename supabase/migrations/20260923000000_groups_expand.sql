-- [multi-grupo] 02 Expand (#71, PRD #69, ADR-0013).
--
-- Fase expand: añade lo nuevo al lado de lo viejo sin reescribir políticas
-- de contenido, para que CI siga verde.
--
--  1. Enums group_visibility + group_member_role.
--  2. Tablas groups + group_members.
--  3. Helpers is_group_member() / is_group_admin() (security definer, mismo
--     patrón que is_member()) junto al is_member() existente, intacto.
--  4. RLS propio de las tablas nuevas (lectura: miembro del grupo o catálogo
--     público; escrituras directas bloqueadas, solo RPCs).
--  5. Grupo "nojau" (private): todos los Miembros activos existentes entran
--     como miembros y el más antiguo queda admin.
--  6. group_id nullable en las 20 tablas de contenido con backfill a nojau
--     (sin NOT NULL aún, sin FKs: eso es el contract del #74).
--  7. Unicidades globales re-scopeadas por grupo (key de badges/categorías,
--     temporada abierta): si no, create_group no puede sembrar y falla.
--  8. RPCs create_group (grupo + admin creador + siembra desde la plantilla),
--     join_group (solo públicas) y leave_group (promociona al más antiguo
--     si sale el único admin). Los aportes permanecen: solo se borra la
--     fila de group_members.

-- ============================================================
-- 1. Enums
-- ============================================================

create type public.group_visibility as enum ('public', 'private');
create type public.group_member_role as enum ('admin', 'member');

-- ============================================================
-- 2. Tablas groups + group_members
-- ============================================================

create table public.groups (
	id uuid primary key default gen_random_uuid(),
	name text not null check (char_length(trim(name)) > 0),
	description text,
	avatar text,
	visibility public.group_visibility not null default 'private',
	created_by uuid references public.members (id) on delete set null,
	created_at timestamptz not null default now()
);

comment on table public.groups is 'Grupo: comunidad aislada con contenido propio (PRD #69, ADR-0013).';

create table public.group_members (
	group_id uuid not null references public.groups (id) on delete cascade,
	member_id uuid not null references public.members (id) on delete cascade,
	role public.group_member_role not null default 'member',
	created_at timestamptz not null default now(),
	primary key (group_id, member_id)
);

comment on table public.group_members is 'Membresía a un Grupo con rol admin/member (PRD #69).';

create index if not exists group_members_member_idx on public.group_members (member_id);

-- ============================================================
-- 3. Helpers de membresía por grupo (security definer, como is_member)
-- ============================================================

create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = p_group_id
		and gm.member_id = auth.uid()
		and m.status = 'active'
	);
$$;

comment on function public.is_group_member(uuid) is 'Cerradura por grupo (ADR-0013): el usuario es Miembro activo de ese grupo.';

create function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = p_group_id
		and gm.member_id = auth.uid()
		and gm.role = 'admin'
		and m.status = 'active'
	);
$$;

comment on function public.is_group_admin(uuid) is 'El usuario es Administrador activo de ese grupo (PRD #69).';

grant execute on function public.is_group_member(uuid) to authenticated, service_role;
grant execute on function public.is_group_admin(uuid) to authenticated, service_role;

-- ============================================================
-- 4. RLS de las tablas nuevas (las de contenido no se tocan en el expand)
-- ============================================================

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Grupos: cada Miembro ve sus grupos; las públicas las ve cualquier Miembro
-- activo (catálogo de descubrimiento). Las privadas son invisibles fuera.
create policy "groups_select_member_or_public" on public.groups
	for select
	to authenticated
	using (
		public.is_group_member(id)
		or (visibility = 'public' and public.is_member())
	);

-- Membresías: cada uno ve las suyas; dentro de un grupo se ve el roster.
create policy "group_members_select" on public.group_members
	for select
	to authenticated
	using (
		member_id = (select auth.uid())
		or public.is_group_member(group_id)
	);

-- Sin políticas de insert/update/delete: las mutaciones van por RPCs
-- (security definer). RLS deniega por defecto la escritura directa.

grant select on public.groups, public.group_members to authenticated;
grant all on public.groups, public.group_members to service_role;

-- ============================================================
-- 5. Grupo "nojau" + membresías de los Miembros activos existentes
-- ============================================================

do $$
declare
	v_nojau_id uuid;
	v_oldest_member_id uuid;
begin
	select id into v_oldest_member_id
	from public.members
	where status = 'active'
	order by created_at asc, id asc
	limit 1;

	insert into public.groups (name, description, visibility, created_by)
	values (
		'nojau',
		'Grupo inicial: reúne los datos y Miembros previos a multi-grupo (PRD #69).',
		'private',
		v_oldest_member_id
	)
	returning id into v_nojau_id;

	insert into public.group_members (group_id, member_id, role)
	select v_nojau_id, id, 'member'
	from public.members
	where status = 'active'
	on conflict do nothing;

	if v_oldest_member_id is not null then
		update public.group_members
		set role = 'admin'
		where group_id = v_nojau_id
		and member_id = v_oldest_member_id;
	end if;
end
$$;

-- ============================================================
-- 6. group_id nullable en contenido + backfill a nojau
-- ============================================================
-- El id de nojau se resuelve una sola vez; las 20 tablas quedan explícitas
-- para que un fallo señale la tabla exacta.

alter table public.materials add column group_id uuid;
alter table public.sessions add column group_id uuid;
alter table public.categories add column group_id uuid;
alter table public.material_categories add column group_id uuid;
alter table public.session_categories add column group_id uuid;
alter table public.seasons add column group_id uuid;
alter table public.badges add column group_id uuid;
alter table public.awards add column group_id uuid;
alter table public.counts add column group_id uuid;
alter table public.season_recognitions add column group_id uuid;
alter table public.trivias add column group_id uuid;
alter table public.questions add column group_id uuid;
alter table public.draws add column group_id uuid;
alter table public.assignments add column group_id uuid;
alter table public.session_participants add column group_id uuid;
alter table public.takes add column group_id uuid;
alter table public.trivia_rounds add column group_id uuid;
alter table public.votes add column group_id uuid;
alter table public.hearts add column group_id uuid;
alter table public.convocatorias add column group_id uuid;

do $$
declare
	v_nojau_id uuid;
begin
	select id into v_nojau_id
	from public.groups
	where name = 'nojau'
	limit 1;

	update public.materials set group_id = v_nojau_id where group_id is null;
	update public.sessions set group_id = v_nojau_id where group_id is null;
	update public.categories set group_id = v_nojau_id where group_id is null;
	update public.material_categories set group_id = v_nojau_id where group_id is null;
	update public.session_categories set group_id = v_nojau_id where group_id is null;
	update public.seasons set group_id = v_nojau_id where group_id is null;
	update public.badges set group_id = v_nojau_id where group_id is null;
	update public.awards set group_id = v_nojau_id where group_id is null;
	update public.counts set group_id = v_nojau_id where group_id is null;
	update public.season_recognitions set group_id = v_nojau_id where group_id is null;
	update public.trivias set group_id = v_nojau_id where group_id is null;
	update public.questions set group_id = v_nojau_id where group_id is null;
	update public.draws set group_id = v_nojau_id where group_id is null;
	update public.assignments set group_id = v_nojau_id where group_id is null;
	update public.session_participants set group_id = v_nojau_id where group_id is null;
	update public.takes set group_id = v_nojau_id where group_id is null;
	update public.trivia_rounds set group_id = v_nojau_id where group_id is null;
	update public.votes set group_id = v_nojau_id where group_id is null;
	update public.hearts set group_id = v_nojau_id where group_id is null;
	update public.convocatorias set group_id = v_nojau_id where group_id is null;
end
$$;

-- ============================================================
-- 7. Unicidades globales re-scopeadas por grupo
-- ============================================================
-- Imprescindibles ya en el expand: create_group siembra categorías,
-- insignias y temporada por grupo, y las unicidades globales lo impedirían.

alter table public.badges drop constraint badges_key_key;
alter table public.badges add constraint badges_group_key_unique unique (group_id, key);

alter table public.categories drop constraint categories_key_key;
alter table public.categories add constraint categories_group_key_unique unique (group_id, key);

drop index public.seasons_one_open;
create unique index seasons_one_open_per_group
	on public.seasons (group_id, status) where status = 'open';

-- ============================================================
-- 8. RPCs: create_group / join_group / leave_group
-- ============================================================

-- Crea el grupo, deja al creador como admin y siembra el estándar copiando
-- del grupo plantilla (nojau; si se borró, del grupo más antiguo): así la
-- siembra va con el catálogo vigente sin hardcodear filas. Más la temporada
-- del mes.
create function public.create_group(
	p_name text,
	p_description text default null,
	p_avatar text default null,
	p_visibility public.group_visibility default 'private'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	v_name text;
	v_group_id uuid;
	v_template_id uuid;
	v_month_start timestamptz;
begin
	if not public.is_member() then
		raise exception 'Solo los Miembros activos pueden crear grupos'
			using errcode = '42501';
	end if;
	v_name := nullif(trim(both from p_name), '');
	if v_name is null then
		raise exception 'El nombre del grupo es obligatorio'
			using errcode = 'P0001';
	end if;

	insert into public.groups (name, description, avatar, visibility, created_by)
	values (v_name, p_description, p_avatar, coalesce(p_visibility, 'private'), auth.uid())
	returning id into v_group_id;

	insert into public.group_members (group_id, member_id, role)
	values (v_group_id, auth.uid(), 'admin');

	select id into v_template_id
	from public.groups
	where name = 'nojau'
	limit 1;

	if v_template_id is null then
		select id into v_template_id
		from public.groups
		where id <> v_group_id
		order by created_at asc, id asc
		limit 1;
	end if;

	if v_template_id is not null then
		insert into public.categories (group_id, key, name, icon)
		select v_group_id, key, name, icon
		from public.categories
		where group_id = v_template_id
		on conflict do nothing;

		insert into public.badges (group_id, key, emoji, name, description, kind)
		select v_group_id, key, emoji, name, description, kind
		from public.badges
		where group_id = v_template_id
		on conflict do nothing;
	end if;

	v_month_start := date_trunc('month', now());
	insert into public.seasons (group_id, starts_at, ends_at)
	values (v_group_id, v_month_start, v_month_start + interval '1 month')
	on conflict do nothing;

	return v_group_id;
end
$$;

comment on function public.create_group(text, text, text, public.group_visibility) is 'Crea un Grupo con su admin y siembra estándar (PRD #69).';

-- Unión instantánea a grupos públicos. Las privadas exigen invitación (#76).
create function public.join_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_visibility public.group_visibility;
begin
	if not public.is_member() then
		raise exception 'Solo los Miembros activos pueden unirse a grupos'
			using errcode = '42501';
	end if;

	select visibility into v_visibility
	from public.groups
	where id = p_group_id;

	if not found then
		raise exception 'Grupo no encontrado'
			using errcode = 'P0001';
	end if;

	if v_visibility <> 'public' then
		raise exception 'Este grupo es privado: únete con un enlace de invitación'
			using errcode = '42501';
	end if;

	insert into public.group_members (group_id, member_id, role)
	values (p_group_id, auth.uid(), 'member')
	on conflict do nothing;
end
$$;

comment on function public.join_group(uuid) is 'Une al Miembro a un grupo público (PRD #69).';

-- Salida voluntaria: solo cae la membresía, los aportes quedan como memoria
-- del grupo. Si sale el único admin, promociona al miembro más antiguo.
create function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role public.group_member_role;
	v_replacement_member_id uuid;
begin
	select role into v_role
	from public.group_members
	where group_id = p_group_id
	and member_id = auth.uid();

	if not found then
		return;
	end if;

	delete from public.group_members
	where group_id = p_group_id
	and member_id = auth.uid();

	if v_role = 'admin'
		and not exists (
			select 1 from public.group_members
			where group_id = p_group_id and role = 'admin'
		)
	then
		select member_id into v_replacement_member_id
		from public.group_members
		where group_id = p_group_id
		order by created_at asc, member_id asc
		limit 1;

		if found then
			update public.group_members
			set role = 'admin'
			where group_id = p_group_id
			and member_id = v_replacement_member_id;
		end if;
	end if;
end
$$;

comment on function public.leave_group(uuid) is 'Salida voluntaria con promoción al más antiguo si cae el único admin (PRD #69).';

grant execute on function public.create_group(text, text, text, public.group_visibility) to authenticated, service_role;
grant execute on function public.join_group(uuid) to authenticated, service_role;
grant execute on function public.leave_group(uuid) to authenticated, service_role;
