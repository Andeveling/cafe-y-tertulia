-- RLS/RPC tests para cierre de sesión (ticket #20, SPEC §3.1, §7 · ADR 0003).
-- Seam: RPC `close_session` (cierre atómico), guarda de edición en `closed`,
-- inmutabilidad en `archived` y `clear_session_rating`/`correct_assignment_notes`.

begin;
select plan(22);

-- ============================================================
-- Fixtures: membresía + material + sesiones en cada estado
-- ============================================================

insert into auth.users (id, email) values
	('11111111-1111-1111-1111-111111111111', 'moderador@club.test'),
	('22222222-2222-2222-2222-222222222222', 'miembro@club.test'),
	('33333333-3333-3333-3333-333333333333', 'invitado@club.test');

insert into public.members (id, status, display_name) values
	('11111111-1111-1111-1111-111111111111', 'active', 'Moderador'),
	('22222222-2222-2222-2222-222222222222', 'active', 'Miembro'),
	('33333333-3333-3333-3333-333333333333', 'invited', 'Invitado');

insert into public.materials (id, title, kind, author, created_by) values
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Libro de prueba', 'book', 'Alguien', '11111111-1111-1111-1111-111111111111'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Otro material', 'article', 'Otra', '11111111-1111-1111-1111-111111111111');

