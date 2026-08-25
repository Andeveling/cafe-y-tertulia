-- pgTAP tests for ticket #39: Convocatoria.
-- UUIDs prefixed 39000000- to avoid collisions with shared local DB.

begin;
select plan(19);

-- ============================================================
-- Fixtures
-- ============================================================

insert into auth.users (id, email) values
	('39000000-0000-0000-0000-000000000001', 'mod39@club.test'),
	('39000000-0000-0000-0000-000000000002', 'member39@club.test'),
	('39000000-0000-0000-0000-000000000003', 'other39@club.test');

insert into public.members (id, status, display_name) values
	('39000000-0000-0000-0000-000000000001', 'active', 'Mod39'),
	('39000000-0000-0000-0000-000000000002', 'active', 'Member39'),
	('39000000-0000-0000-0000-000000000003', 'active', 'Other39');

-- Lobby session moderated by user 01
insert into public.sessions (id, status, moderator_id) values
	('39000000-0000-0000-0000-000000000010', 'lobby', '39000000-0000-0000-0000-000000000001');

-- in_progress session moderated by user 01
insert into public.sessions (id, status, moderator_id) values
	('39000000-0000-0000-0000-000000000011', 'in_progress', '39000000-0000-0000-0000-000000000001');

-- Closed session (should reject convocar)
insert into public.sessions (id, status, moderator_id) values
	('39000000-0000-0000-0000-000000000012', 'closed', '39000000-0000-0000-0000-000000000001');

-- Session moderated by user 02 (for "not moderator" test)
insert into public.sessions (id, status, moderator_id) values
	('39000000-0000-0000-0000-000000000020', 'lobby', '39000000-0000-0000-0000-000000000002');

-- ============================================================
-- Tests
-- ============================================================

-- 1. convocar: basic success
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000001';

select lives_ok(
	$$ select public.convocar('39000000-0000-0000-0000-000000000010', '39000000-0000-0000-0000-000000000002') $$,
	'1. convocar: moderador convoca a miembro en lobby'
);

select is(
	(select count(*)::int from public.convocatorias
		where session_id = '39000000-0000-0000-0000-000000000010'
		and to_id = '39000000-0000-0000-0000-000000000002'
		and status = 'pending'),
	1,
	'1b. convocatoria pending creada'
);

-- 2. convocar: idempotent (no-op if already pending)
select lives_ok(
	$$ select public.convocar('39000000-0000-0000-0000-000000000010', '39000000-0000-0000-0000-000000000002') $$,
	'2. convocar: idempotente, no falla si ya hay pending'
);

select is(
	(select count(*)::int from public.convocatorias
		where session_id = '39000000-0000-0000-0000-000000000010'
		and to_id = '39000000-0000-0000-0000-000000000002'
		and status = 'pending'),
	1,
	'2b. sigue habiendo exactamente 1 convocatoria pending'
);

-- 3. convocar: in_progress session works
select lives_ok(
	$$ select public.convocar('39000000-0000-0000-0000-000000000011', '39000000-0000-0000-0000-000000000003') $$,
	'3. convocar: funciona en sesión in_progress'
);

-- 4. convocar: not moderator fails
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000001';

select throws_ok(
	$$ select public.convocar('39000000-0000-0000-0000-000000000020', '39000000-0000-0000-0000-000000000001') $$,
	'Solo el moderador puede convocar',
	'4. convocar: no moderador falla'
);

-- 5. convocar: closed session fails
select throws_ok(
	$$ select public.convocar('39000000-0000-0000-0000-000000000012', '39000000-0000-0000-0000-000000000002') $$,
	'La sesión no está abierta',
	'5. convocar: sesión cerrada falla'
);

-- 6. convocar: self-convocar fails
select throws_ok(
	$$ select public.convocar('39000000-0000-0000-0000-000000000010', '39000000-0000-0000-0000-000000000001') $$,
	'No puedes convocarte a ti mismo',
	'6. convocar: auto-convocatoria falla'
);

