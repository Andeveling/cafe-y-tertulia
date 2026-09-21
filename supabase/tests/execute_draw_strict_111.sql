-- Sorteo estricto 1:1 (incidente 2026-09-21 · ADR-0008).
-- Seam: RPC execute_draw.
-- Regresión: con N personas y N preguntas (una por autor) el sorteo anterior
-- duplicaba preguntas (`< 2`) y dejaba otras sin entrar. Ahora: 1 pregunta
-- × 1 respondedor, sin auto-asignación, una sola pregunta por autor aunque
-- aporte varias, y nada de espectadores/ausentes en el pool.

begin;
select plan(12);

insert into auth.users (id, email) values
	('f1000000-0000-0000-0000-000000000001', 'mod-111@club.test'),
	('f1000000-0000-0000-0000-000000000002', 'a-111@club.test'),
	('f1000000-0000-0000-0000-000000000003', 'b-111@club.test'),
	('f1000000-0000-0000-0000-000000000004', 'c-111@club.test'),
	('f1000000-0000-0000-0000-000000000005', 's-111@club.test');

insert into public.members (id, status, display_name) values
	('f1000000-0000-0000-0000-000000000001', 'active', 'Moderador'),
	('f1000000-0000-0000-0000-000000000002', 'active', 'A'),
	('f1000000-0000-0000-0000-000000000003', 'active', 'B'),
	('f1000000-0000-0000-0000-000000000004', 'active', 'C'),
	('f1000000-0000-0000-0000-000000000005', 'active', 'Espectador');

insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('f1000000-0000-0000-0000-0000000000a1', null, 'Cap. 1:1', 'lobby', 'f1000000-0000-0000-0000-000000000001', 'draw'),
	('f1000000-0000-0000-0000-0000000000a2', null, 'Cap. desparejo', 'lobby', 'f1000000-0000-0000-0000-000000000001', 'draw'),
	('f1000000-0000-0000-0000-0000000000a3', null, 'Cap. solitario', 'lobby', 'f1000000-0000-0000-0000-000000000001', 'draw');

insert into public.session_participants (session_id, member_id, role) values
	('f1000000-0000-0000-0000-0000000000a1', 'f1000000-0000-0000-0000-000000000001', 'member'),
	('f1000000-0000-0000-0000-0000000000a1', 'f1000000-0000-0000-0000-000000000002', 'member'),
	('f1000000-0000-0000-0000-0000000000a1', 'f1000000-0000-0000-0000-000000000003', 'member'),
	('f1000000-0000-0000-0000-0000000000a1', 'f1000000-0000-0000-0000-000000000004', 'member'),
	('f1000000-0000-0000-0000-0000000000a1', 'f1000000-0000-0000-0000-000000000005', 'spectator'),
	('f1000000-0000-0000-0000-0000000000a2', 'f1000000-0000-0000-0000-000000000001', 'member'),
	('f1000000-0000-0000-0000-0000000000a2', 'f1000000-0000-0000-0000-000000000002', 'member'),
	('f1000000-0000-0000-0000-0000000000a3', 'f1000000-0000-0000-0000-000000000001', 'member');

-- A aporta dos (solo una entra); el espectador aporta una (no entra).
insert into public.questions (id, session_id, material_id, author_id, text) values
	('f1000000-0000-0000-0000-000000000101', 'f1000000-0000-0000-0000-0000000000a1', null, 'f1000000-0000-0000-0000-000000000002', '¿A1?'),
	('f1000000-0000-0000-0000-000000000102', 'f1000000-0000-0000-0000-0000000000a1', null, 'f1000000-0000-0000-0000-000000000002', '¿A2?'),
	('f1000000-0000-0000-0000-000000000103', 'f1000000-0000-0000-0000-0000000000a1', null, 'f1000000-0000-0000-0000-000000000003', '¿B?'),
	('f1000000-0000-0000-0000-000000000104', 'f1000000-0000-0000-0000-0000000000a1', null, 'f1000000-0000-0000-0000-000000000004', '¿C?'),
	('f1000000-0000-0000-0000-000000000105', 'f1000000-0000-0000-0000-0000000000a1', null, 'f1000000-0000-0000-0000-000000000001', '¿M?'),
	('f1000000-0000-0000-0000-000000000106', 'f1000000-0000-0000-0000-0000000000a1', null, 'f1000000-0000-0000-0000-000000000005', '¿S?'),
	('f1000000-0000-0000-0000-000000000201', 'f1000000-0000-0000-0000-0000000000a2', null, 'f1000000-0000-0000-0000-000000000002', '¿A despareja?');

