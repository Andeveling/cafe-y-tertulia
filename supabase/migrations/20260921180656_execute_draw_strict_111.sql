-- Sorteo estricto 1:1 (incidente 2026-09-21 · ADR-0008).
--
-- El matcher anterior permitía cada pregunta hasta 2 veces (`< 2`) y metía
-- al pool todas las preguntas de cada autor: con 5 personas y 5 preguntas
-- duplicó 2 preguntas y dejó 2 sin entrar. Nueva regla:
--
--   1 pregunta × 1 respondedor: cada elegible responde exactamente una
--   pregunta ajena y cada pregunta entra como máximo una vez.
--   Si un autor aportó varias, entra una al azar (no hay elección explícita
--   en el MVP). Las de espectadores, ausentes y "Fuera de sorteo" no entran.
--   Sin igualdad participantes = preguntas (mínimo 2), el sorteo falla con
--   error en vez de repartir un sorteo corrupto en silencio.

create or replace function public.execute_draw(target_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_draw uuid;
	people uuid[];
	pool_q uuid[];
	pool_a uuid[];
	shuffled uuid[];
	n_people int;
	n_pool int;
	attempt int := 0;
	i int;
	ok boolean := false;
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

	select coalesce(array_agg(sp.member_id order by sp.member_id), '{}')
	into people
	from session_participants sp
	where sp.session_id = target_session_id
		and not sp.opt_out
		and sp.role = 'member';

	n_people := coalesce(array_length(people, 1), 0);
	if n_people < 2 then
		raise exception 'Se necesitan al menos dos participantes en el Sorteo (hay %)', n_people;
	end if;

	select coalesce(array_agg(t.qid), '{}'), coalesce(array_agg(t.aid), '{}')
	into pool_q, pool_a
	from (
		select one.qid, one.aid
		from (
			select distinct on (q.author_id) q.id as qid, q.author_id as aid
			from questions q
			join session_participants sp
				on sp.session_id = q.session_id
				and sp.member_id = q.author_id
			where q.session_id = target_session_id
				and not q.outside_draw
				and not sp.opt_out
				and sp.role = 'member'
			order by q.author_id, gen_random_uuid()
		) one
		order by gen_random_uuid()
	) t;

	n_pool := coalesce(array_length(pool_q, 1), 0);
	if n_pool <> n_people then
		raise exception 'El Sorteo 1:1 necesita una pregunta sorteable por participante: % participantes, % preguntas',
			n_people, n_pool;
	end if;

	insert into draws (session_id, status)
	values (target_session_id, 'hidden')
	returning id into new_draw;

	loop
		attempt := attempt + 1;
		select array_agg(x order by gen_random_uuid())
		into shuffled
		from unnest(people) as x;
		ok := true;
		for i in 1..n_people loop
			if shuffled[i] = pool_a[i] then
				ok := false;
				exit;
			end if;
		end loop;
		exit when ok or attempt >= 100;
	end loop;

	if not ok then
		raise exception 'No se pudo generar un Sorteo sin auto-asignación tras 100 intentos';
	end if;

	insert into assignments (
		session_id, question_id, assignee_id, reveal_order, draw_id
	)
	select target_session_id, pool_q[s], shuffled[s], s, new_draw
	from generate_series(1, n_people) as s;

	return new_draw;
end;
$$;

grant execute on function public.execute_draw(uuid) to authenticated;
