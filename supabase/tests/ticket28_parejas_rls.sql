-- RLS tests for ticket #28: parejas visibles, texto oculto hasta turno.
-- Seam: RLS. Tras el Sorteo, todo Participante ve las parejas (assignments).
-- El texto de una Pregunta solo es legible por su autor hasta que se revela.

begin;
select plan(10);

-- ============================================================
-- Fixtures: membership + material + session + questions
-- ============================================================

insert into auth.users (id, email) values
	('11111111-1111-1111-1111-111111111111', 'autor@club.test'),
	('22222222-2222-2222-2222-222222222222', 'moderador@club.test'),
	('33333333-3333-3333-3333-333333333333', 'asignado@club.test'),
	('44444444-4444-4444-4444-444444444444', 'externo@club.test');

insert into public.members (id, status, display_name) values
	('11111111-1111-1111-1111-111111111111', 'active', 'Autor'),
	('22222222-2222-2222-2222-222222222222', 'active', 'Moderador'),
	('33333333-3333-3333-3333-333333333333', 'active', 'Asignado'),
	('44444444-4444-4444-4444-444444444444', 'invited', 'Invitado');

insert into public.materials (id, title, kind, author, created_by) values
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Libro de prueba', 'book', 'Alguien', '11111111-1111-1111-1111-111111111111');

insert into public.sessions (id, material_id, range, status, moderator_id) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Capítulos 1-3', 'lobby', '22222222-2222-2222-2222-222222222222');

-- Participantes: Autor (también participa), Moderador, Asignado
insert into public.session_participants (session_id, member_id) values
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333');

-- Pregunta del Autor (texto: '¿Qué opinas del capítulo 2?')
insert into public.questions (id, session_id, material_id, author_id, text) values
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '¿Qué opinas del capítulo 2?');

-- ============================================================
-- Pre-draw: el pool es abierto, todos ven la Pregunta con texto
-- ============================================================

-- 1. Un Miembro (no autor) ve la Pregunta y su texto antes del Sorteo.
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select ok(
	exists (
		select 1 from public.questions q
		where q.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
		and q.text = '¿Qué opinas del capítulo 2?'
	),
	'1. Antes del Sorteo: un Miembro ve la Pregunta con texto completo'
);

-- ============================================================
-- Ejecutar el Sorteo (como Moderador)
-- ============================================================

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- El sorteo crea assignments; aquí simulamos uno directamente para tener
-- control del estado.
select public.execute_draw('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- ============================================================
-- Post-draw, assignment hidden: parejas visibles, texto oculto
-- ============================================================

-- 2. Un Participante (no autor) ve las asignaciones tras el Sorteo.
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select ok(
	exists (
		select 1 from public.assignments a
		where a.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
	),
	'2. Tras el Sorteo: un Participante ve las asignaciones (parejas visibles)'
);

-- 3. Un no-Miembro NO ve las asignaciones.
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is(
	(select count(*) from public.assignments a
	 where a.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
	0::bigint,
	'3. Un no-Miembro no ve asignaciones'
);

-- 4. El Autor ve su propia Pregunta (con texto) aunque el assignment esté hidden.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select ok(
	exists (
		select 1 from public.questions q
		where q.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
		and q.text = '¿Qué opinas del capítulo 2?'
	),
	'4. El Autor ve su Pregunta con texto aunque el assignment esté hidden'
);

-- 5. Un Participante NO autor NO ve la Pregunta tras el Sorteo (texto oculto
--    por RLS: la fila entera queda oculta para no-autores).
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
	(select count(*) from public.questions q
	 where q.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
	0::bigint,
	'5. Un Participante no-autor NO ve la Pregunta tras el Sorteo (texto oculto)'
);

-- ============================================================
-- Revelar: el texto se hace público
-- ============================================================

-- El Moderador revela la primera asignación.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select public.reveal_next_assignment('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- 6. Tras revelar, un Participante ve la Pregunta con texto.
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select ok(
	exists (
		select 1 from public.questions q
		where q.session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
		and q.text = '¿Qué opinas del capítulo 2?'
	),
	'6. Tras revelar: un Participante ve la Pregunta con texto completo'
);

-- ============================================================
-- lobby_assignments RPC: visibilidad del texto
-- ============================================================

-- 7. El RPC lobby_assignments devuelve las parejas.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select ok(
	(
		select json_array_length(
			public.lobby_assignments('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::json
		) > 0
	),
	'7. lobby_assignments devuelve parejas tras el Sorteo'
);

-- 8. El Autor ve el texto de su Pregunta en el RPC aunque no se haya revelado.
--    (Simulamos reseteando el estado a hidden para esta prueba.)
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Reset: ponemos la assignment de vuelta a hidden
update public.assignments set state = 'hidden'
where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select ok(
	(
		select (elem->>'questionText') is not null
		from json_array_elements(
			public.lobby_assignments('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::json
		) as elem
		limit 1
	),
	'8. El Autor ve el texto de su Pregunta en lobby_assignments (assignment hidden)'
);

-- 9. Un Participante NO autor NO ve el texto cuando assignment está hidden.
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
	(
		select elem->>'questionText'
		from json_array_elements(
			public.lobby_assignments('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::json
		) as elem
		limit 1
	),
	null::text,
	'9. Un Participante no-autor NO ve el texto en lobby_assignments (hidden)'
);

-- 10. Tras revelar, el texto es visible para todos en el RPC.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
-- Revealed state: set assignment to exposition (como si el mod hubiera avanzado)
update public.assignments set state = 'exposition'
where session_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select ok(
	(
		select (elem->>'questionText') is not null
		from json_array_elements(
			public.lobby_assignments('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::json
		) as elem
		limit 1
	),
	'10. Tras revelar: el texto es visible para todos en lobby_assignments'
);

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
