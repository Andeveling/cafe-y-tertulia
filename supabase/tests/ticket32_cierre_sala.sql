-- Tests para ticket #32: Cierre dentro de la Sala (rating + cerrar sesión).
-- Seam: RPCs. `advance_room_stage` llega hasta 'cierre' (lineal, solo
-- Moderador); `advance_intervention` hace flip automático a Cierre al
-- completarse la última Intervención; `room_snapshot` expone los pendientes del
-- checklist; el cierre consolidado reutiliza `close_session` (#20) congelando
-- el rating.

begin;
select plan(17);

-- ============================================================
-- Fixtures: membresía + material + sesiones en cada etapa
-- ============================================================

insert into auth.users (id, email) values
	('11111111-1111-1111-1111-111111111111', 'moderador@club.test'),
	('22222222-2222-2222-2222-222222222222', 'miembro@club.test'),
	('33333333-3333-3333-3333-333333333333', 'autor@club.test'),
	('44444444-4444-4444-4444-444444444444', 'externo@club.test');

insert into public.members (id, status, display_name) values
	('11111111-1111-1111-1111-111111111111', 'active', 'Moderador'),
	('22222222-2222-2222-2222-222222222222', 'active', 'Miembro'),
	('33333333-3333-3333-3333-333333333333', 'active', 'Autor'),
	('44444444-4444-4444-4444-444444444444', 'active', 'Externo');

insert into public.materials (id, title, kind, author, created_by) values
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Libro de prueba', 'book', 'Alguien', '11111111-1111-1111-1111-111111111111');

-- S1: debate → cierre manual (Moderador)
insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('32000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1', 'in_progress', '11111111-1111-1111-1111-111111111111', 'debate');
-- S2: saltos inválidos desde presence
insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('32000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2', 'lobby', '11111111-1111-1111-1111-111111111111', 'presence');
-- S3: última Intervención completa → flip automático a Cierre
insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('32000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3', 'in_progress', '11111111-1111-1111-1111-111111111111', 'debate');
-- S4: Intervención intermedia NO hace flip
insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('32000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4', 'in_progress', '11111111-1111-1111-1111-111111111111', 'debate');
-- S5: etapa Cierre — checklist, rating y cierre consolidado
insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('32000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5', 'in_progress', '11111111-1111-1111-1111-111111111111', 'cierre');

-- Participantes de S5: Moderador y Miembro (Autor y Externo NO entraron)
insert into public.session_participants (session_id, member_id) values
	('32000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111'),
	('32000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222');

-- Sorteo revelado + asignaciones de S3 y S4 (autores ausentes de la mesa:
-- exposition avanza directo a complete sin pasar por complement)
insert into public.draws (id, session_id, status) values
	('32000000-0000-0000-0000-0000000000d3', '32000000-0000-0000-0000-000000000003', 'revealed'),
	('32000000-0000-0000-0000-0000000000d4', '32000000-0000-0000-0000-000000000004', 'revealed');

insert into public.questions (id, session_id, material_id, author_id, text) values
	('32000000-0000-0000-0000-000000000b01', '32000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '¿Pregunta S3?'),
	('32000000-0000-0000-0000-000000000b02', '32000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '¿Pregunta S4?');

insert into public.assignments (id, session_id, question_id, assignee_id, draw_id, reveal_order, state) values
	('32000000-0000-0000-0000-00000000a031', '32000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000b01', '22222222-2222-2222-2222-222222222222', '32000000-0000-0000-0000-0000000000d3', 1, 'exposition'),
	('32000000-0000-0000-0000-00000000a041', '32000000-0000-0000-0000-000000000004', '32000000-0000-0000-0000-000000000b02', '22222222-2222-2222-2222-222222222222', '32000000-0000-0000-0000-0000000000d4', 1, 'complete'),
	('32000000-0000-0000-0000-00000000a042', '32000000-0000-0000-0000-000000000004', '32000000-0000-0000-0000-000000000b02', '11111111-1111-1111-1111-111111111111', '32000000-0000-0000-0000-0000000000d4', 2, 'exposition'),
	('32000000-0000-0000-0000-00000000a043', '32000000-0000-0000-0000-000000000004', '32000000-0000-0000-0000-000000000b02', '44444444-4444-4444-4444-444444444444', '32000000-0000-0000-0000-0000000000d4', 3, 'hidden'); -- S4 sigue con pendiente tras el avance intermedio

-- Minijuegos abiertos en S5 (checklist pendiente)
insert into public.trivias (id, material_id, author_id, title) values
	('32000000-0000-0000-0000-000000000c01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Trivia S5');
insert into public.trivia_rounds (id, session_id, trivia_id, status) values
	('32000000-0000-0000-0000-000000000d01', '32000000-0000-0000-0000-000000000005', '32000000-0000-0000-0000-000000000c01', 'live');
insert into public.takes (id, session_id, prompt, status, created_by) values
	('32000000-0000-0000-0000-000000000e01', '32000000-0000-0000-0000-000000000005', '¿Take?', 'open', '11111111-1111-1111-1111-111111111111');

-- ============================================================
-- advance_room_stage: guards y avance lineal
-- ============================================================

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222'; -- Miembro

select throws_ok(
	$$select public.advance_room_stage('32000000-0000-0000-0000-000000000002', 'cierre')$$,
	'P0001', null,
	'1. Un no-Moderador no puede avanzar etapas'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; -- Moderador

select throws_ok(
	$$select public.advance_room_stage('32000000-0000-0000-0000-000000000002', 'cierre')$$,
	'P0001', null,
	'2. Salto inválido presence → cierre'
);

select lives_ok(
	$$select public.advance_room_stage('32000000-0000-0000-0000-000000000001', 'cierre')$$,
	'3. El Moderador avanza debate → cierre'
);

select is(
	(select room_stage from public.sessions where id = '32000000-0000-0000-0000-000000000001'),
	'cierre'::public.room_stage,
	'4. La Sala queda en etapa Cierre'
);

select throws_ok(
	$$select public.advance_room_stage('32000000-0000-0000-0000-000000000001', 'draw')$$,
	'P0001', null,
	'5. Desde cierre no se puede retroceder'
);

-- ============================================================
-- advance_intervention: flip automático solo con la última Intervención
-- ============================================================

select is(
	public.advance_intervention('32000000-0000-0000-0000-000000000004'),
	'complete'::public.assignment_state,
	'6. La Intervención intermedia se completa directo (autor ausente, sin Complemento)'
);

select is(
	(select room_stage from public.sessions where id = '32000000-0000-0000-0000-000000000004'),
	'debate'::public.room_stage,
	'7. Completar una Intervención intermedia NO cambia la etapa (quedan ocultas/activas)'
);

select is(
	public.advance_intervention('32000000-0000-0000-0000-000000000003'),
	'complete'::public.assignment_state,
	'8. La última Intervención se completa'
);

select is(
	(select room_stage from public.sessions where id = '32000000-0000-0000-0000-000000000003'),
	'cierre'::public.room_stage,
	'9. Al terminar la última Intervención la Sala cambia a Cierre automáticamente'
);

-- ============================================================
-- room_snapshot: checklist de pendientes en Cierre
-- ============================================================

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
	((select public.room_snapshot('32000000-0000-0000-0000-000000000005'))->'cierre'->>'open_trivia')::int,
	1,
	'10. El snapshot expone la trivia en curso como pendiente'
);

select is(
	((select public.room_snapshot('32000000-0000-0000-0000-000000000005'))->'cierre'->>'open_takes')::int,
	1,
	'11. El snapshot expone el take abierto como pendiente'
);

-- ============================================================
-- Rating en Cierre: votable/modificable hasta cerrar (#20)
-- ============================================================

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
	$$select public.open_session_rating('32000000-0000-0000-0000-000000000005')$$,
	'12. El Moderador abre la votación del rating en Cierre'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select lives_ok(
	$$select public.cast_session_vote('32000000-0000-0000-0000-000000000005', 4)$$,
	'13. Un Participante vota el rating (anónimo)'
);

select lives_ok(
	$$select public.cast_session_vote('32000000-0000-0000-0000-000000000005', 5)$$,
	'14. El voto es modificable hasta cerrar'
);

set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select throws_ok(
	$$select public.cast_session_vote('32000000-0000-0000-0000-000000000005', 3)$$,
	'P0001', null,
	'15. Quien no es Participante confirmado no puede votar'
);

-- ============================================================
-- Cierre consolidado: close_session congela el rating (#20)
-- ============================================================

reset role;

delete from public.takes where id = '32000000-0000-0000-0000-000000000e01';
delete from public.trivia_rounds where id = '32000000-0000-0000-0000-000000000d01';

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
	$$select public.close_session('32000000-0000-0000-0000-000000000005')$$,
	'16. Cerrar sesión ejecuta el cierre consolidado'
);

select is(
	(select json_build_object(
		'status', status,
		'rating_open', rating_open,
		'rating_avg', rating_avg,
		'rating_count', rating_count,
		'votes_left', (select count(*) from public.votes where session_id = '32000000-0000-0000-0000-000000000005')
	)::jsonb
	from public.sessions where id = '32000000-0000-0000-0000-000000000005'),
	json_build_object(
		'status', 'closed',
		'rating_open', false,
		'rating_avg', 5.0::numeric(2,1),
		'rating_count', 1,
		'votes_left', 0::bigint
	)::jsonb,
	'17. Al cerrar: sesión cerrada, rating congelado y votos individuales descartados'
);

select * from finish();
rollback;
