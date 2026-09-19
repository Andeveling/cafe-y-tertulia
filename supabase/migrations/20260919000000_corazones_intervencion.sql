-- Ticket #53: Corazones por Intervención — aprecio anónimo 1-5 durante
-- exposición y complemento. Patrón espejo de votes/Rating: tabla efímera
-- → freeze agrega avg+count en assignments → DELETE individuales
-- (privacidad por eliminación, ADR 0003).

-- ============================================================
-- 1. Tabla hearts (efímera, como votes)
-- ============================================================

create table public.hearts (
  assignment_id  uuid not null references public.assignments (id) on delete cascade,
  member_id      uuid not null references public.members (id) on delete cascade,
  phase          public.assignment_state not null check (phase in ('exposition', 'complement')),
  value          int not null check (value between 1 and 5),
  session_id     uuid not null,
  primary key (assignment_id, member_id, phase)
);

create index hearts_assignment_phase_idx on public.hearts (assignment_id, phase);
create index hearts_session_idx on public.hearts (session_id);

alter table public.hearts enable row level security;

-- RLS: solo el propio voto (mismo patrón que votes)
create policy "hearts_select_own" on public.hearts
  for select to authenticated
  using (public.is_member() and member_id = auth.uid());

create policy "hearts_insert_own" on public.hearts
  for insert to authenticated
  with check (public.is_member() and member_id = auth.uid());

create policy "hearts_update_own" on public.hearts
  for update to authenticated
  using (public.is_member() and member_id = auth.uid())
  with check (public.is_member() and member_id = auth.uid());

-- Frozen guard: bloquea mutaciones en sesión cerrada/histórico
create trigger hearts_frozen_guard
  before insert or update or delete on public.hearts
  for each row execute function public.session_child_frozen_guard();

-- ============================================================
-- 1b. Ampliar session_child_frozen_guard para hearts
-- ============================================================

create or replace function public.session_child_frozen_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  sess_status public.session_status;
  sess_id uuid;
begin
  if TG_TABLE_NAME = 'questions' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'draws' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'session_participants' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'takes' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'trivia_rounds' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'votes' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'hearts' then
    sess_id := coalesce(new.session_id, old.session_id);
  elsif TG_TABLE_NAME = 'take_votes' then
    if TG_OP = 'DELETE' then
      select session_id into sess_id from public.takes where id = old.take_id;
    else
      select session_id into sess_id from public.takes where id = new.take_id;
    end if;
  elsif TG_TABLE_NAME = 'trivia_answers' then
    if TG_OP = 'DELETE' then
      select session_id into sess_id from public.trivia_rounds where id = old.round_id;
    else
      select session_id into sess_id from public.trivia_rounds where id = new.round_id;
    end if;
  else
    sess_id := null;
  end if;

  if sess_id is not null then
    select status into sess_status from public.sessions where id = sess_id;
    if sess_status in ('closed', 'archived') then
      if sess_status = 'archived' then
        raise exception 'La sesión en histórico es inmutable (%)', TG_TABLE_NAME using errcode='P0001';
      else
        raise exception 'No se puede modificar % en sesión cerrada', TG_TABLE_NAME using errcode='P0001';
      end if;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

-- ============================================================
-- 2. Columnas Aprecio en assignments (agregado congelado)
-- ============================================================

alter table public.assignments
  add column aprecio_exposition_avg   numeric(2,1)
    check (aprecio_exposition_avg is null or aprecio_exposition_avg between 1 and 5),
  add column aprecio_exposition_count int not null default 0
    check (aprecio_exposition_count >= 0),
  add column aprecio_complement_avg   numeric(2,1)
    check (aprecio_complement_avg is null or aprecio_complement_avg between 1 and 5),
  add column aprecio_complement_count int not null default 0
    check (aprecio_complement_count >= 0);

-- ============================================================
-- 3. RPC cast_heart: votar corazón con anti auto-voto
-- ============================================================

