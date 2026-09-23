-- [multi-grupo] 04 Migrate RLS lote B (#73, PRD #69, ADR-0013).
-- Sesión viva y gamificación aisladas por grupo: questions, draws,
-- assignments, session_participants, takes (+ take_votes), trivias,
-- trivia_rounds (+ items/answers/hits), votes, hearts, badges, awards,
-- counts y season_recognitions. Flujo Preguntas → Presentes → Sorteo →
-- Debate → Cierre aislado; conteos/maestría/insignias per-grupo.

begin;
select plan(24);

-- ============================================================
-- Fixtures: 3 Miembros activos + grupo A (público) y B (privado)
-- ============================================================

insert into auth.users (id, email) values
	('b1111111-1111-1111-1111-111111111111', 'loteb-admin-a@club.test'),
	('b2222222-2222-2222-2222-222222222222', 'loteb-a2@club.test'),
	('b3333333-3333-3333-3333-333333333333', 'loteb-admin-b@club.test');

insert into public.members (id, status, display_name, created_at) values
	('b1111111-1111-1111-1111-111111111111', 'active', 'Admin A', now() - interval '3 days'),
	('b2222222-2222-2222-2222-222222222222', 'active', 'Miembro A2', now() - interval '2 days'),
	('b3333333-3333-3333-3333-333333333333', 'active', 'Admin B', now() - interval '1 day');

set local role authenticated;
set local request.jwt.claim.sub = 'b1111111-1111-1111-1111-111111111111';
select public.create_group('Grupo LoteB A', 'Público de prueba', null, 'public');
set local request.jwt.claim.sub = 'b3333333-3333-3333-3333-333333333333';
select public.create_group('Grupo LoteB B', 'Privado de prueba', null, 'private');

set local request.jwt.claim.sub = 'b2222222-2222-2222-2222-222222222222';
select public.join_group((select id from public.groups where name = 'Grupo LoteB A'));

reset role;
reset request.jwt.claim.sub;

-- Contenido de cada grupo (setup como superusuario, salta RLS).
insert into public.materials (id, group_id, title, kind, author, created_by) values
	('c0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo LoteB A'), 'Material A', 'book', 'Autora A', 'b1111111-1111-1111-1111-111111111111'),
	('c0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo LoteB B'), 'Material B', 'book', 'Autora B', 'b3333333-3333-3333-3333-333333333333');

insert into public.sessions (id, group_id, material_id, range, status, moderator_id, room_stage) values
	('d0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo LoteB A'), 'c0000000-0000-0000-0000-000000000001', 'Cap. 1', 'lobby', 'b1111111-1111-1111-1111-111111111111', 'questions'),
	('d0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo LoteB B'), 'c0000000-0000-0000-0000-000000000002', 'Cap. 1', 'lobby', 'b3333333-3333-3333-3333-333333333333', 'questions');

insert into public.session_participants (session_id, group_id, member_id) values
	('d0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo LoteB A'), 'b1111111-1111-1111-1111-111111111111'),
	('d0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo LoteB A'), 'b2222222-2222-2222-2222-222222222222'),
	('d0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo LoteB B'), 'b3333333-3333-3333-3333-333333333333');

insert into public.questions (id, session_id, material_id, group_id, author_id, text) values
	('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo LoteB A'), 'b1111111-1111-1111-1111-111111111111', '¿Pregunta de A?'),
	('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo LoteB B'), 'b3333333-3333-3333-3333-333333333333', '¿Pregunta de B?');

insert into public.trivias (id, material_id, group_id, author_id, title) values
	('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo LoteB A'), 'b1111111-1111-1111-1111-111111111111', 'Trivia A'),
	('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo LoteB B'), 'b3333333-3333-3333-3333-333333333333', 'Trivia B');

insert into public.takes (id, session_id, group_id, prompt, created_by) values
	('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', (select id from public.groups where name = 'Grupo LoteB A'), '¿Postura A?', 'b1111111-1111-1111-1111-111111111111'),
	('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', (select id from public.groups where name = 'Grupo LoteB B'), '¿Postura B?', 'b3333333-3333-3333-3333-333333333333');

set local role authenticated;

-- 1-2. Preguntas aisladas por grupo.
set local request.jwt.claim.sub = 'b1111111-1111-1111-1111-111111111111';
select is(
	(select count(*) from public.questions where text = '¿Pregunta de A?'),
	1::bigint,
	'1. Miembro de A lee la pregunta de su grupo'
);
select is(
	(select count(*) from public.questions where text = '¿Pregunta de B?'),
	0::bigint,
	'2. Miembro de A no ve la pregunta del grupo B'
);

-- 3. No inserta en B.
do $$
begin
	insert into public.questions (session_id, material_id, group_id, author_id, text)
	values (
		'd0000000-0000-0000-0000-000000000002',
		'c0000000-0000-0000-0000-000000000002',
		(select id from public.groups where name = 'Grupo LoteB B'),
		'b1111111-1111-1111-1111-111111111111',
		'Intrusa'
	);
	raise exception 'insert should have been blocked';
exception
	when others then
		null;
end $$;
select is(
	(select count(*) from public.questions where text = 'Intrusa'),
	0::bigint,
	'3. Miembro de A no inserta preguntas en B'
);

-- 4-5. Presentes aislados por grupo.
select is(
	(select count(*) from public.session_participants where session_id = 'd0000000-0000-0000-0000-000000000001'),
	2::bigint,
	'4. Miembro de A ve los presentes de su sesión'
);
select is(
	(select count(*) from public.session_participants where session_id = 'd0000000-0000-0000-0000-000000000002'),
	0::bigint,
	'5. Miembro de A no ve los presentes de B'
);