-- Sesiones de prueba
insert into public.sessions (id, material_id, range, status, moderator_id, scheduled_at) values
	('c1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1', 'in_progress', '11111111-1111-1111-1111-111111111111', null),
	('c1000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2', 'in_progress', '11111111-1111-1111-1111-111111111111', null), -- trivia live
	('c1000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3', 'in_progress', '11111111-1111-1111-1111-111111111111', null), -- take abierto
	('c1000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4', 'in_progress', '11111111-1111-1111-1111-111111111111', null), -- draw no revelado
	('c1000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5', 'in_progress', '11111111-1111-1111-1111-111111111111', null), -- rating abierto
	('c1000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6', 'closed',    '11111111-1111-1111-1111-111111111111', '2026-08-01 10:00:00+00'),
	('c1000000-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '7', 'archived',  '11111111-1111-1111-1111-111111111111', null);

-- Fixtures de minijuegos/draw para las sesiones que bloquean el cierre
insert into public.trivias (id, material_id, author_id, title) values
	('d1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Trivia A');
insert into public.trivia_rounds (id, session_id, trivia_id, status) values
	('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'live');
insert into public.takes (id, session_id, prompt, status, created_by) values
	('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', '¿Take?', 'open', '11111111-1111-1111-1111-111111111111');
insert into public.draws (id, session_id, status) values
	('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'pending');

-- Fixtures para la corrección de Notas en closed (test 13)
insert into public.draws (id, session_id, status) values
	('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000006', 'revealed');
insert into public.questions (id, session_id, material_id, author_id, text) values
	('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '¿Pregunta?');
insert into public.assignments (id, session_id, question_id, assignee_id, reveal_order, state, notes, draw_id) values
	('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1, 'complete', 'typo', 'd1000000-0000-0000-0000-000000000005');

-- Rating abierto + votos individuales para la sesión 5 (material A)
insert into public.session_participants (session_id, member_id) values
	('c1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111'),
	('c1000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222');
update public.sessions set rating_open = true where id = 'c1000000-0000-0000-0000-000000000005';
insert into public.votes (session_id, member_id, stars) values
	('c1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 4),
	('c1000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 5);

-- ============================================================
-- Tests
-- ============================================================

-- 1. El moderador cierra una sesión en curso sin rating: estado closed, sin rating.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
	(select (public.close_session('c1000000-0000-0000-0000-000000000001'))->>'rating_count'),
	'0',
	'1. El moderador cierra una sesión en curso sin rating'
);
select is(
	(select status from public.sessions where id = 'c1000000-0000-0000-0000-000000000001'),
	'closed'::public.session_status,
	'1b. Tras cerrar, la sesión queda en closed'
);

-- 2. No se puede cerrar dos veces (ya no está en curso).
select throws_ok(
	$$ select public.close_session('c1000000-0000-0000-0000-000000000001') $$,
	null,
	'2. No se puede cerrar una sesión que ya no está en curso'
);

-- 3. Un no-moderador (miembro) no puede cerrar la sesión en curso.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select throws_ok(
	$$ select public.close_session('c1000000-0000-0000-0000-000000000002') $$,
	null,
	'3. Un miembro que no modera no puede cerrar la sesión'
);

-- 4. Un invitado (sin membresía activa) no puede cerrar.
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select throws_ok(
	$$ select public.close_session('c1000000-0000-0000-0000-000000000002') $$,
	null,
	'4. Un invitado no puede cerrar la sesión'
);

-- 5. El cierre bloquea si queda una trivia en curso.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
	$$ select public.close_session('c1000000-0000-0000-0000-000000000002') $$,
	'Cierra primero la trivia en curso',
	'5. El cierre bloquea con una trivia en curso'
);
select is(
	(select status from public.sessions where id = 'c1000000-0000-0000-0000-000000000002'),
	'in_progress'::public.session_status,
	'5b. La sesión con trivia en curso sigue abierta'
);

-- 6. El cierre bloquea si queda una votación (take) abierta.
select throws_ok(
	$$ select public.close_session('c1000000-0000-0000-0000-000000000003') $$,
	'Cierra primero la votación abierta',
	'6. El cierre bloquea con una votación abierta'
);

-- 7. El cierre bloquea si el Sorteo no está revelado.
select throws_ok(
	$$ select public.close_session('c1000000-0000-0000-0000-000000000004') $$,
	'Revela primero el Sorteo',
	'7. El cierre bloquea con el Sorteo sin revelar'
);

-- 8. Al cerrar con rating abierto se congela promedio 1 decimal + conteo, se
--    descartan los votos y el material acumula el agregado.
select is(
	(select public.close_session('c1000000-0000-0000-0000-000000000005'))::text,
	'{"rating_avg": 4.5, "rating_count": 2}'::jsonb::text,
	'8. close_session devuelve el rating congelado'
);
select is(
	(select count(*)::int from public.votes where session_id = 'c1000000-0000-0000-0000-000000000005'),
	0,
	'8b. Los votos individuales se descartan al cerrar (ADR 0003)'
);
select is(
	(select rating_avg from public.sessions where id = 'c1000000-0000-0000-0000-000000000005'),
	4.5::numeric,
	'8c. El promedio se congela con un decimal'
);
select is(
	(select rating_count from public.sessions where id = 'c1000000-0000-0000-0000-000000000005'),
	2,
	'8d. El conteo se congela al cerrar'
);
select is(
	(select rating_avg from public.materials where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
	4.5::numeric,
	'8e. El material acumula el rating de la sesión cerrada'
);

-- 9. En closed, el moderador puede corregir el rango (dato permitido).
select lives_ok(
	$$ update public.sessions set range = 'Capítulos 1-3' where id = 'c1000000-0000-0000-0000-000000000006' $$,
	'9. El moderador corrige el rango de una sesión cerrada'
);

-- 10. En closed, un no-moderador no puede corregir el rango.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select throws_ok(
	$$ update public.sessions set range = 'Hack' where id = 'c1000000-0000-0000-0000-000000000006' $$,
	'Solo el moderador de la sesión puede corregirla',
	'10. Un no-moderador no puede corregir el rango de una sesión cerrada'
);

-- 11. En closed, ni el moderador puede tocar columnas inmutables (material_id).
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
	$$ update public.sessions set material_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'c1000000-0000-0000-0000-000000000006' $$,
	'Ese dato de la sesión no puede modificarse',
	'11. El material de una sesión cerrada es inmutable'
);

-- 12. En closed, el moderador puede borrar/mover el agregado vía RPC.
update public.sessions set rating_avg = 4.5, rating_count = 2 where id = 'c1000000-0000-0000-0000-000000000006';
select lives_ok(
	$$ select public.clear_session_rating('c1000000-0000-0000-0000-000000000006') $$,
	'12. El moderador limpia el agregado de rating en una sesión cerrada'
);
select is(
	(select rating_count from public.sessions where id = 'c1000000-0000-0000-0000-000000000006'),
	0,
	'12b. El agregado de rating queda vacío tras limpiarlo'
);

-- 13. En closed, el moderador corrige las Notas de una asignación.
select lives_ok(
	$$ select public.correct_assignment_notes('f1000000-0000-0000-0000-000000000001', 'Nota corregida') $$,
	'13. El moderador corrige las Notas de una sesión cerrada'
);
select is(
	(select notes from public.assignments where id = 'f1000000-0000-0000-0000-000000000001'),
	'Nota corregida',
	'13b. Las Notas corregidas persisten'
);

-- 14. En archived, cualquier UPDATE falla (inmutable), incluso para el moderador.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
	$$ update public.sessions set range = 'Nada' where id = 'c1000000-0000-0000-0000-000000000007' $$,
	'La sesión en histórico es inmutable',
	'14. Una sesión en histórico es inmutable'
);

rollback;
