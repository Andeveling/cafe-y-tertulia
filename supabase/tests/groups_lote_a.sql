-- [multi-grupo] 03 Migrate RLS lote A (#72, PRD #69, ADR-0013).
-- Contenido core aislado por grupo: materials, sessions, categories,
-- material_categories, session_categories, seasons y convocatorias pasan de
-- is_member() global a is_group_member(group_id). Anon deja de leer
-- materials/sessions. is_member() queda solo para plataforma.

begin;
select plan(20);

-- ============================================================
-- Fixtures: 4 Miembros activos + grupo A (público) y B (privado)
-- ============================================================

insert into auth.users (id, email) values
	('a1111111-1111-1111-1111-111111111111', 'lotea-admin-a@club.test'),
	('a2222222-2222-2222-2222-222222222222', 'lotea-a2@club.test'),
	('b1111111-1111-1111-1111-111111111111', 'lotea-admin-b@club.test'),
	('c1111111-1111-1111-1111-111111111111', 'lotea-out@club.test');

insert into public.members (id, status, display_name, created_at) values
	('a1111111-1111-1111-1111-111111111111', 'active', 'Admin A', now() - interval '3 days'),
	('a2222222-2222-2222-2222-222222222222', 'active', 'Miembro A2', now() - interval '2 days'),
	('b1111111-1111-1111-1111-111111111111', 'active', 'Admin B', now() - interval '1 day'),
	('c1111111-1111-1111-1111-111111111111', 'active', 'Sin Grupo', now());

-- Admin A crea el grupo público; Admin B el privado (siembra incluida).
set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
select public.create_group('Grupo A', 'Público de prueba', null, 'public');
set local request.jwt.claim.sub = 'b1111111-1111-1111-1111-111111111111';
select public.create_group('Grupo B', 'Privado de prueba', null, 'private');

-- A2 se une a la pública al instante.
set local request.jwt.claim.sub = 'a2222222-2222-2222-2222-222222222222';
select public.join_group((select id from public.groups where name = 'Grupo A'));

reset role;
reset request.jwt.claim.sub;

-- Contenido de cada grupo (setup como superusuario, salta RLS).
insert into public.materials (id, group_id, title, kind, author, created_by) values
	('d0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo A'), 'Material de A', 'book', 'Autora A', 'a1111111-1111-1111-1111-111111111111'),
	('d0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo B'), 'Material de B', 'book', 'Autora B', 'b1111111-1111-1111-1111-111111111111');

insert into public.sessions (id, group_id, material_id, range, status, moderator_id) values
	('e0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo A'), 'd0000000-0000-0000-0000-000000000001', 'Cap. 1', 'lobby', 'a1111111-1111-1111-1111-111111111111'),
	('e0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo B'), 'd0000000-0000-0000-0000-000000000002', 'Cap. 1', 'lobby', 'b1111111-1111-1111-1111-111111111111');

set local role authenticated;

-- 1-2. Miembro de A ve su material y no el de B.
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
select is(
	(select count(*) from public.materials where title = 'Material de A'),
	1::bigint,
	'1. Miembro de A lee el material de su grupo'
);
select is(
	(select count(*) from public.materials where title = 'Material de B'),
	0::bigint,
	'2. Miembro de A no ve el material del grupo B'
);

-- 3. Miembro de B ve el suyo y no el de A.
set local request.jwt.claim.sub = 'b1111111-1111-1111-1111-111111111111';
select is(
	(select count(*) from public.materials where title = 'Material de B'),
	1::bigint,
	'3. Miembro de B lee el material de su grupo'
);
select is(
	(select count(*) from public.materials where title = 'Material de A'),
	0::bigint,
	'4. Miembro de B no ve el material del grupo A'
);

-- 5. Sin grupo no se ve nada.
set local request.jwt.claim.sub = 'c1111111-1111-1111-1111-111111111111';
select is(
	(select count(*) from public.materials where title in ('Material de A', 'Material de B')),
	0::bigint,
	'5. Quien no es miembro no ve materiales de ningún grupo'
);

-- 6. A no inserta en B.
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
do $$
begin
	insert into public.materials (group_id, title, kind, author, created_by)
	values (
		(select id from public.groups where name = 'Grupo B'),
		'Intruso', 'book', 'X', 'a1111111-1111-1111-1111-111111111111'
	);
	raise exception 'insert should have been blocked';
exception
	when others then
		null;
end $$;
select is(
	(select count(*) from public.materials where title = 'Intruso'),
	0::bigint,
	'6. Miembro de A no inserta materiales en el grupo B'
);