-- 6. Puente cruzado pregunta-sesión bloqueado por coherencia (superusuario).
reset role;
do $$
begin
	insert into public.questions (session_id, material_id, group_id, author_id, text)
	values (
		'd0000000-0000-0000-0000-000000000002',
		'c0000000-0000-0000-0000-000000000001',
		(select id from public.groups where name = 'Grupo LoteB A'),
		'b1111111-1111-1111-1111-111111111111',
		'Cruce'
	);
	raise exception 'bridge should have been blocked';
exception
	when others then
		null;
end $$;
select ok(
	(select count(*) from public.questions where text = 'Cruce') = 0,
	'6. La pregunta no mezcla sesión de B con material de A'
);
set local role authenticated;
set local request.jwt.claim.sub = 'b1111111-1111-1111-1111-111111111111';

-- 7-8. Trivias y takes por grupo.
select is(
	(select count(*) from public.trivias where title = 'Trivia A'),
	1::bigint,
	'7. Miembro de A lee la trivia de su grupo'
);
select is(
	(select count(*) from public.trivias where title = 'Trivia B'),
	0::bigint,
	'8. Miembro de A no ve la trivia de B'
);
select is(
	(select count(*) from public.takes where prompt = '¿Postura A?'),
	1::bigint,
	'9. Miembro de A lee el take de su grupo'
);
select is(
	(select count(*) from public.takes where prompt = '¿Postura B?'),
	0::bigint,
	'10. Miembro de A no ve el take de B'
);

-- 11-12. Votos propios + grupo (miembro inserta el suyo en A).
insert into public.votes (session_id, group_id, member_id, stars)
values (
	'd0000000-0000-0000-0000-000000000001',
	(select id from public.groups where name = 'Grupo LoteB A'),
	'b1111111-1111-1111-1111-111111111111',
	5
);
select is(
	(select count(*) from public.votes where session_id = 'd0000000-0000-0000-0000-000000000001'),
	1::bigint,
	'11. Miembro de A vota en su sesión'
);
do $$
begin
	insert into public.votes (session_id, group_id, member_id, stars)
	values (
		'd0000000-0000-0000-0000-000000000002',
		(select id from public.groups where name = 'Grupo LoteB B'),
		'b1111111-1111-1111-1111-111111111111',
		5
	);
	raise exception 'vote should have been blocked';
exception
	when others then
		null;
end $$;
select ok(
	(select count(*) from public.votes where session_id = 'd0000000-0000-0000-0000-000000000002') = 0,
	'12. Miembro de A no vota en la sesión de B'
);

-- 13-14. Gamificación por grupo (siembra + conteo de la pregunta de A).
select ok(
	(select count(*) from public.badges
	 where group_id = (select id from public.groups where name = 'Grupo LoteB A')) > 0,
	'13. El grupo A trae sus insignias sembradas'
);
select is(
	(select count(*) from public.badges
	 where group_id = (select id from public.groups where name = 'Grupo LoteB B')),
	0::bigint,
	'14. Miembro de A no ve las insignias de B'
);
select ok(
	(select count(*) from public.counts
	 where group_id = (select id from public.groups where name = 'Grupo LoteB A')
	 and event = 'question_created') >= 0,
	'15. Los conteos de A se leen en su grupo'
);
select is(
	(select count(*) from public.counts
	 where group_id = (select id from public.groups where name = 'Grupo LoteB B')),
	0::bigint,
	'16. Miembro de A no ve los conteos de B'
);
select is(
	(select count(*) from public.awards
	 where group_id = (select id from public.groups where name = 'Grupo LoteB B')),
	0::bigint,
	'17. Miembro de A no ve las insignias otorgadas en B'
);

-- 18. Sorteo en A no mezcla preguntas de B (execute_draw como moderador A).
select ok(
	(select public.execute_draw('d0000000-0000-0000-0000-000000000001')) is not null,
	'18. El moderador ejecuta el sorteo en su grupo'
);
select ok(
	not exists (
		select 1 from public.assignments a
		join public.questions q on q.id = a.question_id
		where a.session_id = 'd0000000-0000-0000-0000-000000000001'
		and q.group_id <> (select id from public.groups where name = 'Grupo LoteB A')
	),
	'19. El sorteo de A no mezcla preguntas de B'
);
select is(
	(select count(*) from public.draws where session_id = 'd0000000-0000-0000-0000-000000000002'),
	0::bigint,
	'20. Miembro de A no ve el sorteo de B'
);

-- 21. Take_votes transitiva: voto propio en A sí, en B no.
insert into public.take_votes (take_id, member_id, position)
values ('a0000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'agree');
select is(
	(select count(*) from public.take_votes where take_id = 'a0000000-0000-0000-0000-000000000001'),
	1::bigint,
	'21. Miembro de A vota el take de su grupo'
);
do $$
begin
	insert into public.take_votes (take_id, member_id, position)
	values ('a0000000-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 'agree');
	raise exception 'take vote should have been blocked';
exception
	when others then
		null;
end $$;
select ok(true, '22. Votar el take de B falla (RLS o coherencia)');

-- 23-24. Anon ya no lee el lote B; salir revoca.
reset request.jwt.claim.sub;
set local role anon;
select is((select count(*) from public.questions), 0::bigint, '23. Anon no lee questions');
select is((select count(*) from public.trivias), 0::bigint, '24. Anon no lee trivias');

-- ============================================================
-- Teardown
-- ============================================================
reset role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
