-- Sorteo de Material intra-formato + resolución (issue #89, PRD #86).
--
-- Capa previa a la estantería: Biblioteca personal global (solo del dueño),
-- Postulación 1-activa-por-formato hacia el Grupo, y Sorteo que elige 1
-- ganador por urna de formato. Ganar clona el postulado como Material del
-- Grupo en seleccionado + programa la próxima Sesión; el original sigue en
-- Biblioteca como ya-compartido; perdedores siguen activos.
--
-- Alcance:
--  1. library_items (global por dueño, empieza vacía, sin backfill).
--  2. material_nominations (por Grupo, snapshot para sobrevivir al borrado).
--  3. material_draws (urna bloqueada + origen sorteo/pacto para el Histórico).
--  4. RLS por Grupo (ADR-0013) + RPCs atómicos nominate/withdraw/resolve.
--
-- Fuera (#90/#91): pacto asíncrono 7d con fallback, eliminar propuesta directa.

-- ============================================================
-- 1. Enums laterales (no tocan material_status ni session_status)
-- ============================================================

do $$ begin
	create type public.nomination_status as enum ('active', 'withdrawn', 'won');
exception when duplicate_object then null;
end $$;

do $$ begin
	create type public.material_draw_origin as enum ('draw', 'pact');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 2. Biblioteca personal global por Miembro
-- ============================================================

create table if not exists public.library_items (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid not null references public.members (id) on delete cascade,
	title text not null check (char_length(trim(both from title)) > 0),
	kind public.material_kind not null,
	author text not null check (char_length(trim(both from author)) > 0),
	image_url text,
	source_url text,
	motive text not null default '',
	shared_once boolean not null default false,
	created_at timestamptz not null default now()
);

comment on table public.library_items is 'Biblioteca personal global por Miembro (#89, PRD #86): candidatos privados, empieza vacía.';
comment on column public.library_items.shared_once is 'Marca ya-compartido: el original sigue en Biblioteca tras ganar.';

-- La migración 02 (#88) ya pudo crear library_items sin shared_once:
-- evolución idempotente si la tabla existe de antes.
alter table public.library_items
	add column if not exists shared_once boolean not null default false;

create index if not exists library_items_owner_idx
	on public.library_items (owner_id);

alter table public.library_items enable row level security;

drop policy if exists "library_items_select_owner" on public.library_items;
create policy "library_items_select_owner" on public.library_items
	for select to authenticated
	using ((select auth.uid()) = owner_id);

drop policy if exists "library_items_insert_owner" on public.library_items;
create policy "library_items_insert_owner" on public.library_items
	for insert to authenticated
	with check ((select auth.uid()) = owner_id);

drop policy if exists "library_items_update_owner" on public.library_items;
create policy "library_items_update_owner" on public.library_items
	for update to authenticated
	using ((select auth.uid()) = owner_id)
	with check ((select auth.uid()) = owner_id);

drop policy if exists "library_items_delete_owner" on public.library_items;
create policy "library_items_delete_owner" on public.library_items
	for delete to authenticated
	using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.library_items to authenticated;
grant all on public.library_items to service_role;

-- ============================================================
-- 3. Postulaciones hacia un Grupo (con snapshot anti-borrado)
-- ============================================================

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

comment on table public.material_nominations is 'Postulación (#89): oferta de 1 item de Biblioteca hacia un Grupo. El snapshot sobrevive al borrado de biblioteca.';

create index if not exists material_nominations_group_idx
	on public.material_nominations (group_id);
create index if not exists material_nominations_active_idx
	on public.material_nominations (group_id, kind)
	where status = 'active';

-- Máximo 1 activa por formato, Miembro y Grupo (retiradas/ganadas liberan).
create unique index if not exists material_nominations_one_active_per_kind
	on public.material_nominations (group_id, proposed_by, kind)
	where status = 'active';

alter table public.material_nominations enable row level security;

drop policy if exists "nominations_select_group" on public.material_nominations;
create policy "nominations_select_group" on public.material_nominations
	for select to authenticated
	using (public.is_group_member(group_id));

drop policy if exists "nominations_insert_own" on public.material_nominations;
create policy "nominations_insert_own" on public.material_nominations
	for insert to authenticated
	with check (
		public.is_group_member(group_id)
		and (select auth.uid()) = proposed_by
	);

drop policy if exists "nominations_update_own" on public.material_nominations;
create policy "nominations_update_own" on public.material_nominations
	for update to authenticated
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
-- 4. Sorteos de Material (urna bloqueada + origen para el Histórico)
-- ============================================================

create table if not exists public.material_draws (
	id uuid primary key default gen_random_uuid(),
	group_id uuid not null references public.groups (id) on delete cascade,
	kind public.material_kind not null,
	origin public.material_draw_origin not null,
	winner_nomination_id uuid references public.material_nominations (id) on delete set null,
	candidate_ids uuid[] not null default '{}',
	material_id uuid references public.materials (id) on delete set null,
	session_id uuid references public.sessions (id) on delete set null,
	created_by uuid references public.members (id) on delete set null,
	created_at timestamptz not null default now()
);

comment on table public.material_draws is 'Sorteo de Material o Pacto (#89): urna intra-formato de a 1 Sesión, origen visible en Histórico.';
comment on column public.material_draws.candidate_ids is 'Candidatas bloqueadas al abrir el evento.';

create index if not exists material_draws_group_idx
	on public.material_draws (group_id);

alter table public.material_draws enable row level security;

drop policy if exists "material_draws_select_group" on public.material_draws;
create policy "material_draws_select_group" on public.material_draws
	for select to authenticated
	using (public.is_group_member(group_id));

grant select on public.material_draws to authenticated;
grant insert, update, delete on public.material_draws to service_role;

-- ============================================================
-- 5. RPCs atómicos
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

-- Sorteo intra-formato + resolución atómica: urna bloqueada, clon a
-- Material seleccionado + Sesión programada, original como ya-compartido.
create or replace function public.resolve_material_draw(
	p_group_id uuid,
	p_kind public.material_kind,
	p_present_ids uuid[],
	p_range text default 'Por definir',
	p_scheduled_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	v_pool uuid[];
	v_winner record;
	v_material_id uuid;
	v_session_id uuid;
	v_draw_id uuid;
begin
	if not public.is_group_member(p_group_id) then
		raise exception 'Solo Miembros del Grupo pueden sortear'
			using errcode = 'P0001';
	end if;

	-- Pipeline secuencial: una Sesión con Material a la vez, sin paralelos.
	if exists (
		select 1 from public.sessions
		where group_id = p_group_id
			and material_id is not null
			and status in ('preparation', 'lobby', 'in_progress')
	) then
		raise exception 'Ya hay una Sesión en curso: termina el ciclo antes de sortear'
			using errcode = 'P0001';
	end if;

	-- Urna: activas del formato declarado, tope 1 por presente (la más
	-- reciente por Miembro), solo presentes. El bloqueo al abrir se congela
	-- en candidate_ids del sorteo registrado.
	select coalesce(array_agg(t.id), '{}') into v_pool
	from (
		select distinct on (n.proposed_by) n.id
		from public.material_nominations n
		where n.group_id = p_group_id
			and n.status = 'active'
			and n.kind = p_kind
			and n.proposed_by = any (p_present_ids)
		order by n.proposed_by, n.created_at desc
	) t;

	if coalesce(array_length(v_pool, 1), 0) < 2 then
		raise exception 'El sorteo necesita al menos 2 postulados del formato'
			using errcode = 'P0001';
	end if;

	select n.* into v_winner
	from public.material_nominations n
	where n.id = any (v_pool)
	order by random()
	limit 1;

	-- Ganar clona a Material del Grupo en seleccionado.
	insert into public.materials (
		group_id, title, kind, author, image_url, source_url, status, created_by
	) values (
		p_group_id, v_winner.title, v_winner.kind, v_winner.author,
		v_winner.image_url, v_winner.source_url, 'selected', v_winner.proposed_by
	)
	returning id into v_material_id;

	-- Y programa la próxima Sesión con Rango pendiente.
	insert into public.sessions (
		group_id, material_id, range, status, moderator_id, scheduled_at
	) values (
		p_group_id, v_material_id, nullif(trim(both from p_range), ''), 'preparation', null, p_scheduled_at
	)
	returning id into v_session_id;

	-- La ganadora se cierra; las perdedoras siguen activas.
	update public.material_nominations
	set status = 'won', decided_at = now()
	where id = v_winner.id;

	-- El original sigue en Biblioteca como ya-compartido.
	if v_winner.library_item_id is not null then
		update public.library_items
		set shared_once = true
		where id = v_winner.library_item_id;
	end if;

	insert into public.material_draws (
		group_id, kind, origin, winner_nomination_id, candidate_ids,
		material_id, session_id, created_by
	) values (
		p_group_id, p_kind, 'draw', v_winner.id, v_pool,
		v_material_id, v_session_id, auth.uid()
	)
	returning id into v_draw_id;

	return jsonb_build_object(
		'draw_id', v_draw_id,
		'material_id', v_material_id,
		'session_id', v_session_id,
		'winner_nomination_id', v_winner.id
	);
end;
$$;

grant execute on function public.resolve_material_draw(uuid, public.material_kind, uuid[], text, timestamptz)
	to authenticated, service_role;
