-- Pacto en Sala + asíncrono 7 días con fallback (issue #90, PRD #86).
--
-- Sobre un postulado existente: en Sala lo declara el Moderador (admin del
-- Grupo, inmediato) o asíncrono lo propone cualquiera con ventana de 7 días
-- y mayoría simple. Acordar cancela los otros pendientes (un solo camino) y
-- reusa la resolución del sorteo (clon a Material seleccionado + Sesión,
-- origen 'pact' en material_draws para el Histórico). Sin quórum al día 7
-- el pacto expira y cae a sorteo entre lo postulado (gancho para el
-- barista/cron: list_pending_pacts + resolve_material_draw existente).
--
-- Tablas laterales (no tocan el pipeline del Material ni el ciclo Sesión):
--  1. material_pacts (por Grupo, sobre nominación activa, modo room/async).
--  2. material_pact_approvals (1 voto por Miembro y pacto).
-- RLS por Grupo (ADR-0013): lectura Miembros, escritura solo vía RPCs.

-- ============================================================
-- 1. Enums laterales
-- ============================================================

do $$ begin
	create type public.pact_mode as enum ('room', 'async');
exception when duplicate_object then null;
end $$;

do $$ begin
	create type public.pact_status as enum ('pending', 'agreed', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 2. Pactos sobre postulados
-- ============================================================

create table if not exists public.material_pacts (
	id uuid primary key default gen_random_uuid(),
	group_id uuid not null references public.groups (id) on delete cascade,
	nomination_id uuid not null references public.material_nominations (id) on delete cascade,
	proposed_by uuid not null references public.members (id) on delete cascade,
	mode public.pact_mode not null,
	status public.pact_status not null default 'pending',
	expires_at timestamptz,
	material_id uuid references public.materials (id) on delete set null,
	session_id uuid references public.sessions (id) on delete set null,
	created_at timestamptz not null default now(),
	decided_at timestamptz
);

comment on table public.material_pacts is 'Pacto (#90): elección directa sobre un postulado, en Sala (admin, inmediato) o asíncrono (7 días, mayoría simple).';
comment on column public.material_pacts.expires_at is 'Ventana fija 7 días para async; NULL para room (inmediato).';

create index if not exists material_pacts_group_idx
	on public.material_pacts (group_id);
create index if not exists material_pacts_pending_idx
	on public.material_pacts (group_id)
	where status = 'pending';

-- Un solo pendiente por nominación: evita pactos duplicados sobre lo mismo.
create unique index if not exists material_pacts_one_pending_per_nomination
	on public.material_pacts (nomination_id)
	where status = 'pending';

alter table public.material_pacts enable row level security;

drop policy if exists "pacts_select_group" on public.material_pacts;
create policy "pacts_select_group" on public.material_pacts
	for select to authenticated
	using (public.is_group_member(group_id));

grant select on public.material_pacts to authenticated;
grant all on public.material_pacts to service_role;

-- ============================================================
-- 3. Aprobaciones (1 voto por Miembro y pacto)
-- ============================================================

create table if not exists public.material_pact_approvals (
	pact_id uuid not null references public.material_pacts (id) on delete cascade,
	approver uuid not null references public.members (id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (pact_id, approver)
);

alter table public.material_pact_approvals enable row level security;

drop policy if exists "pact_approvals_select_group" on public.material_pact_approvals;
create policy "pact_approvals_select_group" on public.material_pact_approvals
	for select to authenticated
	using (
		exists (
			select 1 from public.material_pacts p
			where p.id = pact_id
				and public.is_group_member(p.group_id)
		)
	);

grant select on public.material_pact_approvals to authenticated;
grant all on public.material_pact_approvals to service_role;

-- ============================================================
-- 4. RPCs atómicos
-- ============================================================

-- Resuelve una nominación como pacto: clon a seleccionado + Sesión,
-- ganadora cerrada (perdedoras activas), original ya-compartido,
-- fila en draws con origen 'pact' y otros pendientes cancelados.
create or replace function public.resolve_nomination_as_pact(
	p_nomination_id uuid,
	p_range text default 'Por definir',
	p_scheduled_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	v_nom record;
	v_material_id uuid;
	v_session_id uuid;
	v_draw_id uuid;
begin
	select n.* into v_nom
	from public.material_nominations n
	where n.id = p_nomination_id
		and n.status = 'active';

	if not found then
		raise exception 'El postulado ya no está activo' using errcode = 'P0001';
	end if;

	if not public.is_group_member(v_nom.group_id) then
		raise exception 'Solo Miembros del Grupo pueden pactar'
			using errcode = 'P0001';
	end if;

	if exists (
		select 1 from public.sessions
		where group_id = v_nom.group_id
			and material_id is not null
			and status in ('preparation', 'lobby', 'in_progress')
	) then
		raise exception 'Ya hay una Sesión en curso: termina el ciclo antes de pactar'
			using errcode = 'P0001';
	end if;

	insert into public.materials (
		group_id, title, kind, author, image_url, source_url, status, created_by
	) values (
		v_nom.group_id, v_nom.title, v_nom.kind, v_nom.author,
		v_nom.image_url, v_nom.source_url, 'selected', v_nom.proposed_by
	)
	returning id into v_material_id;

	insert into public.sessions (
		group_id, material_id, range, status, moderator_id, scheduled_at
	) values (
		v_nom.group_id, v_material_id, nullif(trim(both from p_range), ''), 'preparation', null, p_scheduled_at
	)
	returning id into v_session_id;

	update public.material_nominations
	set status = 'won', decided_at = now()
	where id = v_nom.id;

	if v_nom.library_item_id is not null then
		update public.library_items
		set shared_once = true
		where id = v_nom.library_item_id;
	end if;

	insert into public.material_draws (
		group_id, kind, origin, winner_nomination_id, candidate_ids,
		material_id, session_id, created_by
	) values (
		v_nom.group_id, v_nom.kind, 'pact', v_nom.id, array[v_nom.id],
		v_material_id, v_session_id, auth.uid()
	)
	returning id into v_draw_id;

	-- Un solo camino: otros pendientes del Grupo se cancelan.
	update public.material_pacts
	set status = 'cancelled', decided_at = now()
	where group_id = v_nom.group_id
		and status = 'pending'
		and nomination_id <> v_nom.id;

	return jsonb_build_object(
		'draw_id', v_draw_id,
		'material_id', v_material_id,
		'session_id', v_session_id,
		'winner_nomination_id', v_nom.id
	);
end;
$$;

grant execute on function public.resolve_nomination_as_pact(uuid, text, timestamptz)
	to authenticated, service_role;

-- Pacto en Sala: lo declara el admin del Grupo, inmediato.
create or replace function public.resolve_room_pact(
	p_nomination_id uuid,
	p_range text default 'Por definir',
	p_scheduled_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	v_nom record;
	v_out jsonb;
	v_pact_id uuid;
begin
	select n.* into v_nom
	from public.material_nominations n
	where n.id = p_nomination_id;

	if not found then
		raise exception 'El postulado no existe' using errcode = 'P0001';
	end if;

	if not public.is_group_admin(v_nom.group_id) then
		raise exception 'Solo el Moderador puede pactar en Sala'
			using errcode = 'P0001';
	end if;

	v_out := public.resolve_nomination_as_pact(p_nomination_id, p_range, p_scheduled_at);

	insert into public.material_pacts (
		group_id, nomination_id, proposed_by, mode, status,
		material_id, session_id, decided_at
	) values (
		v_nom.group_id, v_nom.id, auth.uid(), 'room', 'agreed',
		(v_out->>'material_id')::uuid, (v_out->>'session_id')::uuid, now()
	)
	returning id into v_pact_id;

	return v_out || jsonb_build_object('pact_id', v_pact_id);
end;
$$;

grant execute on function public.resolve_room_pact(uuid, text, timestamptz)
	to authenticated, service_role;

-- Pacto asíncrono: propone cualquiera sobre postulado activo, ventana 7 días.
-- El proponente cuenta como primera aprobación.
create or replace function public.propose_material_pact(p_nomination_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	v_nom record;
	v_pact_id uuid;
begin
	select n.* into v_nom
	from public.material_nominations n
	where n.id = p_nomination_id
		and n.status = 'active';

	if not found then
		raise exception 'El postulado ya no está activo' using errcode = 'P0001';
	end if;

	if not public.is_group_member(v_nom.group_id) then
		raise exception 'Solo Miembros del Grupo pueden proponer pacto'
			using errcode = 'P0001';
	end if;

	if exists (
		select 1 from public.material_pacts
		where nomination_id = p_nomination_id
			and status = 'pending'
	) then
		raise exception 'Ya hay un pacto pendiente sobre este postulado'
			using errcode = 'P0001';
	end if;

	insert into public.material_pacts (
		group_id, nomination_id, proposed_by, mode, status, expires_at
	) values (
		v_nom.group_id, v_nom.id, auth.uid(), 'async', 'pending', now() + interval '7 days'
	)
	returning id into v_pact_id;

	insert into public.material_pact_approvals (pact_id, approver)
	values (v_pact_id, auth.uid())
	on conflict do nothing;

	return v_pact_id;
end;
$$;

grant execute on function public.propose_material_pact(uuid)
	to authenticated, service_role;

-- Aprobar pacto asíncrono: mayoría simple dentro de la ventana acuerda y
-- resuelve (clon + Sesión, origen pact); sin quórum sigue pendiente hasta
-- el día 7, donde expira y cae a sorteo (gancho barista).
create or replace function public.approve_material_pact(p_pact_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	v_pact record;
	v_approvals integer;
	v_members integer;
	v_needed integer;
	v_out jsonb;
begin
	select p.* into v_pact
	from public.material_pacts p
	where p.id = p_pact_id;

	if not found then
		raise exception 'El pacto no existe' using errcode = 'P0001';
	end if;

	if v_pact.status <> 'pending' then
		raise exception 'El pacto ya se decidió' using errcode = 'P0001';
	end if;

	if not public.is_group_member(v_pact.group_id) then
		raise exception 'Solo Miembros del Grupo pueden aprobar'
			using errcode = 'P0001';
	end if;

	if v_pact.expires_at is not null and v_pact.expires_at <= now() then
		update public.material_pacts
		set status = 'expired', decided_at = now()
		where id = v_pact.id and status = 'pending';
		return jsonb_build_object('status', 'expired', 'needs_draw', true);
	end if;

	insert into public.material_pact_approvals (pact_id, approver)
	values (v_pact.id, auth.uid())
	on conflict do nothing;

	select count(*) into v_approvals
	from public.material_pact_approvals
	where pact_id = v_pact.id;

	select count(*) into v_members
	from public.group_members gm
	join public.members m on m.id = gm.member_id
	where gm.group_id = v_pact.group_id
		and m.status = 'active';

	v_needed := (v_members / 2) + 1;

	if v_approvals >= v_needed then
		v_out := public.resolve_nomination_as_pact(v_pact.nomination_id);
		update public.material_pacts
		set status = 'agreed', decided_at = now(),
			material_id = (v_out->>'material_id')::uuid,
			session_id = (v_out->>'session_id')::uuid
		where id = v_pact.id;
		return v_out || jsonb_build_object('status', 'agreed', 'pact_id', v_pact.id);
	end if;

	return jsonb_build_object(
		'status', 'pending',
		'pact_id', v_pact.id,
		'approvals', v_approvals,
		'needed', v_needed
	);
end;
$$;

grant execute on function public.approve_material_pact(uuid)
	to authenticated, service_role;

-- Expira pendientes vencidos sin quórum: el barista/cron los lista y
-- sortea entre lo postulado con resolve_material_draw (fallback día 7).
create or replace function public.expire_material_pacts()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	v_count integer;
begin
	with expired as (
		update public.material_pacts
		set status = 'expired', decided_at = now()
		where status = 'pending'
			and expires_at is not null
			and expires_at <= now()
		returning id
	)
	select count(*) into v_count from expired;
	return jsonb_build_object('expired', v_count);
end;
$$;

grant execute on function public.expire_material_pacts()
	to authenticated, service_role;
