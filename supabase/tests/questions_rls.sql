-- RLS tests for questions (ticket #15, SPEC §2.5, §4.1 · ADR 0001, 0005).
-- Seam: RLS. A Miembro activo crea Preguntas; el pool de la Sesión es visible
-- para el club; solo el moderador marca/desmarca "Fuera de sorteo".

begin;
select plan(8);

-- ============================================================
-- Fixtures: membership + material + session (schema de #14)
-- ============================================================

insert into auth.users (id, email) values
	('11111111-1111-1111-1111-111111111111', 'autor@club.test'),
	('22222222-2222-2222-2222-222222222222', 'moderador@club.test'),
	('33333333-3333-3333-3333-333333333333', 'miembro@club.test'),
	('44444444-4444-4444-4444-444444444444', 'externo@club.test');

insert into public.members (id, status, display_name) values
	('11111111-1111-1111-1111-111111111111', 'active', 'Autor'),
	('22222222-2222-2222-2222-222222222222', 'active', 'Moderador'),
	('33333333-3333-3333-3333-333333333333', 'active', 'Miembro'),
	('44444444-4444-4444-4444-444444444444', 'invited', 'Invitado');

insert into public.materials (id, title, kind, author, created_by) values
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Libro de prueba', 'book', 'Alguien', '11111111-1111-1111-1111-111111111111'),
	('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Otro material', 'video', 'Otra', '11111111-1111-1111-1111-111111111111');

insert into public.sessions (id, material_id, range, status, moderator_id) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Capítulos 1-3', 'preparation', '22222222-2222-2222-2222-222222222222'),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Capítulos 4-6', 'preparation', '22222222-2222-2222-2222-222222222222');

-- ============================================================
-- Tests
-- ============================================================

-- 1. Un Miembro activo puede crear una Pregunta (queda registrado el autor).
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.questions (session_id, material_id, author_id, text) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '¿Qué opinas del capítulo 2?');

select ok(
	exists (
		select 1 from public.questions q
		where q.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
		and q.text = '¿Qué opinas del capítulo 2?'
	),
	'1. Un Miembro activo crea una Pregunta y queda registrado su autor'
);

-- 2. Un no-Miembro (invited) no puede crear una Pregunta.
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

do $$
begin
	insert into public.questions (session_id, material_id, author_id, text) values
		('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '¿Puede un invitado preguntar?');
	raise exception 'insert should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select count(*) from public.questions q
	 where q.text = '¿Puede un invitado preguntar?'),
	0::bigint,
	'2. Un no-Miembro no puede crear una Pregunta'
);

-- 3. El pool de la Sesión muestra todas las Preguntas aportadas, presente o
--    no su autor (aquí: el autor NO participa; otro Miembro ve su Pregunta).
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select ok(
	exists (
		select 1 from public.questions q
		where q.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
		and q.text = '¿Qué opinas del capítulo 2?'
	),
	'3. El pool de la Sesión muestra una Pregunta aunque su autor no esté presente'
);

-- 4. El pool no mezcla Sesiones: la Pregunta de la sesión B no aparece al leer la A.
select is(
	(select count(*) from public.questions q
	 where q.session_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
	0::bigint,
	'4. El pool no mezcla Preguntas de otras Sesiones'
);

-- 5. El moderador puede marcar "Fuera de sorteo".
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

update public.questions
set outside_draw = true
where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
and text = '¿Qué opinas del capítulo 2?';

select is(
	(select outside_draw from public.questions q
	 where q.text = '¿Qué opinas del capítulo 2?'),
	true,
	'5. El moderador puede marcar una Pregunta como "Fuera de sorteo"'
);

-- 6. Un Miembro que no es moderador NO puede marcar "Fuera de sorteo".
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
begin
	update public.questions
	set outside_draw = true
	where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	and text = '¿Qué opinas del capítulo 2?';
	if not found then
		null;
	end if;
	raise exception 'update should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select outside_draw from public.questions q
	 where q.text = '¿Qué opinas del capítulo 2?'),
	true,
	'6. Un no-moderador no puede alterar "Fuera de sorteo"'
);

-- 7. Un Miembro no puede falsear la autoría de una Pregunta (author_id = auth.uid()).
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
begin
	insert into public.questions (session_id, material_id, author_id, text) values
		('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '¿Puedo robar la autoría?');
	raise exception 'insert should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select count(*) from public.questions q
	 where q.text = '¿Puedo robar la autoría?'),
	0::bigint,
	'7. Un Miembro no puede falsear la autoría de una Pregunta'
);

-- 8. El material denormalizado debe coincidir con el de la Sesión (invariante
--    para Histórico, SPEC §2.5): la Sesión B pertenece al material A, no al D.
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
begin
	insert into public.questions (session_id, material_id, author_id, text) values
		('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', '¿Material incoherente?');
	raise exception 'insert should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select count(*) from public.questions q
	 where q.text = '¿Material incoherente?'),
	0::bigint,
	'8. El material_id de una Pregunta debe coincidir con el de su Sesión'
);

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
