-- pgTAP tests for ticket #36: session optional material, kill cascade.
-- UUIDs prefixed 36000000- to avoid collisions with shared local DB.

begin;
select plan(19);

-- ============================================================
-- Fixtures
-- ============================================================

insert into auth.users (id, email) values
	('36000000-0000-0000-0000-000000000001', 'mod36@club.test'),
	('36000000-0000-0000-0000-000000000002', 'member36@club.test');

insert into public.members (id, status, display_name) values
	('36000000-0000-0000-0000-000000000001', 'active', 'Mod36'),
	('36000000-0000-0000-0000-000000000002', 'active', 'Member36');

insert into public.materials (id, title, kind, author, created_by) values
	('36000000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Material para borrar', 'book', 'Autor', '36000000-0000-0000-0000-000000000001'),
	('36000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Material existente', 'article', 'Otro', '36000000-0000-0000-0000-000000000001');

-- Session with material (for delete cascade test)
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('36000000-0000-0000-0000-000000000010', '36000000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Caps 1-3', 'lobby', '36000000-0000-0000-0000-000000000001');

-- Question on that session (for cascade test)
insert into public.questions (id, session_id, material_id, author_id, text) values
	('36000000-0000-0000-0000-000000000020', '36000000-0000-0000-0000-000000000010', '36000000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '36000000-0000-0000-0000-000000000002', '¿Pregunta?');

-- Session with material for attach/detach tests (no draws yet)
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('36000000-0000-0000-0000-000000000030', '36000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Caps 4-5', 'lobby', '36000000-0000-0000-0000-000000000001');

-- Session with a revealed draw (blocks attach/detach after sorteo)
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('36000000-0000-0000-0000-000000000040', '36000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Caps 6-7', 'in_progress', '36000000-0000-0000-0000-000000000001');
insert into public.draws (id, session_id, status) values
	('36000000-0000-0000-0000-000000000041', '36000000-0000-0000-0000-000000000040', 'revealed');

-- Session with material for start_trivia_round / open_session_rating tests
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('36000000-0000-0000-0000-000000000050', null, null, 'in_progress', '36000000-0000-0000-0000-000000000001');

-- Session with material for close_session bug fix test (in_progress, no draws/trivias/takes)
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('36000000-0000-0000-0000-000000000060', null, null, 'in_progress', '36000000-0000-0000-0000-000000000001');

-- ============================================================
-- Tests
-- ============================================================

-- 1. Insert session without material_id (via create_session RPC)
set local role authenticated;
set local request.jwt.claim.sub = '36000000-0000-0000-0000-000000000001';

create temp table t36 (k text primary key, id uuid);

select lives_ok(
	$$ insert into t36 values ('bare', public.create_session()) $$,
	'1. create_session sin material ni rango'
);

set local role postgres;

select is(
	(select material_id from public.sessions where id = (select id from t36 where k = 'bare')),
	null,
	'1b. Session creada sin material_id es null'
);

-- 2. Delete material → session remains, material_id null, question remains
delete from public.materials where id = '36000000-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
	(select material_id from public.sessions where id = '36000000-0000-0000-0000-000000000010'),
	null,
	'2. Tras borrar material, session.material_id es null (SET NULL)'
);

select is(
	(select count(*)::int from public.questions where session_id = '36000000-0000-0000-0000-000000000010'),
	1,
	'2b. La pregunta sobrevive al borrado del material'
);

select is(
	(select material_id from public.questions where id = '36000000-0000-0000-0000-000000000020'),
	null,
	'2c. questions.material_id es null tras borrar material'
);

-- 3. create_session now → lobby + moderator
set local role authenticated;
set local request.jwt.claim.sub = '36000000-0000-0000-0000-000000000001';

insert into t36 values ('now', public.create_session());

set local role postgres;

select is(
	(select status from public.sessions where id = (select id from t36 where k = 'now')),
	'lobby'::public.session_status,
	'3. create_session sin scheduled_at → lobby'
);

