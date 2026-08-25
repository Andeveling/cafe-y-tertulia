-- Ticket #39: Convocatoria — Moderador pings a Miembro to a Sala abierta.
-- Table, RLS, RPCs (convocar, responder_convocatoria), realtime.

-- ============================================================
-- 1. Enum
-- ============================================================

create type public.convocatoria_status as enum ('pending', 'accepted', 'dismissed');

-- ============================================================
-- 2. Table
-- ============================================================

create table public.convocatorias (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null references public.sessions (id) on delete cascade,
	from_id uuid not null references public.members (id),
	to_id uuid not null references public.members (id),
	status public.convocatoria_status not null default 'pending',
	created_at timestamptz not null default now()
);

comment on table public.convocatorias is 'Convocatoria: Moderador llama a un Miembro a una Sala abierta (CONTEXT §Convocatoria)';

create unique index convocatorias_pending_unique
	on public.convocatorias (session_id, to_id)
	where status = 'pending';

create index convocatorias_to_id_idx on public.convocatorias (to_id);
create index convocatorias_session_id_idx on public.convocatorias (session_id);

-- ============================================================
-- 3. RLS
-- ============================================================

alter table public.convocatorias enable row level security;

-- Select: members see convocatorias where they are from_id or to_id.
create policy "convocatorias_select_own" on public.convocatorias
	for select
	to authenticated
	using (
		(select auth.uid()) = to_id
		or (select auth.uid()) = from_id
	);

-- Insert/update: only via RPCs (no direct policy).
-- This means authenticated users cannot insert or update directly.

-- ============================================================
-- 4. RPC: convocar
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
begin
	-- Caller must be an active member.
	if not public.is_member() then
		raise exception 'Solo miembros';
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

	-- Insert pending, or no-op if already pending (idempotent).
	insert into public.convocatorias (session_id, from_id, to_id, status)
	values (p_session_id, auth.uid(), p_to_id, 'pending')
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

grant execute on function public.convocar(uuid, uuid) to authenticated;

-- ============================================================
-- 5. RPC: responder_convocatoria
-- ============================================================

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
begin
	-- Only the addressed member can respond, and only if pending.
	update public.convocatorias
	set status = case
		when p_accept then 'accepted'::public.convocatoria_status
		else 'dismissed'::public.convocatoria_status
	end
	where id = p_id
	and to_id = auth.uid()
	and status = 'pending'
	returning session_id into v_session_id;

	if v_session_id is null then
		raise exception 'Convocatoria no encontrada o ya respondida';
	end if;

	return v_session_id;
end;
$$;

grant execute on function public.responder_convocatoria(uuid, boolean) to authenticated;

-- ============================================================
-- 6. Data API grants
-- ============================================================

grant select on public.convocatorias to authenticated;

-- ============================================================
-- 7. Realtime
-- ============================================================

alter publication supabase_realtime add table public.convocatorias;