create or replace function public.cast_heart(
  target_assignment_id uuid,
  p_phase public.assignment_state,
  p_value int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a_rec record;
  sess_id uuid;
  question_author_id uuid;
begin
  if not public.is_member() then raise exception 'Solo miembros'; end if;
  if p_phase not in ('exposition', 'complement') then
    raise exception 'Fase inválida para corazones';
  end if;
  if p_value < 1 or p_value > 5 then raise exception 'Valor 1-5'; end if;

  -- La asignación debe estar en la fase indicada
  select a.id, a.session_id, a.assignee_id, a.question_id, a.state
  into a_rec
  from assignments a
  where a.id = target_assignment_id and a.state = p_phase;

  if not found then
    raise exception 'La intervención no está en esa fase';
  end if;

  sess_id := a_rec.session_id;

  -- Sesión debe estar en curso
  if not exists (
    select 1 from sessions
    where id = sess_id and status = 'in_progress'
  ) then
    raise exception 'Sesión no en curso';
  end if;

  -- Participante presente (member o spectator)
  if not exists (
    select 1 from session_participants sp
    where sp.session_id = sess_id
      and sp.member_id = auth.uid()
  ) then
    raise exception 'Solo participantes presentes';
  end if;

  -- Anti auto-voto: exposición → excluir asignado
  if p_phase = 'exposition' and a_rec.assignee_id = auth.uid() then
    raise exception 'No puedes votar en tu propia exposición';
  end if;

  -- Anti auto-voto: complemento → excluir autor de la pregunta
  if p_phase = 'complement' then
    select q.author_id into question_author_id
    from questions q where q.id = a_rec.question_id;

    if question_author_id = auth.uid() then
      raise exception 'No puedes votar en tu propio complemento';
    end if;
  end if;

  -- Upsert: un corazón por votante por fase por intervención
  insert into hearts (assignment_id, member_id, phase, value, session_id)
  values (target_assignment_id, auth.uid(), p_phase, p_value, sess_id)
  on conflict (assignment_id, member_id, phase)
  do update set value = excluded.value;
end;
$$;

grant execute on function public.cast_heart(uuid, public.assignment_state, int)
  to authenticated;
revoke all on function public.cast_heart(uuid, public.assignment_state, int)
  from public;

-- ============================================================
-- 4. RPC freeze_hearts: agregar + borrar individuales
-- ============================================================

create or replace function public.freeze_hearts(
  target_assignment_id uuid,
  p_phase public.assignment_state
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  avg_v numeric(2,1);
  cnt int;
  sum_v numeric;
begin
  select count(*), coalesce(sum(value), 0)
  into cnt, sum_v
  from hearts
  where assignment_id = target_assignment_id and phase = p_phase;

  if cnt = 0 then
    avg_v := null;
  else
    avg_v := round(sum_v / cnt, 1);
  end if;

  if p_phase = 'exposition' then
    update assignments
    set aprecio_exposition_avg = avg_v,
        aprecio_exposition_count = cnt
    where id = target_assignment_id;
  elsif p_phase = 'complement' then
    update assignments
    set aprecio_complement_avg = avg_v,
        aprecio_complement_count = cnt
    where id = target_assignment_id;
  end if;

  -- Privacidad por eliminación: solo persiste el agregado
  delete from hearts
  where assignment_id = target_assignment_id and phase = p_phase;
end;
$$;

grant execute on function public.freeze_hearts(uuid, public.assignment_state)
  to authenticated;
revoke all on function public.freeze_hearts(uuid, public.assignment_state)
  from public;

-- ============================================================
-- 5. Modificar advance_intervention: freeze antes de transición
-- ============================================================

create or replace function public.advance_intervention(target_session_id uuid)
returns public.assignment_state
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
  nxt public.assignment_state;
  author_here boolean;
  last_for_q boolean;
begin
  if not exists (
    select 1 from sessions
    where id = target_session_id
      and moderator_id = auth.uid()
      and status = 'in_progress'
  ) then
    raise exception 'Solo el Moderador puede avanzar en en_curso';
  end if;

  select a.* into cur
  from assignments a
  where a.session_id = target_session_id
    and a.state in ('exposition', 'complement')
  order by a.reveal_order
  limit 1;

  if not found then
    raise exception 'No hay Intervención activa';
  end if;

  select exists (
    select 1 from session_participants sp
    join questions q on q.id = cur.question_id
    where sp.session_id = target_session_id
      and sp.member_id = q.author_id
  ) into author_here;

  select not exists (
    select 1 from assignments a2
    where a2.session_id = target_session_id
      and a2.question_id = cur.question_id
      and a2.id <> cur.id
      and a2.state <> 'complete'
  ) into last_for_q;

  if cur.state = 'exposition' then
    -- Congelar corazones de exposición antes de salir
    perform public.freeze_hearts(cur.id, 'exposition');

    if author_here and last_for_q then
      nxt := 'complement';
    else
      nxt := 'complete';
    end if;
  elsif cur.state = 'complement' then
    -- Congelar corazones de complemento antes de salir
    perform public.freeze_hearts(cur.id, 'complement');

    nxt := 'complete';
  else
    raise exception 'Estado no avanzable';
  end if;

  update assignments set state = nxt where id = cur.id;

  if nxt = 'complete' and not exists (
    select 1 from assignments a2
    where a2.session_id = target_session_id
      and a2.state <> 'complete'
  ) then
    update draws set status = 'revealed'
    where session_id = target_session_id and status <> 'revealed';
    update sessions set room_stage = 'cierre'
    where id = target_session_id and room_stage = 'debate';
  end if;

  return nxt;
end;
$$;

grant execute on function public.advance_intervention(uuid) to authenticated;

-- ============================================================
-- 6. Ampliar room_snapshot: hearts + aprecio en asignaciones
-- ============================================================

CREATE OR REPLACE FUNCTION public.room_snapshot(target_session_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
	sess record;
	my_id uuid := auth.uid();
	participants_json json;
	questions_json json;
	draw_json json;
	readiness_json json;
	assignments_json json;
	debate_json json;
	cierre_json json;
	active record;
	nxt record;
	qtext text;
	aname text;
	assignee text;
	author text;
	my_notes text;
	hearts_json json;
	eligible_count int;
	question_author_id uuid;
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

	select coalesce(json_agg(p.item order by p.item->>'display_name'), '[]'::json)
	into participants_json
	from (
		select json_build_object(
			'member_id', sp.member_id,
			'display_name', coalesce(m.display_name, 'Miembro'),
			'role', sp.role,
			'opt_out', sp.opt_out
		) as item
		from session_participants sp
		join members m on m.id = sp.member_id
		where sp.session_id = target_session_id
	) p;

	select coalesce(json_agg(q.item order by q.item->>'created_at'), '[]'::json)
	into questions_json
	from (
		select json_build_object(
			'id', q.id,
			'author_id', q.author_id,
			'author_name', coalesce(m.display_name, 'Miembro'),
			'text', case
				when q.author_id = my_id then q.text
				else null
			end,
			'is_mine', (q.author_id = my_id),
			'outside_draw', q.outside_draw,
			'created_at', q.created_at
		) as item
		from questions q
		join members m on m.id = q.author_id
		where q.session_id = target_session_id
	) q;

	select json_build_object(
		'total', coalesce(members_total.cnt, 0),
		'ready', coalesce(ready_cnt.cnt, 0),
		'all_ready', (
			coalesce(members_total.cnt, 0) > 0
			and coalesce(ready_cnt.cnt, 0) >= coalesce(members_total.cnt, 0)
		)
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

	select json_build_object(
		'done', exists (select 1 from draws d where d.session_id = target_session_id),
		'status', (select d.status from draws d where d.session_id = target_session_id),
		'created_at', (select d.created_at from draws d where d.session_id = target_session_id)
	)
	into draw_json;

	-- Asignaciones: incluye columnas aprecio
	select coalesce(json_agg(a.item order by (a.item->>'reveal_order')::int), '[]'::json)
	into assignments_json
	from (
		select json_build_object(
			'assignment_id', a.id,
			'question_id', a.question_id,
			'author_id', q.author_id,
			'assignee_id', a.assignee_id,
			'author_name', m_author.display_name,
			'assignee_name', m_assignee.display_name,
			'state', a.state,
			'reveal_order', a.reveal_order,
			'question_text',
				case
					when a.state <> 'hidden' then q.text
					when q.author_id = my_id then q.text
					else null
				end,
			'question_visible',
				(a.state <> 'hidden' or q.author_id = my_id),
			'aprecio_exposition_avg', a.aprecio_exposition_avg,
			'aprecio_exposition_count', a.aprecio_exposition_count,
			'aprecio_complement_avg', a.aprecio_complement_avg,
			'aprecio_complement_count', a.aprecio_complement_count
		) as item
		from assignments a
		join questions q on q.id = a.question_id
		join members m_author on m_author.id = q.author_id
		join members m_assignee on m_assignee.id = a.assignee_id
		where a.session_id = target_session_id
	) a;

	if sess.room_stage = 'debate' then
		select a.id, a.state, a.reveal_order, a.question_id, a.assignee_id, a.notes, a.phase_started_at
		into active
		from assignments a
		where a.session_id = target_session_id
			and a.state in ('exposition', 'complement')
		order by a.reveal_order
		limit 1;

		if found then
			select q.text, m.display_name, ma.display_name
			into qtext, author, assignee
			from questions q
			join members m on m.id = q.author_id
			join members ma on ma.id = active.assignee_id
			where q.id = active.question_id;

			if active.assignee_id = my_id then
				my_notes := active.notes;
			end if;

			-- Hearts: progreso de la fase activa
			if active.state in ('exposition', 'complement') then
				if active.state = 'exposition' then
					-- Todos menos el asignado
					select count(*)::int into eligible_count
					from session_participants sp
					where sp.session_id = target_session_id
					  and sp.member_id <> active.assignee_id;
				else
					-- Complemento: todos menos el autor
					select q.author_id into question_author_id
					from questions q where q.id = active.question_id;

					select count(*)::int into eligible_count
					from session_participants sp
					where sp.session_id = target_session_id
					  and sp.member_id <> question_author_id;
				end if;

				hearts_json := json_build_object(
					'my_heart', (
						select h.value from hearts h
						where h.assignment_id = active.id
						  and h.member_id = my_id
						  and h.phase = active.state
					),
					'voted', (
						select count(*)::int from hearts h
						where h.assignment_id = active.id
						  and h.phase = active.state
					),
					'eligible', eligible_count
				);
			else
				hearts_json := null;
			end if;

			debate_json := json_build_object(
				'mode', 'active',
				'assignmentId', active.id,
				'state', active.state,
				'questionText', qtext,
				'assigneeName', assignee,
				'assigneeId', active.assignee_id,
				'authorName', author,
				'revealOrder', active.reveal_order,
				'myNotes', my_notes,
				'phaseStartedAt', active.phase_started_at,
				'hearts', hearts_json,
				'remainingHidden', (
					select count(*)::int from assignments
					where session_id = target_session_id and state = 'hidden'
				)
			);
		else
			select a.id, a.assignee_id, a.reveal_order
			into nxt
			from assignments a
			where a.session_id = target_session_id
				and a.state = 'hidden'
			order by a.reveal_order
			limit 1;

			if found then
				select m.display_name into assignee
				from members m where m.id = nxt.assignee_id;

				debate_json := json_build_object(
					'mode', 'waiting_reveal',
					'nextAssigneeName', assignee,
					'nextAssigneeId', nxt.assignee_id,
					'revealOrder', nxt.reveal_order,
					'remainingHidden', (
						select count(*)::int from assignments
						where session_id = target_session_id and state = 'hidden'
					)
				);
			else
				debate_json := json_build_object(
					'mode', 'done',
					'remainingHidden', 0
				);
			end if;
		end if;
	else
		debate_json := null;
	end if;

	if sess.room_stage = 'cierre' then
		cierre_json := json_build_object(
			'open_trivia', (
				select count(*)::int from trivia_rounds
				where session_id = target_session_id and status = 'live'
			),
			'open_takes', (
				select count(*)::int from takes
				where session_id = target_session_id and status = 'open'
			)
		);
	else
		cierre_json := null;
	end if;

	return json_build_object(
		'session_id', sess.id,
		'material_id', sess.material_id,
		'range', sess.range,
		'status', sess.status,
		'moderator_id', sess.moderator_id,
		'room_stage', sess.room_stage,
		'participants', participants_json,
		'questions', questions_json,
		'readiness', readiness_json,
		'draw', draw_json,
		'assignments', assignments_json,
		'debate', debate_json,
		'cierre', cierre_json
	);
end;
$function$
;

-- ============================================================
-- 7. Realtime: hearts publicada + REPLICA IDENTITY FULL
-- ============================================================

alter table public.hearts replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'hearts'
  ) then
    alter publication supabase_realtime add table public.hearts;
  end if;
end $$;
