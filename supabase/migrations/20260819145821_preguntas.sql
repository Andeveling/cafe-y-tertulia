-- Ticket #15: preguntas del pool (SPEC §2.5, §4.1 · ADR 0001, 0005)
-- Un Miembro activo aporta una Pregunta a una Sesión en `preparation` sobre un
-- Material; el pool de la Sesión es visible para el club. El moderador puede
-- marcar "Fuera de sorteo" (duplicada o fuera de contexto).
-- Solo los Miembros del club crean Preguntas (RLS, ADR 0005).

-- ============================================================
-- Table
-- ============================================================

create table public.questions (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null references public.sessions (id) on delete cascade,
	-- denormalizado para Histórico (SPEC §2.5)
	material_id uuid not null references public.materials (id) on delete cascade,
	author_id uuid not null references public.members (id),
	text text not null check (length(trim(text)) > 0),
	outside_draw boolean not null default false,
	created_at timestamptz not null default now()
);

comment on table public.questions is 'Pregunta abierta que un Miembro aporta para una Sesión sobre un Material (SPEC §2.5)';
comment on column public.questions.outside_draw is '"Fuera de sorteo": la excluye el moderador del Sorteo (ADR 0001)';

create index questions_session_id_idx on public.questions (session_id);
create index questions_material_id_idx on public.questions (material_id);

-- ============================================================
-- Helpers
-- ============================================================

-- ¿Es el usuario el moderador de la Sesión? El moderador puede marcar
-- "Fuera de sorteo" sobre cualquier Pregunta del pool de su Sesión.
create function public.is_session_moderator(session_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
	select exists (
		select 1
		from public.sessions s
		where s.id = session_id
		and s.moderator_id = auth.uid()
	);
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.questions enable row level security;

-- Select: el pool de cada Sesión es visible para todo Miembro activo del club
-- (la cerradura es la membresía, ADR 0005).
create policy "questions_select_member" on public.questions
	for select
	to authenticated
	using (public.is_member());

-- Insert: solo un Miembro activo crea Preguntas; la autoría es indelegable
-- (author_id = auth.uid()), el author debe ser Miembro activo, la Sesión debe
-- estar en `preparation`, y el material denormalizado debe coincidir con el de
-- la Sesión (invariante para Histórico, SPEC §2.5).
create policy "questions_insert_member" on public.questions
	for insert
	to authenticated
	with check (
		public.is_member()
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.members m
			where m.id = author_id
			and m.status = 'active'
		)
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.status = 'preparation'
			and s.material_id = material_id
		)
	);

-- Update: solo el moderador de la Sesión marca/desmarca "Fuera de sorteo".
-- La autoría/sesión/material/texto quedan inmutables para los Miembros: solo
-- se concede UPDATE sobre outside_draw (ver grants), de modo que ni el
-- moderador puede reescribir el author_id ni editar el texto.
create policy "questions_update_moderator" on public.questions
	for update
	to authenticated
	using (
		public.is_member()
		and public.is_session_moderator(session_id)
	)
	with check (
		public.is_member()
		and public.is_session_moderator(session_id)
	);

-- Delete: fuera del MVP (el pool se conserva como memoria del club).
-- Sin política de delete: los Miembros no pueden borrar Preguntas.

-- ============================================================
-- Data API: exponer a authenticated (el anon no accede a nada del club)
-- ============================================================

grant select, insert, update (outside_draw) on table public.questions to authenticated;
grant execute on function public.is_session_moderator(uuid) to authenticated;
