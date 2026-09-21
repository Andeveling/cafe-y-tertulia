-- Salir de Preguntas exige al menos dos miembros con pregunta.
-- Seam: RPC advance_room_stage.

begin;
select plan(4);

insert into auth.users (id, email) values
	('d1000000-0000-0000-0000-000000000001', 'mod-q@club.test'),
	('d1000000-0000-0000-0000-000000000002', 'a-q@club.test'),
	('d1000000-0000-0000-0000-000000000003', 'b-q@club.test');

insert into public.members (id, status, display_name) values
	('d1000000-0000-0000-0000-000000000001', 'active', 'Mod'),
	('d1000000-0000-0000-0000-000000000002', 'active', 'Ana'),
	('d1000000-0000-0000-0000-000000000003', 'active', 'Luis');

insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('d1000000-0000-0000-0000-0000000000a1', null, 'Vacía', 'lobby', 'd1000000-0000-0000-0000-000000000001', 'questions'),
	('d1000000-0000-0000-0000-0000000000a2', null, 'Una', 'lobby', 'd1000000-0000-0000-0000-000000000001', 'questions'),
	('d1000000-0000-0000-0000-0000000000a3', null, 'Dos', 'lobby', 'd1000000-0000-0000-0000-000000000001', 'questions');

insert into public.session_participants (session_id, member_id, role) values
	('d1000000-0000-0000-0000-0000000000a2', 'd1000000-0000-0000-0000-000000000002', 'member'),
	('d1000000-0000-0000-0000-0000000000a2', 'd1000000-0000-0000-0000-000000000003', 'member'),
	('d1000000-0000-0000-0000-0000000000a3', 'd1000000-0000-0000-0000-000000000002', 'member'),
	('d1000000-0000-0000-0000-0000000000a3', 'd1000000-0000-0000-0000-000000000003', 'member');

insert into public.questions (session_id, material_id, author_id, text) values
	('d1000000-0000-0000-0000-0000000000a2', null, 'd1000000-0000-0000-0000-000000000002', '¿Solo una?'),
	('d1000000-0000-0000-0000-0000000000a2', null, 'd1000000-0000-0000-0000-000000000002', '¿Otra del mismo?'),
	('d1000000-0000-0000-0000-0000000000a3', null, 'd1000000-0000-0000-0000-000000000002', '¿Ana?'),
	('d1000000-0000-0000-0000-0000000000a3', null, 'd1000000-0000-0000-0000-000000000003', '¿Luis?');

set local role authenticated;
set local request.jwt.claim.sub = 'd1000000-0000-0000-0000-000000000001';

select throws_ok(
	$$select public.advance_room_stage('d1000000-0000-0000-0000-0000000000a1', 'presence')$$,
	'P0001',
	'Se necesitan al menos dos participantes con pregunta para avanzar',
	'1. Mesa vacía no avanza a Presentes'
);

select throws_ok(
	$$select public.advance_room_stage('d1000000-0000-0000-0000-0000000000a2', 'presence')$$,
	'P0001',
	'Se necesitan al menos dos participantes con pregunta para avanzar',
	'2. Dos preguntas del mismo autor no alcanzan'
);

select lives_ok(
	$$select public.advance_room_stage('d1000000-0000-0000-0000-0000000000a3', 'presence')$$,
	'3. Dos miembros con pregunta sí avanzan'
);

select is(
	(select room_stage from public.sessions where id = 'd1000000-0000-0000-0000-0000000000a3'),
	'presence'::public.room_stage,
	'4. La Sala queda en Presentes'
);

select * from finish();
rollback;
