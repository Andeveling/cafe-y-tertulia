-- Ticket #27: Rol Espectador en participantes (SPEC §2.6-2.7 · ADR 0001).
-- El Moderador agrega Espectadores al lobby: presentes pero sin Sorteo ni Listos.

-- 1. Tipo enum para el rol del participante.
create type public.participant_role as enum ('member', 'spectator');

-- 2. Expand: nueva columna role convive con opt_out (participantes existentes = member).
alter table public.session_participants
	add column role public.participant_role not null default 'member';

comment on column public.session_participants.role is
	'Rol del participante: member (default, conserva comportamiento) o spectator (presente, sin Sorteo ni Listos).';

-- 3. RPC: el Moderador agrega o quita un Espectador en lobby.
create or replace function public.set_spectator(
	target_session_id uuid,
	target_member_id uuid,
	make_spectator boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	-- Solo el Moderador de la sesión en lobby puede cambiar roles.
	if not exists (
		select 1 from sessions
		where id = target_session_id
			and moderator_id = auth.uid()
			and status = 'lobby'
	) then
		raise exception 'Solo el Moderador puede gestionar Espectadores en el lobby';
	end if;

	-- El miembro objetivo debe existir en el club.
	if not exists (select 1 from members where id = target_member_id and status = 'active') then
		raise exception 'El miembro no existe o no está activo';
	end if;

	if make_spectator then
		-- Upsert: inserta como espectador o actualiza si ya existe.
		insert into session_participants (session_id, member_id, role)
		values (target_session_id, target_member_id, 'spectator')
		on conflict (session_id, member_id)
		do update set role = 'spectator';
	else
		-- Quitar espectador: si existe como spectator, lo elimina.
		-- Si es member normal, no hace nada (no se quita un member por esta vía).
		delete from session_participants
		where session_id = target_session_id
			and member_id = target_member_id
			and role = 'spectator';
	end if;
end;
$$;

grant execute on function public.set_spectator(uuid, uuid, boolean) to authenticated;

-- 4. execute_draw: excluir espectadores (además de opt_out).
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
		where sp.session_id = target_session_id
			and not sp.opt_out
			and sp.role = 'member'  -- Excluir espectadores
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

-- 5. draw_lobby_summary: excluir espectadores de assignedCount y unassignedNames.
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
				and sp.role = 'member'  -- Excluir espectadores
				and not exists (
					select 1 from assignments a
					where a.session_id = target_session_id
						and a.assignee_id = sp.member_id
				)
		), '[]'::json)
	);
$$;

grant execute on function public.draw_lobby_summary(uuid) to authenticated;
