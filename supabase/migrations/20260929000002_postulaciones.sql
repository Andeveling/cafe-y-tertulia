-- Postulación 1×formato + sección Postulados (issue #88, PRD #86).
--
-- Capa previa a la estantería: cada Miembro guarda candidatos en su
-- Biblioteca personal global (solo suya) y postula como máximo 1 item
-- activo por formato hacia cada Grupo. El Grupo solo ve lo postulado
-- (sección Postulados), nunca bibliotecas completas.
--
-- Alcance de esta migración:
--  1. library_items (global por dueño, empieza vacía, sin backfill):
--     misma forma que el ticket #87 (cerrado): sin columna de grupo.
--  2. material_nominations (por Grupo, con snapshot title/kind/author/urls
--     para sobrevivir al borrado de biblioteca: ON DELETE SET NULL).
--  3. RLS: biblioteca solo el dueño; postulaciones legibles por Miembros
--     del Grupo (ADR-0013), escribibles solo por el dueño de lo suyo.
--  4. Unicidad parcial 1-activa-por-formato-por-Miembro-y-Grupo +
--     RPCs atómicos nominate_from_library / withdraw_nomination.
--
-- Fuera de este ticket (#89/#90): bloqueo al abrir el sorteo, clon del
-- ganador a Material seleccionado + Sesión, pacto y fallback al día 7.
-- El estado 'won' ya existe para ese corte; los perdedores siguen activos.

-- ============================================================
-- 1. Biblioteca personal global por Miembro
-- ============================================================

create table if not exists public.library_items (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid not null references public.members (id) on delete cascade,
	title text not null check (char_length(trim(both from title)) > 0),
	kind public.material_kind not null,
	author text not null check (char_length(trim(both from author)) > 0),
	image_url text,
	source_url text,
	motive text,
	created_at timestamptz not null default now()
);

comment on table public.library_items is 'Biblioteca personal global por Miembro (#88, PRD #86): candidatos privados, empieza vacía.';
comment on column public.library_items.owner_id is 'Dueño del item: solo él lee/escribe (RLS auth.uid() = owner_id).';
comment on column public.library_items.motive is 'Motivo por el que el Miembro lo guarda (opcional).';

create index if not exists library_items_owner_idx
	on public.library_items (owner_id);
create index if not exists library_items_owner_created_idx
	on public.library_items (owner_id, created_at desc);

alter table public.library_items enable row level security;

drop policy if exists "library_items_select_owner" on public.library_items;
create policy "library_items_select_owner" on public.library_items
	for select
	to authenticated
	using ((select auth.uid()) = owner_id);

drop policy if exists "library_items_insert_owner" on public.library_items;
create policy "library_items_insert_owner" on public.library_items
	for insert
	to authenticated
	with check ((select auth.uid()) = owner_id);

drop policy if exists "library_items_update_owner" on public.library_items;
create policy "library_items_update_owner" on public.library_items
	for update
	to authenticated
	using ((select auth.uid()) = owner_id)
	with check ((select auth.uid()) = owner_id);

drop policy if exists "library_items_delete_owner" on public.library_items;
create policy "library_items_delete_owner" on public.library_items
	for delete
	to authenticated
	using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.library_items to authenticated;
grant all on public.library_items to service_role;

-- ============================================================
-- 2. Postulaciones hacia un Grupo (con snapshot anti-borrado)
-- ============================================================

do $$ begin
	create type public.nomination_status as enum ('active', 'withdrawn', 'won');
exception when duplicate_object then null;
end $$;

create table if not exists public.material_nominations (
	id uuid primary key default gen_random_uuid(),
	group_id uuid not null references public.groups (id) on delete cascade,
	library_item_id uuid references public.library_items (id) on delete set null,
	proposed_by uuid not null references public.members (id) on delete cascade,
	kind public.material_kind not null,
	title text not null check (char_length(trim(both from title)) > 0),
	author text not null check (char_length(trim(both from author)) > 0),
	image_url text,
	source_url text,
	status public.nomination_status not null default 'active',
	created_at timestamptz not null default now(),
	decided_at timestamptz
);

comment on table public.material_nominations is 'Postulación (#88): oferta de 1 item de Biblioteca hacia un Grupo. El snapshot (title/kind/author/urls) sobrevive al borrado de biblioteca.';
comment on column public.material_nominations.library_item_id is 'Origen en Biblioteca; NULL si el dueño borró el item (el snapshot queda como memoria).';

create index if not exists material_nominations_group_id_idx
	on public.material_nominations (group_id);
create index if not exists material_nominations_active_idx
	on public.material_nominations (group_id, kind)
	where status = 'active';

-- Máximo 1 postulación activa por formato, Miembro y Grupo:
-- retiradas y ganadas liberan el cupo.
create unique index if not exists material_nominations_one_active_per_kind
	on public.material_nominations (group_id, proposed_by, kind)
	where status = 'active';

alter table public.material_nominations enable row level security;

-- El Grupo solo ve lo postulado, nunca bibliotecas completas.
drop policy if exists "nominations_select_group" on public.material_nominations;
create policy "nominations_select_group" on public.material_nominations
	for select
	to authenticated
	using (public.is_group_member(group_id));

-- El dueño postula lo suyo (el RPC valida el tope 1×formato).
drop policy if exists "nominations_insert_own" on public.material_nominations;
create policy "nominations_insert_own" on public.material_nominations
	for insert
	to authenticated
	with check (
		public.is_group_member(group_id)
		and (select auth.uid()) = proposed_by
	);

-- El dueño retira lo suyo.
drop policy if exists "nominations_update_own" on public.material_nominations;
create policy "nominations_update_own" on public.material_nominations
	for update
	to authenticated
	using (
		public.is_group_member(group_id)
		and (select auth.uid()) = proposed_by
	)
	with check (
		public.is_group_member(group_id)
		and (select auth.uid()) = proposed_by
	);

grant select, insert, update on public.material_nominations to authenticated;
grant delete on public.material_nominations to service_role;

-- ============================================================
-- 3. RPCs atómicos: nominar y retirar (evitan doble cupo por carrera)
-- ============================================================

create or replace function public.nominate_from_library(
	p_library_item_id uuid,
	p_group_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	v_item record;
	v_id uuid;
begin
	if not public.is_group_member(p_group_id) then
		raise exception 'Solo Miembros del Grupo pueden postular'
			using errcode = 'P0001';
	end if;

	select id, owner_id, title, kind, author, image_url, source_url
		into v_item
		from public.library_items
		where id = p_library_item_id;

	if not found then
		raise exception 'El item de biblioteca no existe' using errcode = 'P0001';
	end if;

	if v_item.owner_id <> auth.uid() then
		raise exception 'Solo puedes postular tu propia biblioteca'
			using errcode = 'P0001';
	end if;

	if exists (
		select 1 from public.material_nominations
		where group_id = p_group_id
			and proposed_by = auth.uid()
			and kind = v_item.kind
			and status = 'active'
	) then
		raise exception 'Ya tienes una postulación activa en este formato'
			using errcode = 'P0001';
	end if;

	insert into public.material_nominations (
		group_id, library_item_id, proposed_by, kind, title, author,
		image_url, source_url, status
	) values (
		p_group_id, v_item.id, auth.uid(), v_item.kind,
		v_item.title, v_item.author, v_item.image_url, v_item.source_url, 'active'
	)
	returning id into v_id;

	return v_id;
end;
$$;

grant execute on function public.nominate_from_library(uuid, uuid)
	to authenticated, service_role;

create or replace function public.withdraw_nomination(p_nomination_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.material_nominations
	set status = 'withdrawn', decided_at = now()
	where id = p_nomination_id
		and status = 'active'
		and proposed_by = auth.uid()
		and public.is_group_member(group_id);

	if not found then
		raise exception 'Solo puedes retirar tu propia postulación activa'
			using errcode = 'P0001';
	end if;
end;
$$;

grant execute on function public.withdraw_nomination(uuid)
	to authenticated, service_role;
