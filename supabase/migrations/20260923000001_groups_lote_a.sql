-- [multi-grupo] 03 Migrate RLS lote A (#72, PRD #69, ADR-0013).
--
-- Reescritura de políticas del contenido core a is_group_member(group_id):
-- materials, sessions, categories, material_categories, session_categories,
-- seasons y convocatorias. El group_id se toma de la fila (SELECT/UPDATE/DELETE)
-- o de los valores insertados.
--
--  - is_member() sale de este lote: queda solo para checks de plataforma
--    (Mis Grupos, perfil, catálogo de grupos públicos).
--  - Caen las policies anon en materials/sessions (anon recibe vacío; la
--    memoria pública por-grupo queda para después, PRD §Out of Scope).
--  - Defensa en profundidad: group_id inmutable tras el insert, coherencia
--    mismo-grupo en FKs del lote, season automática por grupo y RPCs de
--    convocatoria con checks de membresía.
--  - El resto de tablas (lote B: sesión viva y gamificación) conserva sus
--    políticas viejas; CI verde.

-- ============================================================
-- 1. Retirar políticas viejas del lote A
-- ============================================================

drop policy if exists "materials_select_member" on public.materials;
drop policy if exists "materials_insert_member" on public.materials;
drop policy if exists "materials_update_member" on public.materials;
drop policy if exists "materials_select_anon" on public.materials;

drop policy if exists "sessions_select_member" on public.sessions;
drop policy if exists "sessions_insert_member" on public.sessions;
drop policy if exists "sessions_update_member" on public.sessions;
drop policy if exists "sessions_select_anon" on public.sessions;

drop policy if exists "categories_select_member" on public.categories;
drop policy if exists "material_categories_select_member" on public.material_categories;
drop policy if exists "material_categories_write_member" on public.material_categories;
drop policy if exists "session_categories_select_member" on public.session_categories;
drop policy if exists "session_categories_write_member" on public.session_categories;

drop policy if exists "gamification_select_member" on public.seasons;

drop policy if exists "convocatorias_select_own" on public.convocatorias;

-- Sin memoria pública por-grupo todavía: caen las policies anon, pero el
-- GRANT se queda para que anon reciba vacío (RLS niega las filas) en vez
-- de un 42501 que rompería las rutas públicas en la transición.

-- ============================================================
-- 2. Políticas nuevas: solo miembros del grupo
-- ============================================================

-- Materials: leer/crear/editar solo dentro de mis grupos.
create policy "materials_select_group" on public.materials
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "materials_insert_group" on public.materials
	for insert
	to authenticated
	with check (
		group_id is not null
		and public.is_group_member(group_id)
		and (select auth.uid()) = created_by
	);

create policy "materials_update_group" on public.materials
	for update
	to authenticated
	using (public.is_group_member(group_id))
	with check (
		group_id is not null
		and public.is_group_member(group_id)
	);

-- Sessions: igual; el moderador además debe ser Miembro activo del grupo.
create policy "sessions_select_group" on public.sessions
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "sessions_insert_group" on public.sessions
	for insert
	to authenticated
	with check (
		group_id is not null
		and public.is_group_member(group_id)
		and (
			moderator_id is null
			or exists (
				select 1
				from public.group_members gm
				join public.members m on m.id = gm.member_id
				where gm.group_id = sessions.group_id
				and gm.member_id = sessions.moderator_id
				and m.status = 'active'
			)
		)
	);

create policy "sessions_update_group" on public.sessions
	for update
	to authenticated
	using (public.is_group_member(group_id))
	with check (
		group_id is not null
		and public.is_group_member(group_id)
	);

-- Categories y puentes: cada grupo tiene su taxonomía.
create policy "categories_select_group" on public.categories
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "material_categories_select_group" on public.material_categories
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "material_categories_write_group" on public.material_categories
	for all
	to authenticated
	using (public.is_group_member(group_id))
	with check (
		group_id is not null
		and public.is_group_member(group_id)
	);

create policy "session_categories_select_group" on public.session_categories
	for select
	to authenticated
	using (public.is_group_member(group_id));

create policy "session_categories_write_group" on public.session_categories
	for all
	to authenticated
	using (public.is_group_member(group_id))
	with check (
		group_id is not null
		and public.is_group_member(group_id)
	);

-- Seasons: la temporada abierta se lee por grupo.
create policy "seasons_select_group" on public.seasons
	for select
	to authenticated
	using (public.is_group_member(group_id));

-- Convocatorias: solo emisor/receptor, y solo dentro del grupo.
create policy "convocatorias_select_group" on public.convocatorias
	for select
	to authenticated
	using (
		public.is_group_member(group_id)
		and (
			(select auth.uid()) = to_id
			or (select auth.uid()) = from_id
		)
	);

-- ============================================================
-- 3. Índices por grupo (los filtros RLS y de app van por group_id)
-- ============================================================

create index if not exists materials_group_idx on public.materials (group_id);
create index if not exists sessions_group_idx on public.sessions (group_id);
create index if not exists categories_group_idx on public.categories (group_id);
create index if not exists material_categories_group_idx on public.material_categories (group_id);
create index if not exists session_categories_group_idx on public.session_categories (group_id);
create index if not exists seasons_group_idx on public.seasons (group_id);
create index if not exists convocatorias_group_idx on public.convocatorias (group_id);

-- ============================================================
-- 4. Defensa en profundidad: group_id inmutable
-- ============================================================

create or replace function public.groups_prevent_group_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	if new.group_id is distinct from old.group_id then
		raise exception 'group_id es inmutable: el contenido no migra entre grupos (%)', TG_TABLE_NAME
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;

comment on function public.groups_prevent_group_change() is
	'Las filas nunca cambian de grupo: el aislamiento no se mueve por UPDATE (PRD #69).';

drop trigger if exists groups_freeze_group on public.materials;
create trigger groups_freeze_group
	before update of group_id on public.materials
	for each row execute function public.groups_prevent_group_change();

drop trigger if exists groups_freeze_group on public.sessions;
create trigger groups_freeze_group
	before update of group_id on public.sessions
	for each row execute function public.groups_prevent_group_change();

drop trigger if exists groups_freeze_group on public.categories;
create trigger groups_freeze_group
	before update of group_id on public.categories
	for each row execute function public.groups_prevent_group_change();

drop trigger if exists groups_freeze_group on public.material_categories;
create trigger groups_freeze_group
	before update of group_id on public.material_categories
	for each row execute function public.groups_prevent_group_change();

drop trigger if exists groups_freeze_group on public.session_categories;
create trigger groups_freeze_group
	before update of group_id on public.session_categories
	for each row execute function public.groups_prevent_group_change();

drop trigger if exists groups_freeze_group on public.seasons;
create trigger groups_freeze_group
	before update of group_id on public.seasons
	for each row execute function public.groups_prevent_group_change();

drop trigger if exists groups_freeze_group on public.convocatorias;
create trigger groups_freeze_group
	before update of group_id on public.convocatorias
	for each row execute function public.groups_prevent_group_change();

-- ============================================================
-- 5. Coherencia mismo-grupo en las FKs del lote
-- ============================================================

-- La sesión cuelga de un material y una temporada de su mismo grupo.
create or replace function public.sessions_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_mat_group uuid;
	v_sea_group uuid;
begin
	if new.material_id is not null then
		select group_id into v_mat_group
		from public.materials
		where id = new.material_id;
		if v_mat_group is distinct from new.group_id then
			raise exception 'La sesión y su material deben ser del mismo grupo'
				using errcode = 'P0001';
		end if;
	end if;
	if new.season_id is not null then
		select group_id into v_sea_group
		from public.seasons
		where id = new.season_id;
		if v_sea_group is distinct from new.group_id then
			raise exception 'La sesión y su temporada deben ser del mismo grupo'
				using errcode = 'P0001';
		end if;
	end if;
	return new;
end;
$$;

drop trigger if exists sessions_group_coherence on public.sessions;
create trigger sessions_group_coherence
	before insert or update of material_id, season_id, group_id on public.sessions
	for each row execute function public.sessions_group_coherence();

-- El puente une material y categoría del mismo grupo que la fila.
create or replace function public.material_categories_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_mat_group uuid;
	v_cat_group uuid;
begin
	select group_id into v_mat_group from public.materials where id = new.material_id;
	select group_id into v_cat_group from public.categories where id = new.category_id;
	if v_mat_group is distinct from new.group_id
		or v_cat_group is distinct from new.group_id
	then
		raise exception 'Material, categoría y puente deben ser del mismo grupo'
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;

drop trigger if exists material_categories_group_coherence on public.material_categories;
create trigger material_categories_group_coherence
	before insert or update of material_id, category_id, group_id on public.material_categories
	for each row execute function public.material_categories_group_coherence();

-- Igual para sesión + categoría.
create or replace function public.session_categories_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
	v_cat_group uuid;
begin
	select group_id into v_ses_group from public.sessions where id = new.session_id;
	select group_id into v_cat_group from public.categories where id = new.category_id;
	if v_ses_group is distinct from new.group_id
		or v_cat_group is distinct from new.group_id
	then
		raise exception 'Sesión, categoría y puente deben ser del mismo grupo'
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;

drop trigger if exists session_categories_group_coherence on public.session_categories;
create trigger session_categories_group_coherence
	before insert or update of session_id, category_id, group_id on public.session_categories
	for each row execute function public.session_categories_group_coherence();

-- La convocatoria hereda el grupo de su sesión; emisor y receptor son del grupo.
create or replace function public.convocatorias_group_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ses_group uuid;
begin
	select group_id into v_ses_group
	from public.sessions
	where id = new.session_id;
	if v_ses_group is null or v_ses_group is distinct from new.group_id then
		raise exception 'La convocatoria vive en el grupo de su sesión'
			using errcode = 'P0001';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.from_id
		and m.status = 'active'
	) then
		raise exception 'El emisor no es Miembro activo de este grupo'
			using errcode = '42501';
	end if;
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = new.group_id
		and gm.member_id = new.to_id
		and m.status = 'active'
	) then
		raise exception 'El receptor no es Miembro de este grupo'
			using errcode = '42501';
	end if;
	return new;
