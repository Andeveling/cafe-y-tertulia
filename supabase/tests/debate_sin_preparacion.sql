-- Debate sin Preparación: revelar va directo a exposición, avanzar cubre
-- exposition→complement/complete, y el +1 suma 60 s + registra question_hot.
-- Seam: RPCs (reveal/advance/extend) + RLS solo donde aplica.

begin;
select plan(8);

-- ============================================================
-- Fixtures
-- ============================================================

insert into auth.users (id, email) values
	('d9000000-0000-0000-0000-000000000001', 'mod@club.test'),
	('d9000000-0000-0000-0000-000000000002', 'autor@club.test'),
	('d9000000-0000-0000-0000-000000000003', 'asignado@club.test');

insert into public.members (id, status, display_name) values
	('d9000000-0000-0000-0000-000000000001', 'active', 'Moderador'),
	('d9000000-0000-0000-0000-000000000002', 'active', 'Autor'),
	('d9000000-0000-0000-0000-000000000003', 'active', 'Asignado');

insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('d9000000-0000-0000-0000-0000000000a1', null, 'Cap. 1', 'in_progress', 'd9000000-0000-0000-0000-000000000001', 'debate');

insert into public.session_participants (session_id, member_id, role) values
	('d9000000-0000-0000-0000-0000000000a1', 'd9000000-0000-0000-0000-000000000002', 'member'),
	('d9000000-0000-0000-0000-0000000000a1', 'd9000000-0000-0000-0000-000000000003', 'member');

insert into public.questions (id, session_id, material_id, author_id, text) values
	('d9000000-0000-0000-0000-0000000000b1', 'd9000000-0000-0000-0000-0000000000a1', null, 'd9000000-0000-0000-0000-000000000002', '¿Pregunta hot?');

insert into public.draws (id, session_id, status) values
	('d9000000-0000-0000-0000-0000000000d1', 'd9000000-0000-0000-0000-0000000000a1', 'hidden');

insert into public.assignments (id, session_id, question_id, assignee_id, draw_id, reveal_order, state) values
	('d9000000-0000-0000-0000-0000000000c1', 'd9000000-0000-0000-0000-0000000000a1', 'd9000000-0000-0000-0000-0000000000b1', 'd9000000-0000-0000-0000-000000000003', 'd9000000-0000-0000-0000-0000000000d1', 1, 'hidden');

-- ============================================================
-- Tests (como el Moderador)
-- ============================================================

set local role authenticated;
set local request.jwt.claim.sub = 'd9000000-0000-0000-0000-000000000001';

-- 1. Revelar va directo a exposición (sin preparación).
select public.reveal_next_assignment('d9000000-0000-0000-0000-0000000000a1');

select is(
	(select state::text from public.assignments
	 where id = 'd9000000-0000-0000-0000-0000000000c1'),
	'exposition',
	'1. Revelar entra directo en exposición'
);

-- 2. El +1 suma 60 s al ancla (mueve phase_started_at atrás).
select public.extend_exposition('d9000000-0000-0000-0000-0000000000c1');

select ok(
	(select phase_started_at <= now() - interval '59 seconds'
	 from public.assignments
	 where id = 'd9000000-0000-0000-0000-0000000000c1'),
	'2. El +1 mueve el ancla 60 s atrás'
);

-- 3. El +1 registra question_hot = bono al autor.
select is(
	(select value from public.counts
	 where member_id = 'd9000000-0000-0000-0000-000000000002'
	 and event = 'question_hot'
	 and season_id = (select id from public.seasons where status = 'open' order by starts_at desc limit 1)),
	1,
	'3. El +1 registra question_hot al autor'
);

-- 4. Segundo +1 acumula (mide lo hot).
select public.extend_exposition('d9000000-0000-0000-0000-0000000000c1');

select is(
	(select value from public.counts
	 where member_id = 'd9000000-0000-0000-0000-000000000002'
	 and event = 'question_hot'
	 and season_id = (select id from public.seasons where status = 'open' order by starts_at desc limit 1)),
	2,
	'4. Cada +1 acumula question_hot'
);

-- 5. Avanzar en exposición con autor presente va a complemento.
select is(
	public.advance_intervention('d9000000-0000-0000-0000-0000000000a1'),
	'complement'::public.assignment_state,
	'5. Exposición con autor presente pasa a complemento'
);

-- 6. El +1 fuera de exposición se rechaza.
select throws_ok(
	$$select public.extend_exposition('d9000000-0000-0000-0000-0000000000c1')$$,
	'P0001', null,
	'6. El +1 en complemento se rechaza'
);

-- 7. Un no-moderador no extiende.
set local request.jwt.claim.sub = 'd9000000-0000-0000-0000-000000000003';

select throws_ok(
	$$select public.extend_exposition('d9000000-0000-0000-0000-0000000000c1')$$,
	'P0001', null,
	'7. Un no-moderador no extiende'
);

-- 8. save_assignment_notes ya no existe (notas fuera del debate).
select ok(
	not exists (select 1 from pg_proc where proname = 'save_assignment_notes'),
	'8. save_assignment_notes eliminado'
);

-- ============================================================
-- Teardown
-- ============================================================

reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
