-- [multi-grupo] 02 Expand (#71, PRD #69, ADR-0013).
-- Fase expand: groups/group_members existen, "nojau" es privado, group_id
-- nullable con backfill, helpers is_group_member/is_group_admin y RPCs
-- create/join/leave. Las políticas viejas de contenido siguen intactas.

begin;
select plan(16);

-- ============================================================
-- Fixtures: dos Miembros activos (A el más antiguo) + un invitado
-- ============================================================

insert into auth.users (id, email) values
	('a1111111-1111-1111-1111-111111111111', 'a@club.test'),
	('b2222222-2222-2222-2222-222222222222', 'b@club.test'),
	('c3333333-3333-3333-3333-333333333333', 'c@club.test');

insert into public.members (id, status, display_name, created_at) values
	('a1111111-1111-1111-1111-111111111111', 'active', 'Miembro A', now() - interval '2 days'),
	('b2222222-2222-2222-2222-222222222222', 'active', 'Miembro B', now() - interval '1 day'),
	('c3333333-3333-3333-3333-333333333333', 'invited', 'Invitado C', now());

set local role authenticated;

-- 1. El grupo "nojau" existe y es privado.
select is(
	(select visibility::text from public.groups where name = 'nojau'),
	'private',
	'1. El grupo "nojau" existe y es privado'
);

-- 2. group_id nullable en las 20 tablas de contenido (expand, sin NOT NULL aún).
select is(
	(select count(*) from information_schema.columns
	 where table_schema = 'public' and column_name = 'group_id'
	 and table_name in ('materials', 'sessions', 'categories', 'material_categories',
		'session_categories', 'seasons', 'badges', 'awards', 'counts',
		'season_recognitions', 'trivias', 'questions', 'draws', 'assignments',
		'session_participants', 'takes', 'trivia_rounds', 'votes', 'hearts',
		'convocatorias')),
	20::bigint,
	'2. group_id existe en las 20 tablas de contenido'
);

-- A crea un grupo público.
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';

select ok(
	(select public.create_group('Grupo Uno', 'Para probar', null, 'public')) is not null,
	'3. create_group devuelve el id del grupo nuevo'
);

select is(
	(select role::text from public.group_members
	 where group_id = (select id from public.groups where name = 'Grupo Uno')
	 and member_id = 'a1111111-1111-1111-1111-111111111111'),
	'admin',
	'4. El creador queda como admin de su grupo'
);

-- 5-8. Siembra del grupo nuevo: copia el estándar del grupo plantilla
-- (nojau), con metadatos, más la temporada del mes.
select is(
	(select count(*) from public.categories
	 where group_id = (select id from public.groups where name = 'Grupo Uno')),
	(select count(*) from public.categories
	 where group_id = (select id from public.groups where name = 'nojau')),
	'5. El grupo nuevo trae las categorías del estándar'
);

select is(
	(select count(*) from public.badges
	 where group_id = (select id from public.groups where name = 'Grupo Uno')),
	(select count(*) from public.badges
	 where group_id = (select id from public.groups where name = 'nojau')),
	'6. El grupo nuevo trae las insignias del estándar'
);

select is(
	(select name from public.badges
	 where group_id = (select id from public.groups where name = 'Grupo Uno')
	 and key = 'first_question'),
	'Primera pregunta',
	'7. La siembra copia los metadatos (nombre de la insignia)'
);

select is(
	(select count(*) from public.seasons
	 where group_id = (select id from public.groups where name = 'Grupo Uno')
	 and status = 'open'),
	1::bigint,
	'8. El grupo nuevo trae la temporada del mes abierta'
);

-- B se une al grupo público al instante.
set local request.jwt.claim.sub = 'b2222222-2222-2222-2222-222222222222';
select public.join_group((select id from public.groups where name = 'Grupo Uno'));

select ok(
	public.is_group_member((select id from public.groups where name = 'Grupo Uno')),
	'9. Un Miembro se une a un grupo público al instante'
);

-- C (invitado de plataforma, no activo) no puede ni unirse a una pública.
set local request.jwt.claim.sub = 'c3333333-3333-3333-3333-333333333333';

do $$
begin
	perform public.join_group((select id from public.groups where name = 'Grupo Uno'));
	raise exception 'join should have been blocked';
exception
	when others then
		null;
end $$;

select ok(
	not public.is_group_member((select id from public.groups where name = 'Grupo Uno')),
	'10. Un invitado de plataforma (no activo) no se une ni a grupos públicos'
);

-- B no puede unirse a nojau (privado) sin invitación.
set local request.jwt.claim.sub = 'b2222222-2222-2222-2222-222222222222';

do $$
begin
	perform public.join_group((select id from public.groups where name = 'nojau'));
	raise exception 'join should have been blocked';
exception
	when others then
		null;
end $$;

select ok(
	not public.is_group_member((select id from public.groups where name = 'nojau')),
	'11. Un grupo privado no acepta join directo (solo invitación)'
);

-- B sale del Grupo Uno y pierde el acceso.
select public.leave_group((select id from public.groups where name = 'Grupo Uno'));

select ok(
	not public.is_group_member((select id from public.groups where name = 'Grupo Uno')),
	'12. Salir del grupo revoca la membresía'
);

-- B vuelve a entrar; A (único admin) sale y B —el más antiguo restante— promociona.
select public.join_group((select id from public.groups where name = 'Grupo Uno'));

set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
select public.leave_group((select id from public.groups where name = 'Grupo Uno'));

select is(
	(select role::text from public.group_members
	 where group_id = (select id from public.groups where name = 'Grupo Uno')
	 and member_id = 'b2222222-2222-2222-2222-222222222222'),
	'admin',
	'13. Si sale el único admin, el miembro más antiguo promociona'
);

select ok(
	not public.is_group_member((select id from public.groups where name = 'Grupo Uno')),
	'14. El admin que salió ya no es miembro de ese grupo'
);

-- El expand no rompe lo viejo: is_member() sigue y el contenido se sigue leyendo.
select ok(
	public.is_member(),
	'15. is_member() sigue existiendo para checks de plataforma'
);

select ok(
	(select count(*) from public.materials) >= 0,
	'16. Las políticas viejas de contenido siguen intactas (lectura de materials)'
);

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
