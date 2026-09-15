-- execute_draw autoriza por Moderador + etapa Sorteo, no por status=lobby.
-- Si la Sala ya pasó por Debate (in_progress) y volvió al Sorteo, el
-- Moderador ve el botón y el RPC no puede mentir con "solo el Moderador".
-- Seam: RPC execute_draw.

begin;
select plan(3);

insert into auth.users (id, email) values
	('e8000000-0000-0000-0000-000000000001', 'mod-draw@club.test'),
	('e8000000-0000-0000-0000-000000000002', 'miembro-draw@club.test');

insert into public.members (id, status, display_name) values
	('e8000000-0000-0000-0000-000000000001', 'active', 'Moderador'),
	('e8000000-0000-0000-0000-000000000002', 'active', 'Miembro');

insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('e8000000-0000-0000-0000-0000000000a1', null, 'Cap. draw', 'in_progress', 'e8000000-0000-0000-0000-000000000001', 'draw'),
	('e8000000-0000-0000-0000-0000000000a2', null, 'Cap. presence', 'lobby', 'e8000000-0000-0000-0000-000000000001', 'presence');

insert into public.session_participants (session_id, member_id, role) values
	('e8000000-0000-0000-0000-0000000000a1', 'e8000000-0000-0000-0000-000000000001', 'member'),
	('e8000000-0000-0000-0000-0000000000a1', 'e8000000-0000-0000-0000-000000000002', 'member'),
	('e8000000-0000-0000-0000-0000000000a2', 'e8000000-0000-0000-0000-000000000002', 'member');

insert into public.questions (session_id, material_id, author_id, text) values
	('e8000000-0000-0000-0000-0000000000a1', null, 'e8000000-0000-0000-0000-000000000002', '¿Pregunta del miembro?'),
	('e8000000-0000-0000-0000-0000000000a1', null, 'e8000000-0000-0000-0000-000000000001', '¿Pregunta del moderador?'),
	('e8000000-0000-0000-0000-0000000000a2', null, 'e8000000-0000-0000-0000-000000000002', '¿Aún en Presentes?');

set local role authenticated;
set local request.jwt.claim.sub = 'e8000000-0000-0000-0000-000000000001';

select lives_ok(
	$$ select public.execute_draw('e8000000-0000-0000-0000-0000000000a1') $$,
	'1. El Moderador sortea en etapa Sorteo aunque el status sea in_progress'
);

select throws_ok(
	$$ select public.execute_draw('e8000000-0000-0000-0000-0000000000a2') $$,
	'P0001',
	'El Sorteo se ejecuta en la etapa Sorteo',
	'2. El Moderador no sortea fuera de la etapa Sorteo'
);

reset role;
reset request.jwt.claim.sub;
set local role authenticated;
set local request.jwt.claim.sub = 'e8000000-0000-0000-0000-000000000002';

select throws_ok(
	$$ select public.execute_draw('e8000000-0000-0000-0000-0000000000a1') $$,
	'P0001',
	'Solo el Moderador puede ejecutar el Sorteo',
	'3. Un Participante no sortea aunque la etapa sea Sorteo'
);

select * from finish();
rollback;
