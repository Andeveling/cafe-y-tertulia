-- RLS tests for ticket #40: author can edit/delete own question while the
-- Sala is alive and room_stage = 'questions'. Once the moderator advances
-- to presence, the question is frozen for the Sorteo.
-- Seam: RLS only — server actions are tested in app/materials/_lib/room-actions.test.ts.

begin;
select plan(7);

-- ============================================================
-- Fixtures: membership + material + session
-- ============================================================

insert into auth.users (id, email) values
	('aa000000-0000-0000-0000-000000000001', 'autor@club.test'),
	('aa000000-0000-0000-0000-000000000002', 'peer@club.test'),
	('aa000000-0000-0000-0000-000000000003', 'mod@club.test');

insert into public.members (id, status, display_name) values
	('aa000000-0000-0000-0000-000000000001', 'active', 'Autor'),
	('aa000000-0000-0000-0000-000000000002', 'active', 'Peer'),
	('aa000000-0000-0000-0000-000000000003', 'active', 'Moderador');

insert into public.materials (id, title, kind, author, created_by) values
	('ee000000-0000-0000-0000-0000000000e1', 'Libro de prueba', 'book', 'A', 'aa000000-0000-0000-0000-000000000001');

insert into public.sessions (id, material_id, range, status, moderator_id, room_stage) values
	('ee000000-0000-0000-0000-0000000000a1', 'ee000000-0000-0000-0000-0000000000e1', 'Cap. 1', 'lobby', 'aa000000-0000-0000-0000-000000000003', 'questions'),
	('ee000000-0000-0000-0000-0000000000a2', 'ee000000-0000-0000-0000-0000000000e1', 'Cap. 2', 'lobby', 'aa000000-0000-0000-0000-000000000003', 'presence'),
	('ee000000-0000-0000-0000-0000000000a3', 'ee000000-0000-0000-0000-0000000000e1', 'Cap. 3', 'lobby', 'aa000000-0000-0000-0000-000000000003', 'questions');

insert into public.questions (id, session_id, material_id, author_id, text) values
	('ee000000-0000-0000-0000-0000000000b1', 'ee000000-0000-0000-0000-0000000000a1', 'ee000000-0000-0000-0000-0000000000e1', 'aa000000-0000-0000-0000-000000000001', 'Original en questions'),
	('ee000000-0000-0000-0000-0000000000b2', 'ee000000-0000-0000-0000-0000000000a2', 'ee000000-0000-0000-0000-0000000000e1', 'aa000000-0000-0000-0000-000000000001', 'Original en presence'),
	('ee000000-0000-0000-0000-0000000000b3', 'ee000000-0000-0000-0000-0000000000a3', 'ee000000-0000-0000-0000-0000000000e1', 'aa000000-0000-0000-0000-000000000001', 'Original en sesión cerrada');

-- Cierra s3 tras crear sus fixtures: el frozen_guard bloquea insertar
-- preguntas directamente en una sesión cerrada, así que se avanza por el
-- ciclo de vida permitido (lobby → in_progress → closed).
update public.sessions set status = 'in_progress' where id = 'ee000000-0000-0000-0000-0000000000a3';
update public.sessions set status = 'closed' where id = 'ee000000-0000-0000-0000-0000000000a3';

-- ============================================================
-- Tests
-- ============================================================

-- 1. El autor puede editar el texto de su propia pregunta en questions.
set local role authenticated;
set local request.jwt.claim.sub = 'aa000000-0000-0000-0000-000000000001';

update public.questions
set text = 'Editada en questions'
where id = 'ee000000-0000-0000-0000-0000000000b1';

select is(
	(select text from public.questions where id = 'ee000000-0000-0000-0000-0000000000b1'),
	'Editada en questions',
	'1. El autor edita su pregunta en room_stage=questions'
);

-- 2. El autor puede borrar su propia pregunta en questions.
delete from public.questions
where id = 'ee000000-0000-0000-0000-0000000000b1';

select is(
	(select count(*)::int from public.questions where id = 'ee000000-0000-0000-0000-0000000000b1'),
	0,
	'2. El autor borra su pregunta en room_stage=questions'
);

-- 3. El autor NO puede editar en room_stage=presence (ya entró al Sorteo).
do $$
begin
	update public.questions
	set text = 'Intento en presence'
	where id = 'ee000000-0000-0000-0000-0000000000b2';
	raise exception 'update should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select text from public.questions where id = 'ee000000-0000-0000-0000-0000000000b2'),
	'Original en presence',
	'3. El autor NO edita su pregunta en room_stage=presence'
);

-- 4. El autor NO puede borrar en room_stage=presence.
do $$
begin
	delete from public.questions
	where id = 'ee000000-0000-0000-0000-0000000000b2';
	raise exception 'delete should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select count(*)::int from public.questions where id = 'ee000000-0000-0000-0000-0000000000b2'),
	1,
	'4. El autor NO borra su pregunta en room_stage=presence'
);

-- 5. Otro Miembro NO puede editar la pregunta ajena.
set local request.jwt.claim.sub = 'aa000000-0000-0000-0000-000000000002';

do $$
begin
	update public.questions
	set text = 'Peer edita ajeno'
	where id = 'ee000000-0000-0000-0000-0000000000b2';
	raise exception 'update should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select text from public.questions where id = 'ee000000-0000-0000-0000-0000000000b2'),
	'Original en presence',
	'5. Otro Miembro no edita una pregunta ajena'
);

-- 6. El Moderador NO edita texto con su policy (solo outside_draw): su policy
--    NO matchea porque la pregunta es de otro autor; la self-edit policy
--    tampoco porque author_id != auth.uid(). Texto intacto.
set local request.jwt.claim.sub = 'aa000000-0000-0000-0000-000000000003';

do $$
begin
	update public.questions
	set text = 'Moderador edita texto'
	where id = 'ee000000-0000-0000-0000-0000000000b2';
	raise exception 'update should have been blocked by RLS';
exception
	when others then
		null;
end $$;

select is(
	(select text from public.questions where id = 'ee000000-0000-0000-0000-0000000000b2'),
	'Original en presence',
	'6. El Moderador no edita el texto de una pregunta ajena (su policy solo cubre outside_draw)'
);

-- 7. Sesión cerrada: el frozen_guard bloquea antes de RLS (inmutabilidad histórica).
set local request.jwt.claim.sub = 'aa000000-0000-0000-0000-000000000001';

do $$
begin
	delete from public.questions
	where id = 'ee000000-0000-0000-0000-0000000000b3';
	raise exception 'delete should have been blocked by frozen_guard';
exception
	when others then
		null;
end $$;

select is(
	(select count(*)::int from public.questions where id = 'ee000000-0000-0000-0000-0000000000b3'),
	1,
	'7. Sesión cerrada sigue inmutable (frozen_guard)'
);

-- ============================================================
-- Teardown
-- ============================================================

reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