-- 7. Sin grupo no se inserta en A.
set local request.jwt.claim.sub = 'c1111111-1111-1111-1111-111111111111';
do $$
begin
	insert into public.materials (group_id, title, kind, author, created_by)
	values (
		(select id from public.groups where name = 'Grupo A'),
		'Intruso 2', 'book', 'X', 'c1111111-1111-1111-1111-111111111111'
	);
	raise exception 'insert should have been blocked';
exception
	when others then
		null;
end $$;
select ok(
	(select count(*) from public.materials where title = 'Intruso 2') = 0,
	'7. Quien no es miembro no inserta en ningún grupo'
);

-- 8. Sesiones scopeadas por grupo.
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';
select is(
	(select count(*) from public.sessions where id = 'e0000000-0000-0000-0000-000000000001'),
	1::bigint,
	'8. Miembro de A lee su sesión'
);
select is(
	(select count(*) from public.sessions where id = 'e0000000-0000-0000-0000-000000000002'),
	0::bigint,
	'9. Miembro de A no ve la sesión del grupo B'
);

-- 10. UPDATE cruzado no toca nada (RLS deja 0 filas; se verifica como superusuario).
update public.sessions set range = 'Hackeado'
where id = 'e0000000-0000-0000-0000-000000000002';
reset role;
select is(
	(select range from public.sessions where id = 'e0000000-0000-0000-0000-000000000002'),
	'Cap. 1',
	'10. UPDATE cruzado no modifica la sesión del otro grupo'
);
set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';

-- 11. Categorías por grupo (la siembra de create_group las copió).
select ok(
	(select count(*) from public.categories
	 where group_id = (select id from public.groups where name = 'Grupo A')) > 0,
	'11. Miembro de A lee las categorías de su grupo'
);
select is(
	(select count(*) from public.categories
	 where group_id = (select id from public.groups where name = 'Grupo B')),
	0::bigint,
	'12. Miembro de A no ve las categorías del grupo B'
);

-- 13. Puente cruzado bloqueado por el trigger misma-grupo (como
-- superusuario, para que RLS no oculte las filas y el trigger decida).
reset role;
do $$
declare
	v_mat uuid := 'd0000000-0000-0000-0000-000000000001';
	v_cat_b uuid;
begin
	select id into v_cat_b from public.categories
	where group_id = (select id from public.groups where name = 'Grupo B') limit 1;
	insert into public.material_categories (material_id, category_id, group_id)
	values (v_mat, v_cat_b, (select id from public.groups where name = 'Grupo A'));
	raise exception 'bridge should have been blocked';
exception
	when others then
		null;
end $$;
select ok(
	(select count(*) from public.material_categories
	 where material_id = 'd0000000-0000-0000-0000-000000000001') = 0,
	'13. El puente no mezcla material de A con categoría de B'
);
set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-1111-1111-111111111111';

-- 14. Temporada abierta por grupo.
select is(
	(select count(*) from public.seasons
	 where group_id = (select id from public.groups where name = 'Grupo A')
	 and status = 'open'),
	1::bigint,
	'14. Miembro de A lee la temporada abierta de su grupo'
);
select is(
	(select count(*) from public.seasons
	 where group_id = (select id from public.groups where name = 'Grupo B')),
	0::bigint,
	'15. Miembro de A no ve las temporadas del grupo B'
);

-- 16. Convocatoria dentro del grupo (moderador A llama a A2).
select ok(
	(select public.convocar(
		'e0000000-0000-0000-0000-000000000001',
		'a2222222-2222-2222-2222-222222222222'
	)) is not null,
	'16. El moderador convoca a un miembro de su grupo'
);

-- 17. Convocar a quien no es del grupo falla.
do $$
begin
	perform public.convocar(
		'e0000000-0000-0000-0000-000000000001',
		'b1111111-1111-1111-1111-111111111111'
	);
	raise exception 'convocar should have been blocked';
exception
	when others then
		null;
end $$;
select ok(true, '17. No se convoca a quien no es del grupo');

-- 18. El otro grupo no ve la convocatoria (ni siquiera el roster cruzado).
set local request.jwt.claim.sub = 'b1111111-1111-1111-1111-111111111111';
select is(
	(select count(*) from public.convocatorias),
	0::bigint,
	'18. Miembro de B no ve convocatorias del grupo A'
);

-- 19. Anon ya no lee materials ni sessions.
reset request.jwt.claim.sub;
set local role anon;
select is((select count(*) from public.materials), 0::bigint, '19. Anon no lee materials');
select is((select count(*) from public.sessions), 0::bigint, '20. Anon no lee sessions');

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
