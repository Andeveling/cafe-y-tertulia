-- Ticket #14: pipeline de materiales (SPEC §2.2, §2.3, §4.1)
-- Members (SPEC §2.1): needed as FK target and for the RLS membership check (ADR 0005).
-- Solo los Miembros del club crean o editan Materiales (RLS).

-- ============================================================
-- Enums
-- ============================================================

create type public.member_status as enum ('invited', 'active', 'left');

create type public.material_kind as enum ('book', 'podcast', 'video', 'article');

create type public.material_status as enum (
	'proposed',
	'selected',
	'in_progress',
	'finished'
);

create type public.session_status as enum (
	'preparation',
	'lobby',
	'in_progress',
	'closed',
	'archived'
);

-- ============================================================
-- Tables
-- ============================================================

create table public.members (
	id uuid primary key references auth.users (id) on delete cascade,
	status public.member_status not null default 'invited',
	display_name text not null default '',
	invited_by uuid references public.members (id) on delete set null,
	created_at timestamptz not null default now()
);

comment on table public.members is 'Miembro del club (SPEC §2.1, ADR 0005)';

create table public.materials (
	id uuid primary key default gen_random_uuid(),
	title text not null check (length(trim(title)) > 0),
	kind public.material_kind not null,
	author text not null check (length(trim(author)) > 0),
	status public.material_status not null default 'proposed',
	created_by uuid not null references public.members (id),
	created_at timestamptz not null default now()
);

comment on table public.materials is 'Material sobre el que conversa el club (SPEC §2.2)';
comment on column public.materials.status is 'Pipeline: propuesto → seleccionado → en curso → terminado';

create table public.sessions (
	id uuid primary key default gen_random_uuid(),
	material_id uuid not null references public.materials (id) on delete cascade,
	range text not null check (length(trim(range)) > 0),
	status public.session_status not null default 'preparation',
	moderator_id uuid references public.members (id) on delete set null,
	scheduled_at timestamptz,
	created_at timestamptz not null default now()
);

comment on table public.sessions is 'Sesión del club sobre un Material (SPEC §2.3)';
comment on column public.sessions.range is 'Rango cubierto, ej. "Capítulos 1-3"';

create index sessions_material_id_idx on public.sessions (material_id);
create index sessions_status_idx on public.sessions (status);

-- ============================================================
-- RLS
-- ============================================================

-- Helpers: membresía activa (ADR 0005) — la cerradura se refuerza en la capa de datos.

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.members
		where id = auth.uid()
		and status = 'active'
	);
$$;

grant execute on function public.is_member() to authenticated, anon;

alter table public.members enable row level security;
alter table public.materials enable row level security;
alter table public.sessions enable row level security;

-- members: cada miembro ve su propia fila; nadie más (la lista de miembros
-- se expone por la capa de datos cuando haga falta, no por tabla).

create policy "members_select_own" on public.members
	for select
	to authenticated
	using ((select auth.uid()) = id);

create policy "members_update_own" on public.members
	for update
	to authenticated
	using ((select auth.uid()) = id)
	with check ((select auth.uid()) = id);

-- materials: los Miembros activos leen y crean; el club avanza el pipeline.
-- Sin borrado en el MVP: el ticket #14 pide crear y editar (AC5), no eliminar.

create policy "materials_select_member" on public.materials
	for select
	to authenticated
	using (public.is_member());

create policy "materials_insert_member" on public.materials
	for insert
	to authenticated
	with check (
		public.is_member()
		and (select auth.uid()) = created_by
	);

create policy "materials_update_member" on public.materials
	for update
	to authenticated
	using (public.is_member())
	with check (public.is_member());

-- sessions: los Miembros activos leen y editan (el club decide el rango y el
-- avance de la sesión); sin borrado en el MVP.

create policy "sessions_select_member" on public.sessions
	for select
	to authenticated
	using (public.is_member());

create policy "sessions_insert_member" on public.sessions
	for insert
	to authenticated
	with check (
		public.is_member()
		and (
			moderator_id is null
			or exists (
				select 1
				from public.members
				where id = moderator_id
				and status = 'active'
			)
		)
	);

create policy "sessions_update_member" on public.sessions
	for update
	to authenticated
	using (public.is_member())
	with check (public.is_member());

-- ============================================================
-- Data API: exponer tablas a authenticated (el anon no accede a nada del club)
-- ============================================================

grant select, insert, update, delete on public.members to authenticated, service_role;
grant select, insert, update, delete on public.materials to authenticated, service_role;
grant select, insert, update, delete on public.sessions to authenticated, service_role;