-- 7. convocar: non-active member fails
set local role postgres;
insert into auth.users (id, email) values
	('39000000-0000-0000-0000-000000000099', 'lefty39@club.test');
insert into public.members (id, status, display_name) values
	('39000000-0000-0000-0000-000000000099', 'left', 'Lefty');

set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000001';

select throws_ok(
	$$ select public.convocar('39000000-0000-0000-0000-000000000010', '39000000-0000-0000-0000-000000000099') $$,
	'El miembro no está activo',
	'7. convocar: miembro no activo falla'
);

-- 8. responder_convocatoria: accept
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000002';

create temp table t39_conv_id as
	select id from public.convocatorias
	where session_id = '39000000-0000-0000-0000-000000000010'
	and to_id = '39000000-0000-0000-0000-000000000002'
	and status = 'pending';

select lives_ok(
	format($$ select public.responder_convocatoria(%L, true) $$, (select id from t39_conv_id)),
	'8. responder: aceptar convocatoria'
);

select is(
	(select status from public.convocatorias where id = (select id from t39_conv_id)),
	'accepted'::public.convocatoria_status,
	'8b. status cambió a accepted'
);

-- 9. responder_convocatoria: dismiss (create a new one first)
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000001';

select public.convocar('39000000-0000-0000-0000-000000000011', '39000000-0000-0000-0000-000000000002');

set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000002';

create temp table t39_conv_id2 as
	select id from public.convocatorias
	where session_id = '39000000-0000-0000-0000-000000000011'
	and to_id = '39000000-0000-0000-0000-000000000002'
	and status = 'pending';

select lives_ok(
	format($$ select public.responder_convocatoria(%L, false) $$, (select id from t39_conv_id2)),
	'9. responder: rechazar convocatoria'
);

select is(
	(select status from public.convocatorias where id = (select id from t39_conv_id2)),
	'dismissed'::public.convocatoria_status,
	'9b. status cambió a dismissed'
);

-- 10. responder_convocatoria: wrong user fails
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000003';

select throws_ok(
	format($$ select public.responder_convocatoria(%L, true) $$, (select id from t39_conv_id2)),
	'Convocatoria no encontrada o ya respondida',
	'10. responder: usuario incorrecto falla'
);

-- 11. responder_convocatoria: already responded fails
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000002';

select throws_ok(
	format($$ select public.responder_convocatoria(%L, true) $$, (select id from t39_conv_id2)),
	'Convocatoria no encontrada o ya respondida',
	'11. responder: ya respondida falla'
);

-- 12. RLS: to_id can see their convocatorias
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000002';

select is(
	(select count(*)::int from public.convocatorias where to_id = '39000000-0000-0000-0000-000000000002'),
	2,
	'12. RLS: to_id ve sus convocatorias'
);

-- 13. RLS: from_id can see their convocatorias
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000001';

select is(
	(select count(*)::int from public.convocatorias where from_id = '39000000-0000-0000-0000-000000000001'),
	3,
	'13. RLS: from_id ve sus convocatorias'
);

-- 14. Accept does not insert a participant
set local role postgres;
select is(
	(select count(*)::int from public.session_participants
		where session_id = '39000000-0000-0000-0000-000000000010'
		and member_id = '39000000-0000-0000-0000-000000000002'),
	0,
	'14. Aceptar no crea Participante'
);

-- 15. responder returns session_id
set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000001';

-- Create a fresh convocation for user 03
select public.convocar('39000000-0000-0000-0000-000000000010', '39000000-0000-0000-0000-000000000003');

set local role authenticated;
set local request.jwt.claim.sub = '39000000-0000-0000-0000-000000000003';

create temp table t39_conv_id3 as
	select id from public.convocatorias
	where session_id = '39000000-0000-0000-0000-000000000010'
	and to_id = '39000000-0000-0000-0000-000000000003'
	and status = 'pending';

select is(
	(select public.responder_convocatoria(id, true) from t39_conv_id3),
	'39000000-0000-0000-0000-000000000010'::uuid,
	'15. responder retorna session_id'
);

select * from finish();
rollback;
