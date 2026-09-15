-- RLS/RPC tests para rol Espectador (ticket #27, SPEC §2.6-2.7 · ADR 0001).
-- Seam: RPC `set_spectator` (agregar/quitar Espectador en lobby),
-- `execute_draw` (excluye espectadores), conteos de Listos y elegibilidad.

begin;
select plan(16);

-- ============================================================
-- Fixtures: membresía + material + sesión en lobby
-- ============================================================

insert into auth.users (id, email) values
	('11111111-1111-1111-1111-111111111111', 'moderador@club.test'),
	('22222222-2222-2222-2222-222222222222', 'miembro1@club.test'),
	('33333333-3333-3333-3333-333333333333', 'miembro2@club.test'),
	('44444444-4444-4444-4444-444444444444', 'espectador@club.test'),
	('55555555-5555-5555-5555-555555555555', 'invitado@club.test');

insert into public.members (id, status, display_name) values
	('11111111-1111-1111-1111-111111111111', 'active', 'Moderador'),
	('22222222-2222-2222-2222-222222222222', 'active', 'Miembro1'),
	('33333333-3333-3333-3333-333333333333', 'active', 'Miembro2'),
	('44444444-4444-4444-4444-444444444444', 'active', 'Espectador'),
	('55555555-5555-5555-5555-555555555555', 'invited', 'Invitado');

insert into public.materials (id, title, kind, author, created_by) values
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Libro de prueba', 'book', 'Alguien', '11111111-1111-1111-1111-111111111111');

-- Sesión en lobby con preguntas para el sorteo
insert into public.sessions (id, material_id, range, status, moderator_id) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Capítulos 1-3', 'lobby', '11111111-1111-1111-1111-111111111111');

-- Participantes existentes (sin role explícito = member por defecto)
insert into public.session_participants (session_id, member_id) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333');

-- Preguntas para el sorteo
insert into public.questions (id, session_id, material_id, author_id, text) values
	('a1000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Pregunta de Miembro1'),
	('a1000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Pregunta de Miembro2');

-- ============================================================
-- Tests
-- ============================================================

-- 1. El moderador agrega un Espectador al lobby.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', true) $$,
	'1. El moderador agrega un Espectador al lobby'
);

select is(
	(select role from public.session_participants
	 where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	   and member_id = '44444444-4444-4444-4444-444444444444'),
	'spectator'::public.participant_role,
	'1b. El participante tiene rol spectator'
);

-- 2. Un Espectador cuenta en presentes (existe en session_participants).
select is(
	(select count(*)::int from public.session_participants
	 where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
	3,
	'2. El Espectador cuenta en presentes (3 participantes)'
);

-- 3. Un Espectador NO incrementa el denominador de Listos (solo members con opt_out=false).
--    Simulamos conteo de "Listos": members presentes sin opt_out.
select is(
	(select count(*)::int from public.session_participants
	 where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	   and role = 'member'
	   and not opt_out),
	2,
	'3. Solo 2 members cuentan para Listos (Espectador excluido)'
);

-- 4. Un no-moderador no puede agregar Espectadores.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select throws_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', true) $$,
	'Solo el Moderador puede gestionar Espectadores en el lobby',
	'4. Un no-moderador no puede agregar Espectadores'
);

-- 5. Un invitado no puede agregar Espectadores.
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

select throws_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', true) $$,
	'Solo el Moderador puede gestionar Espectadores en el lobby',
	'5. Un invitado no puede agregar Espectadores'
);

-- 6. El moderador puede quitar un Espectador.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', false) $$,
	'6. El moderador quita un Espectador'
);

select is(
	(select count(*)::int from public.session_participants
	 where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	   and member_id = '44444444-4444-4444-4444-444444444444'),
	0,
	'6b. El Espectador fue removido'
);

-- 7. Quitar un spectator que no existe no falla (no-op).
select lives_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', false) $$,
	'7. Quitar un espectador que no existe no falla'
);

-- 8. Agregar espectador que ya es member lo convierte a spectator.
--    Primero re-agregamos al espectador.
select lives_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', true) $$,
	'8. Re-agregar espectador'
);

select is(
	(select role from public.session_participants
	 where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	   and member_id = '44444444-4444-4444-4444-444444444444'),
	'spectator'::public.participant_role,
	'8b. El participante tiene rol spectator tras re-agregar'
);

-- 9. Quitar un member normal (no spectator) no lo elimina.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', false) $$,
	'9. Intentar quitar un member normal (no spectator) no falla'
);

select is(
	(select count(*)::int from public.session_participants
	 where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	   and member_id = '22222222-2222-2222-2222-222222222222'),
	1,
	'9b. El member normal sigue presente'
);

-- 10. execute_draw nunca asigna Preguntas a Espectadores.
--     Agregamos un segundo espectador y ejecutamos el sorteo.
select lives_ok(
	$$ select public.set_spectator('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', true) $$,
	'10. Agregar segundo espectador para test de sorteo'
);

update public.sessions
set room_stage = 'draw'
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select lives_ok(
	$$ select public.execute_draw('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
	'10b. El sorteo se ejecuta'
);

select is(
	(select count(*)::int from public.assignments
	 where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	   and assignee_id in ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333')),
	0,
	'10c. Ningún Espectador recibió asignación en el Sorteo'
);

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
