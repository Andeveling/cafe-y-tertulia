-- RLS tests: INSERT de Preguntas en Sala viva (in_progress + questions).
-- Regresión de `new row violates row-level security policy for table
-- "questions"` al aportar desde /materials/sessions/:id/room con la Sesión en
-- in_progress y room_stage='questions'.
-- Seam: RLS only.

begin;
select plan(4);

-- ============================================================
-- Fixtures: membership + material + sessions
-- ============================================================

insert into auth.users (id, email) values
	('b1000000-0000-0000-0000-000000000001', 'autor@club.test'),
	('b1000000-0000-0000-0000-000000000002', 'peer@club.test');

insert into public.members (id, status, display_name) values
	('b1000000-0000-0000-0000-000000000001', 'active', 'Autor'),
	('b1000000-0000-0000-0000-000000000002', 'active', 'Peer');

insert into public.materials (id, title, kind, author, created_by) values
	('b1000000-0000-0000-0000-0000000000e1', 'Libro de prueba', 'book', 'A', 'b1000000-0000-0000-0000-000000000001'),
	('b1000000-0000-0000-0000-0000000000e2', 'Otro material', 'video', 'B', 'b1000000-0000-0000-0000-000000000001');

insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('b1000000-0000-0000-0000-0000000000a1', 'b1000000-0000-0000-0000-0000000000e1', 'Cap. 1', 'in_progress', 'b1000000-0000-0000-0000-000000000002', 'questions'),
	('b1000000-0000-0000-0000-0000000000a2', 'b1000000-0000-0000-0000-0000000000e1', 'Cap. 2', 'in_progress', 'b1000000-0000-0000-0000-000000000002', 'debate'),
	('b1000000-0000-0000-0000-0000000000a3', 'b1000000-0000-0000-0000-0000000000e1', 'Cap. 3', 'lobby', 'b1000000-0000-0000-0000-000000000002', 'questions');

-- ============================================================
-- Tests (como el autor, Miembro activo)
-- ============================================================

set local role authenticated;
set local request.jwt.claim.sub = 'b1000000-0000-0000-0000-000000000001';

-- 1. Regresión: aportar en Sala viva (in_progress + questions) está permitido.
insert into public.questions (session_id, material_id, author_id, text) values
	('b1000000-0000-0000-0000-0000000000a1', 'b1000000-0000-0000-0000-0000000000e1', 'b1000000-0000-0000-0000-000000000001', '¿Pregunta en sala viva?');

select is(
	(select count(*)::int from public.questions q
	 where q.session_id = 'b1000000-0000-0000-0000-0000000000a1'
	 and q.text = '¿Pregunta en sala viva?'),
	1,
	'1. Un Miembro aporta una Pregunta en Sala viva (in_progress + questions)'
);

-- 2. Lobby + questions sigue permitido (sin regresión del flujo previo).
insert into public.questions (session_id, material_id, author_id, text) values
	('b1000000-0000-0000-0000-0000000000a3', 'b1000000-0000-0000-0000-0000000000e1', 'b1000000-0000-0000-0000-000000000001', '¿Pregunta en lobby?');

select is(
	(select count(*)::int from public.questions q
	 where q.session_id = 'b1000000-0000-0000-0000-0000000000a3'
	 and q.text = '¿Pregunta en lobby?'),
	1,
	'2. Un Miembro aporta una Pregunta en lobby + questions'
);

-- 3. En debate (in_progress + debate) NO se puede aportar: el Sorteo ya pasó.
do $$
begin
	insert into public.questions (session_id, material_id, author_id, text) values
		('b1000000-0000-0000-0000-0000000000a2', 'b1000000-0000-0000-0000-0000000000e1', 'b1000000-0000-0000-0000-000000000001', '¿Pregunta en debate?');
	raise exception 'insert should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select count(*)::int from public.questions q
	 where q.text = '¿Pregunta en debate?'),
	0,
	'3. Un Miembro NO aporta una Pregunta en debate'
);

-- 4. El material denormalizado sigue validado en Sala viva.
do $$
begin
	insert into public.questions (session_id, material_id, author_id, text) values
		('b1000000-0000-0000-0000-0000000000a1', 'b1000000-0000-0000-0000-0000000000e2', 'b1000000-0000-0000-0000-000000000001', '¿Material incoherente en sala viva?');
	raise exception 'insert should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select count(*)::int from public.questions q
	 where q.text = '¿Material incoherente en sala viva?'),
	0,
	'4. El material_id de una Pregunta en Sala viva debe coincidir con el de su Sesión'
);

-- ============================================================
-- Teardown
-- ============================================================

reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
