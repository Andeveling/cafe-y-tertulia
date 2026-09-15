-- execute_draw autorizaba solo status=lobby. Tras pasar por Debate la Sala
-- queda in_progress; Volver a Sorteo deja room_stage=draw y el Moderador
-- ve Sortear, pero el RPC respondía "Solo el Moderador puede…".
-- Gate: Moderador + Sala abierta + etapa Sorteo.

create or replace function public.execute_draw(target_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_draw uuid;
	person uuid;
	pick uuid;
begin
	if not exists (
		select 1 from sessions
		where id = target_session_id
			and moderator_id = auth.uid()
			and status in ('lobby', 'in_progress')
	) then
		raise exception 'Solo el Moderador puede ejecutar el Sorteo';
	end if;

	if not exists (
		select 1 from sessions
		where id = target_session_id
			and room_stage = 'draw'
	) then
		raise exception 'El Sorteo se ejecuta en la etapa Sorteo';
	end if;

	if exists (select 1 from draws where session_id = target_session_id) then
		raise exception 'El Sorteo solo puede ejecutarse una vez';
	end if;

	if not exists (
		select 1 from session_participants sp
		where sp.session_id = target_session_id
			and sp.role = 'member'
	) then
		raise exception 'Se necesita al menos un participante para el sorteo';
	end if;

	if not exists (
		select 1 from questions q
		where q.session_id = target_session_id
			and not q.outside_draw
	) then
		raise exception 'Se necesita al menos una pregunta para el sorteo';
	end if;

	insert into draws (session_id, status)
	values (target_session_id, 'hidden')
	returning id into new_draw;

	create temporary table _draw_pairs (
		question_id uuid not null,
		assignee_id uuid not null
	) on commit drop;

	for person in
		select sp.member_id
		from session_participants sp
		where sp.session_id = target_session_id
			and not sp.opt_out
			and sp.role = 'member'
		order by gen_random_uuid()
	loop
		pick := null;
		select q.id into pick
		from questions q
		where q.session_id = target_session_id
			and not q.outside_draw
			and q.author_id is distinct from person
			and (
				select count(*) from _draw_pairs p where p.question_id = q.id
			) < 2
		order by gen_random_uuid()
		limit 1;

		if pick is not null then
			insert into _draw_pairs (question_id, assignee_id)
			values (pick, person);
		end if;
	end loop;

	insert into assignments (
		session_id, question_id, assignee_id, reveal_order, draw_id
	)
	select
		target_session_id,
		question_id,
		assignee_id,
		row_number() over (order by gen_random_uuid()),
		new_draw
	from _draw_pairs;

	return new_draw;
end;
$$;

grant execute on function public.execute_draw(uuid) to authenticated;
