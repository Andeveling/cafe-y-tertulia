-- Tests para Categorías (issues #59/#60/#61).
-- Seam: categories/material_categories/session_categories + guard
-- session_categories_guard + RLS is_member.

begin;
select plan(8);

-- ============================================================
-- Fixtures
-- ============================================================

insert into auth.users (id, email) values
	('11111111-1111-1111-1111-111111111111', 'miembro@club.test'),
	('44444444-4444-4444-4444-444444444444', 'externo@club.test');

insert into public.members (id, status, display_name) values
	('11111111-1111-1111-1111-111111111111', 'active', 'Miembro'),
	('44444444-4444-4444-4444-444444444444', 'invited', 'Invitado');

insert into public.materials (id, title, kind, author, created_by) values
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Libro de prueba', 'book', 'Alguien', '11111111-1111-1111-1111-111111111111');

insert into public.sessions (id, material_id, range, status, moderator_id) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cap 1-3', 'preparation', '11111111-1111-1111-1111-111111111111'),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', null, null, 'preparation', '11111111-1111-1111-1111-111111111111'),
	('dddddddd-dddd-dddd-dddd-dddddddddddd', null, null, 'closed', '11111111-1111-1111-1111-111111111111');

-- ============================================================
-- Tests
-- ============================================================

-- 1. Seeds: 5 categorías con icono HugeIcons.
select is(
	(select count(*) from public.categories where icon is not null and icon <> ''),
	5::bigint,
	'1. Hay 5 categorías con icono'
);

-- 2. Un miembro activo ve las categorías.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
	(select count(*) from public.categories),
	5::bigint,
	'2. Un miembro activo ve las 5 categorías'
);

-- 3. Un invitado no ve las categorías.
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is(
	(select count(*) from public.categories),
	0::bigint,
	'3. Un invitado no ve categorías'
);

-- 4. Un miembro asigna categorías a un material.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.material_categories (material_id, category_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', id from public.categories where key = 'filosofia';

select ok(
	exists (
		select 1 from public.material_categories
		where material_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
	),
	'4. Un miembro asigna categorías a un material'
);

-- 5. La sesión con material hereda: etiquetado directo se rechaza.
select throws_ok(
	$$insert into public.session_categories (session_id, category_id)
	select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', id from public.categories where key = 'filosofia'$$,
	'P0001', null,
	'5. La sesión con material rechaza categorías propias'
);

-- 6. La sesión sin material acepta categorías propias (opcional).
insert into public.session_categories (session_id, category_id)
select 'cccccccc-cccc-cccc-cccc-cccccccccccc', id from public.categories where key = 'cine';

select ok(
	exists (
		select 1 from public.session_categories
		where session_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
	),
	'6. La sesión sin material acepta categorías propias'
);

-- 7. La sesión cerrada rechaza cambios.
select throws_ok(
	$$insert into public.session_categories (session_id, category_id)
	select 'dddddddd-dddd-dddd-dddd-dddddddddddd', id from public.categories where key = 'cine'$$,
	'P0001', null,
	'7. La sesión cerrada rechaza categorías'
);

-- 8. Quitar la categoría en sesión abierta funciona.
delete from public.session_categories
where session_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select is(
	(select count(*) from public.session_categories where session_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
	0::bigint,
	'8. Quitar la categoría en sesión abierta funciona'
);

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