end;
$$;

drop trigger if exists convocatorias_group_coherence on public.convocatorias;
create trigger convocatorias_group_coherence
	before insert or update of session_id, group_id, from_id, to_id on public.convocatorias
	for each row execute function public.convocatorias_group_coherence();

-- ============================================================
-- 6. Temporada automática por grupo
-- ============================================================
-- sessions_set_season() usaba la temporada abierta global; con temporadas
-- por grupo (expand), la sesión nueva toma la abierta de SU grupo y la crea
-- (mes natural) si falta. Sin grupo, conserva el comportamiento viejo.

create or replace function public.sessions_set_season()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	s public.seasons;
	v_month_start timestamptz;
begin
	if new.season_id is null then
		if new.group_id is not null then
			select * into s
			from public.seasons
			where group_id = new.group_id
			and status = 'open'
			order by starts_at desc
			limit 1;
			if not found then
				v_month_start := date_trunc('month', now());
				insert into public.seasons (group_id, starts_at, ends_at)
				values (new.group_id, v_month_start, v_month_start + interval '1 month')
				returning * into s;
			end if;
			new.season_id := s.id;
		else
			select * into s from public.ensure_current_season();
			new.season_id := s.id;
		end if;
	end if;
	return new;
end;
$$;

-- El trigger ya existe (ticket #34); se recrea idempotente junto a la
-- función para que ambas viajen juntas.
	drop trigger if exists sessions_set_season on public.sessions;
create trigger sessions_set_season
	before insert on public.sessions
	for each row
	execute function public.sessions_set_season();

-- ============================================================
-- 7. RPCs de convocatoria con cerradura por grupo
-- ============================================================

create or replace function public.convocar(
	p_session_id uuid,
	p_to_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_id uuid;
	v_group_id uuid;
begin
	-- Caller must be an active member.
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	select group_id into v_group_id
	from public.sessions
	where id = p_session_id;

	if not found then
		raise exception 'Sesión no encontrada';
	end if;

	-- Caller must belong to the session's group (leaving revokes).
	if v_group_id is null or not public.is_group_member(v_group_id) then
		raise exception 'No perteneces al grupo de esta sesión'
			using errcode = '42501';
	end if;

	-- Caller must be the session moderator.
	if not exists (
		select 1 from public.sessions
		where id = p_session_id
		and moderator_id = auth.uid()
	) then
		raise exception 'Solo el moderador puede convocar';
	end if;

	-- Session must be lobby or in_progress.
	if not exists (
		select 1 from public.sessions
		where id = p_session_id
		and status in ('lobby', 'in_progress')
	) then
		raise exception 'La sesión no está abierta';
	end if;

	-- Target must be an active member, not the caller.
	if p_to_id = auth.uid() then
		raise exception 'No puedes convocarte a ti mismo';
	end if;

	if not exists (
		select 1 from public.members
		where id = p_to_id
		and status = 'active'
	) then
		raise exception 'El miembro no está activo';
	end if;

	-- Target must belong to the same group (no llamadas cruzadas).
	if not exists (
		select 1
		from public.group_members gm
		join public.members m on m.id = gm.member_id
		where gm.group_id = v_group_id
		and gm.member_id = p_to_id
		and m.status = 'active'
	) then
		raise exception 'El miembro no pertenece a este grupo'
			using errcode = '42501';
	end if;

	-- Insert pending, or no-op if already pending (idempotent).
	insert into public.convocatorias (session_id, group_id, from_id, to_id, status)
	values (p_session_id, v_group_id, auth.uid(), p_to_id, 'pending')
	on conflict (session_id, to_id) where status = 'pending'
	do nothing
	returning id into new_id;

	-- If no row was inserted (already pending), fetch the existing id.
	if new_id is null then
		select id into new_id
		from public.convocatorias
		where session_id = p_session_id
		and to_id = p_to_id
		and status = 'pending';
	end if;

	return new_id;
end;
$$;

create or replace function public.responder_convocatoria(
	p_id uuid,
	p_accept boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	v_session_id uuid;
	v_group_id uuid;
begin
	-- Only the addressed member can respond, and only if pending.
	-- Leaving the group revokes: membership is re-checked first.
	select session_id, group_id into v_session_id, v_group_id
	from public.convocatorias
	where id = p_id
	and to_id = auth.uid()
	and status = 'pending';

	if v_session_id is null then
		raise exception 'Convocatoria no encontrada o ya respondida';
	end if;

	if v_group_id is null or not public.is_group_member(v_group_id) then
		raise exception 'Ya no perteneces a este grupo'
			using errcode = '42501';
	end if;

	update public.convocatorias
	set status = case
		when p_accept then 'accepted'::public.convocatoria_status
		else 'dismissed'::public.convocatoria_status
	end
	where id = p_id
	returning session_id into v_session_id;

	return v_session_id;
end;
$$;
