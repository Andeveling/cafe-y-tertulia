-- Tests para sistema de niveles (Ticket #34)
-- Seam: compute_member_level(), session_attended counts, season_id auto-assign.

begin;
select plan(14);

-- ============================================================
-- Fixtures: membresía + material + sesión
-- ============================================================

insert into auth.users (id, email) values
	('11111111-1111-1111-1111-111111111111', 'moderador@club.test'),
	('22222222-2222-2222-2222-222222222222', 'miembro1@club.test'),
	('33333333-3333-3333-3333-333333333333', 'miembro2@club.test'),
	('44444444-4444-4444-4444-444444444444', 'espectador@club.test');

insert into public.members (id, status, display_name) values
	('11111111-1111-1111-1111-111111111111', 'active', 'Moderador'),
	('22222222-2222-2222-2222-222222222222', 'active', 'Miembro1'),
	('33333333-3333-3333-3333-333333333333', 'active', 'Miembro2'),
	('44444444-4444-4444-4444-444444444444', 'active', 'Espectador');

insert into public.materials (id, title, kind, author, created_by) values
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Libro de prueba', 'book', 'Alguien', '11111111-1111-1111-1111-111111111111');

-- ============================================================
-- 1. season_id se asigna automáticamente al crear sesión
-- ============================================================

insert into public.sessions (id, material_id, range, status, moderator_id) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cap 1-3', 'preparation', '11111111-1111-1111-1111-111111111111');

select isnt(
	(select season_id from public.sessions where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
	null,
	'1. season_id se asigna automáticamente al crear sesión'
);

-- ============================================================
-- 2. compute_member_level con 0 sesiones → LVL 0
-- ============================================================

select is(
	(select (compute_member_level('22222222-2222-2222-2222-222222222222')->>'level')::int),
	0,
	'2. Miembro sin sesiones → LVL 0'
);

-- ============================================================
-- Setup: sesión en in_progress con participantes
-- ============================================================

update public.sessions set status = 'lobby' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

insert into public.session_participants (session_id, member_id, role) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'member'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'member'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'member'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'spectator');

-- Sorteo necesario para avanzar a in_progress (1:1: el moderador también
-- juega con pregunta propia para igualar 3 elegibles con 3 sorteables).
insert into public.questions (id, session_id, material_id, author_id, text) values
	('a1000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Pregunta 1'),
	('a1000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Pregunta 2'),
	('a1000000-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Pregunta del moderador');

update public.sessions
set room_stage = 'draw'
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select public.execute_draw('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

update public.sessions set status = 'in_progress' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

reset role;
reset request.jwt.claim.sub;

-- ============================================================
-- 3. Cerrar sesión registra session_attended para todos los participantes
-- ============================================================

-- El sorteo debe estar revelado para cerrar
update public.draws set status = 'revealed'
where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
	$$ select public.close_session('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
	'3. El moderador cierra la sesión'
);

-- Verificar que los 3 members + 1 espectador tienen session_attended = 1
select is(
	(select value from public.counts
	 where member_id = '22222222-2222-2222-2222-222222222222'
	   and event = 'session_attended'),
	1,
	'3b. Miembro1 tiene session_attended = 1'
);

select is(
	(select value from public.counts
	 where member_id = '44444444-4444-4444-4444-444444444444'
	   and event = 'session_attended'),
	1,
	'3c. Espectador tiene session_attended = 1 (cuenta como asistencia)'
);

-- ============================================================
-- 4. compute_member_level con 1 sesión → LVL 1 (Novato)
-- ============================================================

select is(
	(select (compute_member_level('22222222-2222-2222-2222-222222222222')->>'level')::int),
	1,
	'4. Miembro con 1 sesión → LVL 1'
);

select is(
	(select compute_member_level('22222222-2222-2222-2222-222222222222')->>'title'),
	'Novato',
	'4b. Título = Novato'
);

-- ============================================================
-- 5. compute_member_level con 0 sesiones sigue en LVL 0
-- ============================================================

reset role;
reset request.jwt.claim.sub;

-- Miembro que no participó
insert into auth.users (id, email) values
	('66666666-6666-6666-6666-666666666666', 'nuevo@club.test');
insert into public.members (id, status, display_name) values
	('66666666-6666-6666-6666-666666666666', 'active', 'Nuevo');

select is(
	(select (compute_member_level('66666666-6666-6666-6666-666666666666')->>'level')::int),
	0,
	'5. Miembro nuevo sin sesiones → LVL 0'
);

-- ============================================================
-- 6. compute_member_level JSON tiene todos los campos
-- ============================================================

select is(
	(select compute_member_level('22222222-2222-2222-2222-222222222222') ? 'sessions_attended'),
	true,
	'6. JSON incluye sessions_attended'
);

select is(
	(select compute_member_level('22222222-2222-2222-2222-222222222222') ? 'next_threshold'),
	true,
	'6b. JSON incluye next_threshold'
);

select is(
	(select compute_member_level('22222222-2222-2222-2222-222222222222') ? 'insignias_count'),
	true,
	'6c. JSON incluye insignias_count'
);

-- ============================================================
-- 7. Segunda sesión incrementa el conteo
-- ============================================================

-- Crear segunda sesión y cerrarla
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cap 4-6', 'in_progress', '11111111-1111-1111-1111-111111111111');

insert into public.session_participants (session_id, member_id, role) values
	('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'member'),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'member');

-- Sorteo para la segunda sesión
insert into public.questions (id, session_id, material_id, author_id, text) values
	('a2000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Pregunta 3');

insert into public.draws (session_id, status) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'revealed');
insert into public.assignments (session_id, question_id, assignee_id, reveal_order, draw_id, state)
	select 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 1, d.id, 'complete'
	from public.draws d where d.session_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
	$$ select public.close_session('cccccccc-cccc-cccc-cccc-cccccccccccc') $$,
	'7. Segunda sesión cerrada'
);

reset role;
reset request.jwt.claim.sub;

select is(
	(select value from public.counts
	 where member_id = '22222222-2222-2222-2222-222222222222'
	   and event = 'session_attended'),
	2,
	'7b. Miembro1 tiene session_attended = 2'
);

-- 7c. Ambas sesiones usan la misma temporada
select is(
	(select season_id from public.sessions where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
	(select season_id from public.sessions where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
	'7c. Ambas sesiones comparten la misma temporada'
);

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
