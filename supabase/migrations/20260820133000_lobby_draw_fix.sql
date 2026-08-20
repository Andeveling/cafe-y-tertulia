-- Ticket #16: matching correcto (máx. 2/pregunta, sin autoría) + RLS de oculto.

drop policy if exists "draws_select_after_reveal" on public.draws;
drop policy if exists "assignments_select_after_reveal" on public.assignments;

-- El Moderador necesita saber si el Sorteo ya corrió; el contenido sigue oculto.
create policy "draws_select_member" on public.draws
	for select to authenticated using (public.is_member());

-- Solo Asignaciones ya sacadas del estado `hidden` (revelación una a una).
create policy "assignments_select_revealed" on public.assignments
	for select to authenticated using (
		public.is_member() and state <> 'hidden'
	);

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
	ord int := 0;
begin
	if not exists (
		select 1 from sessions
		where id = target_session_id
			and moderator_id = auth.uid()
			and status = 'lobby'
	) then
		raise exception 'Solo el Moderador puede ejecutar el Sorteo en el lobby';
	end if;

	if exists (select 1 from draws where session_id = target_session_id) then
		raise exception 'El Sorteo solo puede ejecutarse una vez';
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
		where sp.session_id = target_session_id and not sp.opt_out
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

-- Resumen sin contenido: quién quedó sin Asignación (ADR 0001 sobrantes).
create or replace function public.draw_lobby_summary(target_session_id uuid)
returns json
language sql
security definer
set search_path = public
stable
as $$
	select json_build_object(
		'drawDone', exists (select 1 from draws d where d.session_id = target_session_id),
		'assignedCount', (
			select count(*)::int from assignments a where a.session_id = target_session_id
		),
		'unassignedNames', coalesce((
			select json_agg(m.display_name order by m.display_name)
			from session_participants sp
			join members m on m.id = sp.member_id
			where sp.session_id = target_session_id
				and not sp.opt_out
				and not exists (
					select 1 from assignments a
					where a.session_id = target_session_id
						and a.assignee_id = sp.member_id
				)
		), '[]'::json)
	);
$$;

grant execute on function public.draw_lobby_summary(uuid) to authenticated;

grant delete on public.session_participants to authenticated;

drop policy if exists "participants_delete_self" on public.session_participants;
create policy "participants_delete_self" on public.session_participants
	for delete to authenticated using (member_id = auth.uid());
