-- Ticket #29: Sala v1 — ruta única realtime (Preguntas, Presentes, Sorteo).
-- Agrega room_stage a sessions para que el Moderador avance las etapas de la
-- Sala dentro del lobby, y un RPC room_snapshot que devuelve todo lo que la
-- UI necesita en una sola llamada.

-- ============================================================
-- 1. Enum room_stage + columna en sessions
-- ============================================================

do $$
begin
	create type public.room_stage as enum ('questions', 'presence', 'draw');
exception when duplicate_object then null;
end $$;

do $$
begin
	alter table public.sessions
		add column room_stage public.room_stage not null default 'questions';
exception when duplicate_column then null;
end $$;

comment on column public.sessions.room_stage is
	'Etapa activa de la Sala dentro del lobby: questions → presence → draw (ticket #29).';

-- ============================================================
-- 2. RPC advance_room_stage: Moderador avanza etapas
-- ============================================================

create or replace function public.advance_room_stage(
	target_session_id uuid,
	new_stage public.room_stage
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	current_stage public.room_stage;
begin
	-- Solo el Moderador de una sesión en lobby puede avanzar.
	if not exists (
		select 1 from sessions
		where id = target_session_id
			and moderator_id = auth.uid()
			and status = 'lobby'
	) then
		raise exception 'Solo el Moderador puede avanzar etapas de la Sala';
	end if;

	select room_stage into current_stage
	from sessions where id = target_session_id;

	-- Solo avance lineal: questions → presence → draw.
	if (current_stage = 'questions' and new_stage not in ('presence', 'draw'))
		or (current_stage = 'presence' and new_stage <> 'draw')
		or (current_stage = 'draw')
	then
		raise exception 'Avance de etapa inválido: % → %', current_stage, new_stage;
	end if;

	-- Para avanzar a draw, todos los members (no spectators) deben estar listos.
	if new_stage = 'draw' then
		if exists (
			select 1 from session_participants sp
			where sp.session_id = target_session_id
				and sp.role = 'member'
				and (
					-- No está presente (no hay fila o no debería existir,
					-- pero por consistencia verificamos que existe)
					not exists (
						select 1 from session_participants sp2
						where sp2.session_id = target_session_id
							and sp2.member_id = sp.member_id
					)
					-- No tiene preguntas
					or not exists (
						select 1 from questions q
						where q.session_id = target_session_id
							and q.author_id = sp.member_id
					)
				)
		) then
			raise exception 'No todos los participantes están Listos';
		end if;
	end if;

	update sessions set room_stage = new_stage where id = target_session_id;
end;
$$;

grant execute on function public.advance_room_stage(uuid, public.room_stage) to authenticated;

-- ============================================================
-- 3. RPC room_snapshot: toda la info de la Sala en una llamada
-- ============================================================

create or replace function public.room_snapshot(target_session_id uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
	sess record;
	my_id uuid := auth.uid();
	participants_json json;
	questions_json json;
	draw_json json;
	readiness_json json;
	assignments_json json;
begin
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	select s.id, s.material_id, s.range, s.status, s.moderator_id, s.room_stage
	into sess
	from sessions s
	where s.id = target_session_id;

	if not found then
		return null;
	end if;

	-- Participantes con displayName, role, optOut
	select coalesce(json_agg(p order by p->>'displayName'), '[]'::json)
	into participants_json
	from (
		select json_build_object(
			'memberId', sp.member_id,
			'displayName', coalesce(m.display_name, 'Miembro'),
			'role', sp.role,
			'optOut', sp.opt_out
		) as json
		from session_participants sp
		join members m on m.id = sp.member_id
		where sp.session_id = target_session_id
	) p;

	-- Preguntas con visibilidad-aware: autor ve texto, otros solo ven estado
	select coalesce(json_agg(q order by q->>'createdAt'), '[]'::json)
	into questions_json
	from (
		select json_build_object(
			'id', q.id,
			'authorId', q.author_id,
			'authorName', coalesce(m.display_name, 'Miembro'),
			'text', case
				when q.author_id = my_id then q.text
				else null
			end,
			'isMine', (q.author_id = my_id),
			'outsideDraw', q.outside_draw,
			'createdAt', q.created_at
		) as json
		from questions q
		join members m on m.id = q.author_id
		where q.session_id = target_session_id
	) q;

	-- Readiness: members (no spectators) que tienen ≥1 pregunta
	-- "Listos" = presente + ≥1 Pregunta; spectators no cuentan.
	select json_build_object(
		'total', coalesce(members_total.cnt, 0),
		'ready', coalesce(ready_cnt.cnt, 0),
		'allReady', (coalesce(ready_cnt.cnt, 0) >= coalesce(members_total.cnt, 1))
	)
	into readiness_json
	from
		(select count(*)::int as cnt
		 from session_participants sp
		 where sp.session_id = target_session_id
		   and sp.role = 'member') as members_total,
		(select count(*)::int as cnt
		 from session_participants sp
		 where sp.session_id = target_session_id
		   and sp.role = 'member'
		   and exists (
			   select 1 from questions q
			   where q.session_id = target_session_id
			     and q.author_id = sp.member_id
		   )) as ready_cnt;

	-- Draw: estado del sorteo
	select json_build_object(
		'done', exists (select 1 from draws d where d.session_id = target_session_id),
		'status', (select d.status from draws d where d.session_id = target_session_id)
	)
	into draw_json;

	-- Asignaciones post-sorteo (si existe)
	select coalesce(json_agg(a order by (a->>'revealOrder')::int), '[]'::json)
	into assignments_json
	from (
		select json_build_object(
			'assignmentId', a.id,
			'questionId', a.question_id,
			'authorName', m_author.display_name,
			'assigneeName', m_assignee.display_name,
			'state', a.state,
			'revealOrder', a.reveal_order,
			'questionText',
				case
					when a.state <> 'hidden' then q.text
					when q.author_id = my_id then q.text
					else null
				end,
			'questionVisible',
				(a.state <> 'hidden' or q.author_id = my_id)
		) as json
		from assignments a
		join questions q on q.id = a.question_id
		join members m_author on m_author.id = q.author_id
		join members m_assignee on m_assignee.id = a.assignee_id
		where a.session_id = target_session_id
	) a;

	return json_build_object(
		'sessionId', sess.id,
		'materialId', sess.material_id,
		'range', sess.range,
		'status', sess.status,
		'moderatorId', sess.moderator_id,
		'roomStage', sess.room_stage,
		'participants', participants_json,
		'questions', questions_json,
		'readiness', readiness_json,
		'draw', draw_json,
		'assignments', assignments_json
	);
end;
$$;

grant execute on function public.room_snapshot(uuid) to authenticated;
revoke all on function public.room_snapshot(uuid), public.advance_room_stage(uuid, public.room_stage) from public;
