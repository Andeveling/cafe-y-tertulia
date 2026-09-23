-- [multi-grupo] 05 Contract (#74, PRD #69, ADR-0013).
--
-- Cierre del modelo: ya no existe ningún dato sin grupo ni ningún acceso
-- fuera de is_group_member(). Todo group_id pasa a NOT NULL con FK a
-- groups(id) ON DELETE CASCADE, las políticas viejas con is_member() en
-- contenido desaparecen y el acceso anónimo a materials/sessions se elimina
-- (la memoria pública por-grupo queda para después, PRD §Out of Scope).
--
-- Todo el archivo corre en UNA SOLA TRANSACCIÓN (Supabase ejecuta cada
-- migración en una transacción; si cualquier ALTER falla, nada se aplica).
-- Probar primero en staging con datos reales antes de producción.
--
-- ROLLBACK si staging falla (no se necesita down-migration: la transacción
-- revierte sola; esto es solo guía operativa):
--  1. La migración es atómica: un error en cualquier ALTER/CONSTRAINT hace
--     ROLLBACK automático, la DB queda como antes (group_id nullable, sin FK).
--  2. Si ya se aplicó en staging y hay que revertir el entorno: restaurar el
--     snapshot previo de staging (pg_dump tomado antes de aplicar) o aplicar
--     manualmente:
--       ALTER TABLE public.<t> DROP CONSTRAINT IF EXISTS <t>_group_id_fkey;
--       ALTER TABLE public.<t> ALTER COLUMN group_id DROP NOT NULL;
--       GRANT SELECT ON public.materials, public.sessions TO anon;
--     donde <t> es cada una de las 20 tablas listadas abajo.
--  3. No hay pérdida de datos en rollback: el backfill a nojau solo rellena
--     NULLs; si se revierte, esos valores quedan (no se borran filas).
--  4. Si el fallo es por NULLs huérfanos sin nojau (DO block raise), crear el
--     grupo nojau o corregir el origen y reintentar; no forzar NOT NULL.
--
-- Contenido:
--  1. Backfill de seguridad: cualquier group_id NULL cae a nojau.
--  2. group_id SET NOT NULL en las 20 tablas scopeadas.
--  3. FK group_id → groups(id) ON DELETE CASCADE (borrar grupo borra todo).
--  4. Cierre anon: DROP de policies anon restantes + REVOKE SELECT a anon
--     en contenido (anon recibe 42501 en vez de vacío: ya no hay lectura).
--  5. Guardas fail-closed: la migración falla si queda is_member() o rol
--     anon en políticas de las 20 tablas (groups/group_members/members/
--     invitations quedan fuera: son checks de plataforma, no contenido).

-- ============================================================
-- 1. Backfill de seguridad a nojau (por si service_role coló NULLs)
-- ============================================================

do $$
declare
	v_nojau_id uuid;
	v_nulls int := 0;
begin
	select id into v_nojau_id
	from public.groups
	where name = 'nojau'
	limit 1;

	-- Cuenta NULLs en las 20 tablas para decidir.
	select (
		(select count(*) from public.materials where group_id is null) +
		(select count(*) from public.sessions where group_id is null) +
		(select count(*) from public.categories where group_id is null) +
		(select count(*) from public.material_categories where group_id is null) +
		(select count(*) from public.session_categories where group_id is null) +
		(select count(*) from public.seasons where group_id is null) +
		(select count(*) from public.badges where group_id is null) +
		(select count(*) from public.awards where group_id is null) +
		(select count(*) from public.counts where group_id is null) +
		(select count(*) from public.season_recognitions where group_id is null) +
		(select count(*) from public.trivias where group_id is null) +
		(select count(*) from public.questions where group_id is null) +
		(select count(*) from public.draws where group_id is null) +
		(select count(*) from public.assignments where group_id is null) +
		(select count(*) from public.session_participants where group_id is null) +
		(select count(*) from public.takes where group_id is null) +
		(select count(*) from public.trivia_rounds where group_id is null) +
		(select count(*) from public.votes where group_id is null) +
		(select count(*) from public.hearts where group_id is null) +
		(select count(*) from public.convocatorias where group_id is null)
	) into v_nulls;

	if v_nulls > 0 and v_nojau_id is null then
		raise exception 'Contract bloqueado: hay % filas sin grupo y no existe nojau para backfill', v_nulls
			using errcode = 'P0001';
	end if;

	if v_nojau_id is not null then
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
	end if;
end
$$;

-- ============================================================
-- 2. group_id NOT NULL en las 20 tablas (una sola transacción)
-- ============================================================

alter table public.materials alter column group_id set not null;
alter table public.sessions alter column group_id set not null;
alter table public.categories alter column group_id set not null;
alter table public.material_categories alter column group_id set not null;
alter table public.session_categories alter column group_id set not null;
alter table public.seasons alter column group_id set not null;
alter table public.badges alter column group_id set not null;
alter table public.awards alter column group_id set not null;
alter table public.counts alter column group_id set not null;
alter table public.season_recognitions alter column group_id set not null;
alter table public.trivias alter column group_id set not null;
alter table public.questions alter column group_id set not null;
alter table public.draws alter column group_id set not null;
alter table public.assignments alter column group_id set not null;
alter table public.session_participants alter column group_id set not null;
alter table public.takes alter column group_id set not null;
alter table public.trivia_rounds alter column group_id set not null;
alter table public.votes alter column group_id set not null;
alter table public.hearts alter column group_id set not null;
alter table public.convocatorias alter column group_id set not null;

-- ============================================================
-- 3. FKs group_id → groups(id) ON DELETE CASCADE
-- ============================================================
-- Borrar un grupo borra todo su contenido (PRD: hard delete con cascada).
-- Nombres explícitos <tabla>_group_id_fkey para un rollback quirúrgico.

alter table public.materials
	add constraint materials_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.sessions
	add constraint sessions_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.categories
	add constraint categories_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.material_categories
	add constraint material_categories_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.session_categories
	add constraint session_categories_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.seasons
	add constraint seasons_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.badges
	add constraint badges_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.awards
	add constraint awards_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.counts
	add constraint counts_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.season_recognitions
	add constraint season_recognitions_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.trivias
	add constraint trivias_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.questions
	add constraint questions_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.draws
	add constraint draws_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.assignments
	add constraint assignments_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.session_participants
	add constraint session_participants_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.takes
	add constraint takes_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.trivia_rounds
	add constraint trivia_rounds_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.votes
	add constraint votes_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.hearts
	add constraint hearts_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;
alter table public.convocatorias
	add constraint convocatorias_group_id_fkey
	foreign key (group_id) references public.groups (id) on delete cascade;

-- ============================================================
-- 4. Cierre anon: sin lectura anónima en contenido
-- ============================================================
-- Los lotes A/B ya tumbaron las policies anon pero conservaron los GRANTs
-- para recibir vacío en la transición. El contract revoca los GRANTs: anon
-- ya no lee materials/sessions (ni el resto del contenido por-grupo).
-- members_select_anon se conserva: members es identidad global, no contenido.

drop policy if exists "materials_select_anon" on public.materials;
drop policy if exists "sessions_select_anon" on public.sessions;
drop policy if exists "questions_select_anon" on public.questions;
drop policy if exists "participants_select_anon" on public.session_participants;
drop policy if exists "draws_select_anon" on public.draws;
drop policy if exists "assignments_select_anon" on public.assignments;
drop policy if exists "trivias_select_anon" on public.trivias;
drop policy if exists "trivia_items_select_anon" on public.trivia_items;
drop policy if exists "trivia_rounds_select_anon" on public.trivia_rounds;
drop policy if exists "trivia_hits_select_anon" on public.trivia_hits;
drop policy if exists "takes_select_anon" on public.takes;
drop policy if exists "badges_select_anon" on public.badges;
drop policy if exists "awards_select_anon" on public.awards;

revoke select on public.materials from anon;
revoke select on public.sessions from anon;
revoke select on public.categories from anon;
revoke select on public.material_categories from anon;
revoke select on public.session_categories from anon;
revoke select on public.seasons from anon;
revoke select on public.badges from anon;
revoke select on public.awards from anon;
revoke select on public.counts from anon;
revoke select on public.season_recognitions from anon;
revoke select on public.trivias from anon;
revoke select on public.questions from anon;
revoke select on public.draws from anon;
revoke select on public.assignments from anon;
revoke select on public.session_participants from anon;
revoke select on public.takes from anon;
revoke select on public.trivia_rounds from anon;
revoke select on public.votes from anon;
revoke select on public.hearts from anon;
revoke select on public.convocatorias from anon;
revoke select on public.trivia_items from anon;
revoke select on public.trivia_answers from anon;
revoke select on public.trivia_hits from anon;
revoke select on public.take_votes from anon;

-- ============================================================
-- 5. Guardas fail-closed: ni is_member() ni anon en contenido
-- ============================================================
-- is_member() queda solo para checks de plataforma (groups público,
-- create/join/leave, perfil, Mis Grupos). Si alguna política de las 20
-- tablas scopeadas aún lo usa, la migración falla y nada se aplica.
-- Igual si alguna política de contenido deja entrar a anon.

do $$
declare
	v_bad_policy text;
	v_anon_policy text;
begin
	select schemaname || '.' || tablename || '.' || policyname into v_bad_policy
	from pg_policies
	where schemaname = 'public'
	and tablename in (
		'materials', 'sessions', 'categories', 'material_categories',
		'session_categories', 'seasons', 'badges', 'awards', 'counts',
		'season_recognitions', 'trivias', 'questions', 'draws', 'assignments',
		'session_participants', 'takes', 'trivia_rounds', 'votes', 'hearts',
		'convocatorias'
	)
	and definition ilike '%is_member()%'
	limit 1;

	if v_bad_policy is not null then
		raise exception 'Contract bloqueado: la política % aún usa is_member(); debe usar is_group_member(group_id)', v_bad_policy
			using errcode = 'P0001';
	end if;

	select schemaname || '.' || tablename || '.' || policyname into v_anon_policy
	from pg_policies
	where schemaname = 'public'
	and tablename in (
		'materials', 'sessions', 'categories', 'material_categories',
		'session_categories', 'seasons', 'badges', 'awards', 'counts',
		'season_recognitions', 'trivias', 'questions', 'draws', 'assignments',
		'session_participants', 'takes', 'trivia_rounds', 'votes', 'hearts',
		'convocatorias', 'trivia_items', 'trivia_answers', 'trivia_hits', 'take_votes'
	)
	and roles::text ilike '%anon%'
	limit 1;

	if v_anon_policy is not null then
		raise exception 'Contract bloqueado: la política % aún permite a anon; el contenido es solo por grupo', v_anon_policy
			using errcode = 'P0001';
	end if;
end
$$;

comment on column public.materials.group_id is 'Grupo dueño (NOT NULL, FK cascade, contract #74).';
comment on column public.sessions.group_id is 'Grupo dueño (NOT NULL, FK cascade, contract #74).';
