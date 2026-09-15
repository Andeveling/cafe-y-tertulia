-- Regresión: volver del Debate al Sorteo reabre el lobby sin que el
-- trigger forward-only lo bloquee ("El estado de la Sesión solo puede
-- avanzar: in_progress → lobby").
-- Seam: RPC advance_room_stage + trigger sessions_status_forward_only.

begin;
select plan(4);

-- ============================================================
-- Fixtures: membresía + sesión en debate (sin sorteo previo)
-- ============================================================

insert into auth.users (id, email) values
	('c9000000-0000-0000-0000-000000000001', 'mod@club.test'),
	('c9000000-0000-0000-0000-000000000002', 'miembro@club.test');

insert into public.members (id, status, display_name) values
	('c9000000-0000-0000-0000-000000000001', 'active', 'Moderador'),
	('c9000000-0000-0000-0000-000000000002', 'active', 'Miembro');

insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('c9000000-0000-0000-0000-0000000000a1', null, 'Cap. 4', 'in_progress', 'c9000000-0000-0000-0000-000000000001', 'debate'),
	('c9000000-0000-0000-0000-0000000000a2', null, 'Cap. 5', 'in_progress', 'c9000000-0000-0000-0000-000000000001', 'debate');

insert into public.session_participants (session_id, member_id, role) values
	('c9000000-0000-0000-0000-0000000000a1', 'c9000000-0000-0000-0000-000000000002', 'member');

insert into public.questions (session_id, material_id, author_id, text) values
	('c9000000-0000-0000-0000-0000000000a1', null, 'c9000000-0000-0000-0000-000000000002', '¿Pregunta lista?');

-- ============================================================
-- Tests (como el Moderador)
-- ============================================================

set local role authenticated;
set local request.jwt.claim.sub = 'c9000000-0000-0000-0000-000000000001';

-- 1. Volver del Debate al Sorteo reabre el lobby (room_stage + status).
select public.advance_room_stage(
	'c9000000-0000-0000-0000-0000000000a1', 'draw');

select is(
	(select status::text || '/' || room_stage::text from public.sessions
	 where id = 'c9000000-0000-0000-0000-0000000000a1'),
	'lobby/draw',
	'1. Volver del Debate al Sorteo reabre el lobby'
);

-- 2. Avanzar de nuevo al Debate vuelve a en curso.
select public.advance_room_stage(
	'c9000000-0000-0000-0000-0000000000a1', 'debate');

select is(
	(select status::text || '/' || room_stage::text from public.sessions
	 where id = 'c9000000-0000-0000-0000-0000000000a1'),
	'in_progress/debate',
	'2. Reavanzar al Debate vuelve a en curso'
);

reset role;
reset request.jwt.claim.sub;

-- 3. Fuera de la reapertura, in_progress → lobby sigue bloqueado
--    (misma etapa, sin cambio de room_stage).
do $$
begin
	update public.sessions set status = 'lobby'
	where id = 'c9000000-0000-0000-0000-0000000000a2';
	raise exception 'update should have been blocked by forward-only trigger';
exception
	when others then
		null;
end $$;

select is(
	(select status::text from public.sessions
	 where id = 'c9000000-0000-0000-0000-0000000000a2'),
	'in_progress',
	'3. in_progress → lobby sin reapertura sigue bloqueado'
);

-- 4. La excepción es estrecha: in_progress → lobby con otra pareja de
--    etapas (debate → presence) sigue bloqueado.
do $$
begin
	update public.sessions set status = 'lobby', room_stage = 'presence'
	where id = 'c9000000-0000-0000-0000-0000000000a2';
	raise exception 'update should have been blocked by forward-only trigger';
exception
	when others then
		null;
end $$;

select is(
	(select status::text || '/' || room_stage::text from public.sessions
	 where id = 'c9000000-0000-0000-0000-0000000000a2'),
	'in_progress/debate',
	'4. in_progress → lobby con otra pareja de etapas sigue bloqueado'
);

-- ============================================================
-- Teardown
-- ============================================================

select * from finish();
rollback;
