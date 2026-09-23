-- [multi-grupo] 05 Contract (#74, PRD #69, ADR-0013).
-- Ya no hay datos sin grupo ni accesos fuera de is_group_member():
-- group_id NOT NULL con FK cascade, sin is_member() en contenido y sin
-- anon en materials/sessions. Verificación: privada invisible fuera,
-- A no lee/escribe B, salir revoca.

begin;
select plan(18);

-- ============================================================
-- Fixtures: 3 Miembros activos + grupo A (público) y B (privado)
-- ============================================================

insert into auth.users (id, email) values
	('d1111111-1111-1111-1111-111111111111', 'contract-admin-a@club.test'),
	('d2222222-2222-2222-2222-222222222222', 'contract-a2@club.test'),
	('d3333333-3333-3333-3333-333333333333', 'contract-admin-b@club.test');

insert into public.members (id, status, display_name, created_at) values
	('d1111111-1111-1111-1111-111111111111', 'active', 'Admin A', now() - interval '3 days'),
	('d2222222-2222-2222-2222-222222222222', 'active', 'Miembro A2', now() - interval '2 days'),
	('d3333333-3333-3333-3333-333333333333', 'active', 'Admin B', now() - interval '1 day');

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-1111-1111-111111111111';
select public.create_group('Grupo Contract A', 'Público de prueba', null, 'public');
set local request.jwt.claim.sub = 'd3333333-3333-3333-3333-333333333333';
select public.create_group('Grupo Contract B', 'Privado de prueba', null, 'private');

set local request.jwt.claim.sub = 'd2222222-2222-2222-2222-222222222222';
select public.join_group((select id from public.groups where name = 'Grupo Contract A'));

reset role;
reset request.jwt.claim.sub;

insert into public.materials (id, group_id, title, kind, author, created_by) values
	('d0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo Contract A'), 'Material A', 'book', 'Autora A', 'd1111111-1111-1111-1111-111111111111'),
	('d0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo Contract B'), 'Material B', 'book', 'Autora B', 'd3333333-3333-3333-3333-333333333333');

-- 1. group_id NOT NULL en las 20 tablas scopeadas.
select is(
	(select count(*) from information_schema.columns
	 where table_schema = 'public' and column_name = 'group_id' and is_nullable = 'NO'
	 and table_name in ('materials', 'sessions', 'categories', 'material_categories',
		'session_categories', 'seasons', 'badges', 'awards', 'counts',
		'season_recognitions', 'trivias', 'questions', 'draws', 'assignments',
		'session_participants', 'takes', 'trivia_rounds', 'votes', 'hearts',
		'convocatorias')),
	20::bigint,
	'1. group_id es NOT NULL en las 20 tablas'
);

-- 2. FKs group_id → groups(id) con ON DELETE CASCADE.
select is(
	(select count(*) from information_schema.table_constraints tc
	 join information_schema.key_column_usage kcu
	   on kcu.constraint_name = tc.constraint_name
	  and kcu.table_schema = tc.table_schema
	 join information_schema.referential_constraints rc
	   on rc.constraint_name = tc.constraint_name
	  and rc.constraint_schema = tc.table_schema
	 where tc.table_schema = 'public'
	 and tc.constraint_type = 'FOREIGN KEY'
	 and kcu.column_name = 'group_id'
	 and rc.unique_constraint_schema = 'public'
	 and rc.delete_rule = 'CASCADE'
	 and tc.table_name in ('materials', 'sessions', 'categories', 'material_categories',
		'session_categories', 'seasons', 'badges', 'awards', 'counts',
		'season_recognitions', 'trivias', 'questions', 'draws', 'assignments',
		'session_participants', 'takes', 'trivia_rounds', 'votes', 'hearts',
		'convocatorias')),
	20::bigint,
	'2. Las 20 FKs a groups(id) son ON DELETE CASCADE'
);

-- 3. Sin is_member() en políticas de contenido (solo plataforma).
select is(
	(select count(*) from pg_policies
	 where schemaname = 'public'
	 and tablename in ('materials', 'sessions', 'categories', 'material_categories',
		'session_categories', 'seasons', 'badges', 'awards', 'counts',
		'season_recognitions', 'trivias', 'questions', 'draws', 'assignments',
		'session_participants', 'takes', 'trivia_rounds', 'votes', 'hearts',
		'convocatorias')
	 and definition ilike '%is_member()%'),
	0::bigint,
	'3. Ninguna política de contenido usa is_member()'
);

-- 4. Sin rol anon en políticas de contenido.
select is(
	(select count(*) from pg_policies
	 where schemaname = 'public'
	 and tablename in ('materials', 'sessions', 'categories', 'material_categories',
		'session_categories', 'seasons', 'badges', 'awards', 'counts',
		'season_recognitions', 'trivias', 'questions', 'draws', 'assignments',
		'session_participants', 'takes', 'trivia_rounds', 'votes', 'hearts',
		'convocatorias', 'trivia_items', 'trivia_answers', 'trivia_hits', 'take_votes')
	 and roles::text ilike '%anon%'),
	0::bigint,
	'4. Ninguna política de contenido permite a anon'
);