set local role authenticated;
set local request.jwt.claim.sub = 'f1000000-0000-0000-0000-000000000001';

select lives_ok(
	$$ select public.execute_draw('f1000000-0000-0000-0000-0000000000a1') $$,
	'1. El sorteo 1:1 ejecuta con 4 elegibles y pool de 4'
);

select is(
	(select count(*)::int from public.assignments where session_id = 'f1000000-0000-0000-0000-0000000000a1'),
	4,
	'2. Hay exactamente 4 asignaciones'
);

select is(
	(select count(distinct question_id)::int from public.assignments where session_id = 'f1000000-0000-0000-0000-0000000000a1'),
	4,
	'3. Cada pregunta entra como máximo una vez'
);

select is(
	(select count(distinct assignee_id)::int from public.assignments where session_id = 'f1000000-0000-0000-0000-0000000000a1'),
	4,
	'4. Cada elegible responde exactamente una'
);

-- Las preguntas ajenas siguen ocultas por RLS hasta revelar: estas
-- aserciones leen el pool con el rol de la sesión de test.
reset role;

select is(
	(select count(*)::int
		from public.assignments a
		join public.questions q on q.id = a.question_id
		where a.session_id = 'f1000000-0000-0000-0000-0000000000a1'
			and q.author_id = a.assignee_id),
	0,
	'5. Nadie responde la propia'
);

select is(
	(select count(*)::int from public.assignments where session_id = 'f1000000-0000-0000-0000-0000000000a1' and assignee_id = 'f1000000-0000-0000-0000-000000000005'),
	0,
	'6. El espectador no recibe asignación'
);

select is(
	(select count(*)::int from public.assignments where session_id = 'f1000000-0000-0000-0000-0000000000a1' and question_id = 'f1000000-0000-0000-0000-000000000106'),
	0,
	'7. La pregunta del espectador no entra'
);

select is(
	(select count(*)::int
		from public.assignments a
		join public.questions q on q.id = a.question_id
		where a.session_id = 'f1000000-0000-0000-0000-0000000000a1'
			and q.author_id = 'f1000000-0000-0000-0000-000000000002'),
	1,
	'8. De las dos preguntas de A entra una sola'
);

set local role authenticated;
set local request.jwt.claim.sub = 'f1000000-0000-0000-0000-000000000001';

select throws_ok(
	$$ select public.execute_draw('f1000000-0000-0000-0000-0000000000a1') $$,
	'P0001',
	'El Sorteo solo puede ejecutarse una vez',
	'9. El sorteo no se repite'
);

select throws_ok(
	$$ select public.execute_draw('f1000000-0000-0000-0000-0000000000a2') $$,
	'P0001',
	'El Sorteo 1:1 necesita una pregunta sorteable por participante: 2 participantes, 1 preguntas',
	'10. Desparejo (2 personas, 1 pregunta) falla en vez de corromper'
);

select throws_ok(
	$$ select public.execute_draw('f1000000-0000-0000-0000-0000000000a3') $$,
	'P0001',
	'Se necesitan al menos dos participantes en el Sorteo (hay 1)',
	'11. Con un solo participante no hay sorteo'
);

select is(
	(select count(*)::int from public.assignments where session_id in ('f1000000-0000-0000-0000-0000000000a2', 'f1000000-0000-0000-0000-0000000000a3')),
	0,
	'12. Los sorteos fallidos no dejan asignaciones'
);

select * from finish();
rollback;