select is(
	(select moderator_id from public.sessions where id = (select id from t36 where k = 'now')),
	'36000000-0000-0000-0000-000000000001'::uuid,
	'3b. create_session sin scheduled_at → moderator = auth.uid()'
);

-- 4. create_session future scheduled_at → preparation, no moderator
set local role authenticated;
set local request.jwt.claim.sub = '36000000-0000-0000-0000-000000000001';

insert into t36 values ('future', public.create_session(null, null, '2099-01-01 10:00:00+00'));

set local role postgres;

select is(
	(select status from public.sessions where id = (select id from t36 where k = 'future')),
	'preparation'::public.session_status,
	'4. create_session con scheduled_at futuro → preparation'
);

select is(
	(select moderator_id from public.sessions where id = (select id from t36 where k = 'future')),
	null,
	'4b. create_session con scheduled_at futuro → moderator null'
);

-- 5. attach_material / detach_material before sorteo works
select lives_ok(
	$$ select public.attach_material('36000000-0000-0000-0000-000000000030', '36000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Nuevo rango') $$,
	'5. attach_material antes del sorteo funciona'
);

select lives_ok(
	$$ select public.detach_material('36000000-0000-0000-0000-000000000030') $$,
	'5b. detach_material antes del sorteo funciona'
);

-- 6. attach/detach after non-pending draw fails
select throws_ok(
	$$ select public.attach_material('36000000-0000-0000-0000-000000000040', '36000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Rango') $$,
	'No se puede cambiar el material después del Sorteo',
	'6. attach_material después del sorteo falla'
);

select throws_ok(
	$$ select public.detach_material('36000000-0000-0000-0000-000000000040') $$,
	'No se puede quitar el material después del Sorteo',
	'6b. detach_material después del sorteo falla'
);

-- 7. create_session with existing material_id sets it
set local role authenticated;
set local request.jwt.claim.sub = '36000000-0000-0000-0000-000000000001';

insert into t36 values ('with_mat', public.create_session('36000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Caps 1-2'));

set local role postgres;

select is(
	(select material_id from public.sessions where id = (select id from t36 where k = 'with_mat')),
	'36000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
	'7. create_session con material_id lo establece'
);

-- 8. insert question without material (as authenticated member)
-- First create a session without material for this test
set local role postgres;
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('36000000-0000-0000-0000-000000000070', null, null, 'lobby', '36000000-0000-0000-0000-000000000001');

set local role authenticated;
set local request.jwt.claim.sub = '36000000-0000-0000-0000-000000000002';

select lives_ok(
	$$ insert into public.questions (session_id, material_id, author_id, text) values ('36000000-0000-0000-0000-000000000070', null, '36000000-0000-0000-0000-000000000002', '¿Sin material?') $$,
	'8. insert question sin material como miembro autenticado'
);

-- 9. start_trivia_round without material throws domain error
set local role authenticated;
set local request.jwt.claim.sub = '36000000-0000-0000-0000-000000000001';

select throws_ok(
	$$ select public.start_trivia_round('36000000-0000-0000-0000-000000000050', '36000000-0000-0000-0000-000000000001') $$,
	'La sesión no tiene material para Trivia',
	'9. start_trivia_round sin material lanza error de dominio'
);

-- 10. open_session_rating without material throws domain error
select throws_ok(
	$$ select public.open_session_rating('36000000-0000-0000-0000-000000000050') $$,
	'La sesión no tiene material para Rating',
	'10. open_session_rating sin material lanza error de dominio'
);

-- 11. close_session without material works (bug fix)
select lives_ok(
	$$ select public.close_session('36000000-0000-0000-0000-000000000060') $$,
	'11. close_session sin material funciona (bug fix)'
);

select is(
	(select status from public.sessions where id = '36000000-0000-0000-0000-000000000060'),
	'closed'::public.session_status,
	'11b. Sesión sin material queda closed tras close_session'
);

select * from finish();
rollback;