set local role authenticated;

-- 5-6. Privada invisible fuera; pública visible a miembros activos.
set local request.jwt.claim.sub = 'd2222222-2222-2222-2222-222222222222';
select is(
	(select count(*) from public.groups where name = 'Grupo Contract B'),
	0::bigint,
	'5. No-miembro no ve el grupo privado B'
);
select is(
	(select count(*) from public.groups where name = 'Grupo Contract A'),
	1::bigint,
	'6. Miembro ve su grupo público A'
);

-- 7-8. Miembro de A lee lo suyo y nada de B.
set local request.jwt.claim.sub = 'd1111111-1111-1111-1111-111111111111';
select is(
	(select count(*) from public.materials where title = 'Material A'),
	1::bigint,
	'7. Miembro de A lee el material de su grupo'
);
select is(
	(select count(*) from public.materials where title = 'Material B'),
	0::bigint,
	'8. Miembro de A no ve el material del grupo B'
);

-- 9. Miembro de A no escribe en B.
do $$
begin
	insert into public.materials (group_id, title, kind, author, created_by)
	values (
		(select id from public.groups where name = 'Grupo Contract B'),
		'Intruso', 'book', 'X', 'd1111111-1111-1111-1111-111111111111'
	);
	raise exception 'insert should have been blocked';
exception
	when others then
		null;
end $$;
select is(
	(select count(*) from public.materials where title = 'Intruso'),
	0::bigint,
	'9. Miembro de A no inserta en B'
);

-- 10. Sin group_id no hay insert (NOT NULL, como superusuario para que
-- RLS no oculte el error de constraint).
reset role;
do $$
begin
	insert into public.materials (group_id, title, kind, author, created_by)
	values (null, 'Sin grupo', 'book', 'X', 'd1111111-1111-1111-1111-111111111111');
	raise exception 'null should have been blocked';
exception
	when others then
		null;
end $$;
select ok(
	(select count(*) from public.materials where title = 'Sin grupo') = 0,
	'10. NULL en group_id se rechaza'
);
set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-1111-1111-111111111111';

-- 11. FK huérfana se rechaza.
reset role;
do $$
begin
	insert into public.materials (group_id, title, kind, author, created_by)
	values ('00000000-0000-0000-0000-000000000000', 'Huerfano', 'book', 'X', 'd1111111-1111-1111-1111-111111111111');
	raise exception 'fk should have been blocked';
exception
	when others then
		null;
end $$;
select ok(
	(select count(*) from public.materials where title = 'Huerfano') = 0,
	'11. group_id inexistente viola la FK'
);
set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-1111-1111-111111111111';

-- 12. group_id inmutable (UPDATE no migra entre grupos).
do $$
begin
	update public.materials set group_id = (select id from public.groups where name = 'Grupo Contract B')
	where id = 'd0000000-0000-0000-0000-000000000001';
	raise exception 'move should have been blocked';
exception
	when others then
		null;
end $$;
select is(
	(select count(*) from public.materials
	 where id = 'd0000000-0000-0000-0000-000000000001'
	 and group_id = (select id from public.groups where name = 'Grupo Contract A')),
	1::bigint,
	'12. El material no migra de grupo por UPDATE'
);

-- 13-14. Anon no lee materials ni sessions.
reset request.jwt.claim.sub;
set local role anon;
select is((select count(*) from public.materials), 0::bigint, '13. Anon no lee materials');
select is((select count(*) from public.sessions), 0::bigint, '14. Anon no lee sessions');

-- 15-16. Salir revoca: A2 deja A y ya no ve su contenido.
set local role authenticated;
set local request.jwt.claim.sub = 'd2222222-2222-2222-2222-222222222222';
select public.leave_group((select id from public.groups where name = 'Grupo Contract A'));
select is(
	(select count(*) from public.materials where title = 'Material A'),
	0::bigint,
	'15. Salir del grupo revoca su contenido'
);
select is(
	(select count(*) from public.groups where name = 'Grupo Contract A'),
	0::bigint,
	'16. Salir quita el grupo de Mis Grupos (privada sigue invisible)'
);

-- 17-18. is_member() sigue vivo solo para plataforma (catálogo público).
select ok(
	(select pg_get_functiondef(oid) ilike '%is_member%')
	from pg_proc where proname = 'is_member' limit 1,
	'17. is_member() existe para checks de plataforma'
);
select ok(
	exists (select 1 from pg_policies
	 where schemaname = 'public' and tablename = 'groups'
	 and policyname = 'groups_select_member_or_public'),
	'18. El catálogo público de grupos sigue por is_member()'
);

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
