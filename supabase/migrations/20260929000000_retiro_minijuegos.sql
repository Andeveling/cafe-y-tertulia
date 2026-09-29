-- Retiro definitivo de Minijuegos (Trivia + Takes), issue #85.
-- Las Sesiones existen para debatir en la Sala; Trivia y Takes quedaron sin
-- uso y su mantenimiento (tablas, RPCs, políticas, triggers, realtime y UI)
-- se retira en un solo corte. Sorteo, Rating y Aprecio quedan intactos.
--
-- DROP directo sin exportación: la nube vinculada confirma cero filas en las
-- siete tablas.

-- ============================================================
-- 1. Hito colectivo de trivia: evaluador + trigger.
-- ============================================================

drop trigger if exists trivia_round_closed_hitos on public.trivia_rounds;
drop function if exists public.on_trivia_round_closed_hitos() cascade;
drop function if exists public.check_triviantes(uuid) cascade;

-- ============================================================
-- 2. RPCs de minijuegos.
-- ============================================================

drop function if exists public.create_trivia_with_items(uuid, text, jsonb) cascade;
drop function if exists public.start_trivia_round(uuid, uuid) cascade;
drop function if exists public.answer_trivia(uuid, int) cascade;
drop function if exists public.answer_trivia(uuid, integer) cascade;
drop function if exists public.lock_trivia_question(uuid) cascade;
drop function if exists public.next_trivia_question(uuid) cascade;
drop function if exists public.finish_trivia_round(uuid) cascade;
drop function if exists public.trivia_round_snapshot(uuid) cascade;
drop function if exists public.session_minigame_state(uuid) cascade;
drop function if exists public.start_take(uuid, text) cascade;
drop function if exists public.vote_take(uuid, public.take_position) cascade;
drop function if exists public.close_take(uuid) cascade;

-- ============================================================
-- 3. Realtime: la Sala ya no se suscribe a minijuegos.
-- ============================================================

do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'trivia_rounds'
  ) then
    execute 'alter publication supabase_realtime drop table public.trivia_rounds';
  end if;
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'takes'
  ) then
    execute 'alter publication supabase_realtime drop table public.takes';
  end if;
end $$;

-- ============================================================
-- 4. Frozen guards de hijas para minijuegos + coherencias de grupo.
-- ============================================================

drop trigger if exists takes_frozen_guard on public.takes;
drop trigger if exists trivia_rounds_frozen_guard on public.trivia_rounds;
drop trigger if exists take_votes_frozen_guard on public.take_votes;
drop trigger if exists trivia_answers_frozen_guard on public.trivia_answers;

drop trigger if exists groups_freeze_group on public.takes;
drop trigger if exists groups_freeze_group on public.trivia_rounds;
drop trigger if exists groups_freeze_group on public.trivias;

drop trigger if exists takes_group_coherence on public.takes;
drop trigger if exists trivia_rounds_group_coherence on public.trivia_rounds;
drop trigger if exists trivias_group_coherence on public.trivias;
drop trigger if exists take_votes_group_coherence on public.take_votes;
drop trigger if exists trivia_items_group_coherence on public.trivia_items;
drop trigger if exists trivia_answers_group_coherence on public.trivia_answers;
drop trigger if exists trivia_hits_group_coherence on public.trivia_hits;

drop function if exists public.takes_group_coherence() cascade;
drop function if exists public.trivia_rounds_group_coherence() cascade;
drop function if exists public.trivias_group_coherence() cascade;
drop function if exists public.take_votes_group_coherence() cascade;
drop function if exists public.trivia_items_group_coherence() cascade;
drop function if exists public.trivia_answers_group_coherence() cascade;
drop function if exists public.trivia_hits_group_coherence() cascade;

-- ============================================================
-- 5. session_child_frozen_guard: sin ramas de minijuegos.
--    Solo Preguntas y Notas quedan con corrección de misclicks;
--    el resto (sorteo, votos, presencia) sigue inmutable en
--    cerrada e histórico.
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
  elsif TG_TABLE_NAME = 'votes' then
    sess_id := coalesce(new.session_id, old.session_id);
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
-- 6. Cierre atómico: ya no bloquea por trivia en curso ni
--    votación abierta. Mantiene Sorteo revelado, congelamiento
--    de Rating e inmutabilidad de cerrada e Histórico.
-- ============================================================

create or replace function public.close_session(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
  avg_v numeric(2,1);
  cnt int;
  sum_v numeric;
  n int;
begin
  if not exists (
    select 1 from sessions
    where id = target_session_id
      and status = 'in_progress'
      and moderator_id = auth.uid()
  ) then
    raise exception 'Solo el moderador puede cerrar una sesión en curso'
      using errcode = 'P0001';
  end if;

  select material_id into mid from sessions where id = target_session_id;

  select count(*) into n from draws
  where session_id = target_session_id and status <> 'revealed';
  if n > 0 then
    raise exception 'Revela primero el Sorteo';
  end if;

  if exists (select 1 from sessions where id = target_session_id and rating_open) then
    select count(*), coalesce(sum(stars), 0)
    into cnt, sum_v
    from votes where session_id = target_session_id;

    if cnt = 0 then
      avg_v := null;
    else
      avg_v := round(sum_v / cnt, 1);
    end if;

    update sessions
    set rating_open = false, rating_avg = avg_v, rating_count = cnt
    where id = target_session_id;

    delete from votes where session_id = target_session_id;

    if mid is not null then
      perform public.refresh_material_rating(mid);
    end if;
  end if;

  update sessions set status = 'closed' where id = target_session_id;

  select rating_avg, rating_count into avg_v, cnt
  from sessions where id = target_session_id;
  return jsonb_build_object('rating_avg', avg_v, 'rating_count', cnt);
end;
$$;

-- ============================================================
-- 7. Histórico: sin rondas de trivia ni takes.
-- ============================================================

create or replace function get_session_history(target_session_id uuid)
returns jsonb
language sql
stable
security definer
as $$
  select jsonb_build_object(
    'id',         s.id,
    'range',      s.range,
    'status',     s.status,
    'scheduled_at', s.scheduled_at,
    'created_at', s.created_at,
    'rating_avg', s.rating_avg,
    'rating_count', s.rating_count,

    'material', (
      select jsonb_build_object(
        'id', m.id, 'title', m.title, 'kind', m.kind,
        'author', m.author, 'status', m.status,
        'rating_avg', m.rating_avg, 'rating_count', m.rating_count
      )
      from materials m where m.id = s.material_id
    ),

    'participants', coalesce((
      select jsonb_agg(jsonb_build_object(
        'member_id', sp.member_id,
        'display_name', coalesce(mem.display_name, 'Miembro del club'),
        'opt_out', sp.opt_out
      ) order by mem.display_name)
      from session_participants sp
      left join members mem on mem.id = sp.member_id
      where sp.session_id = s.id
    ), '[]'::jsonb),

    'questions', coalesce((
      select jsonb_agg(q.obj order by (q.obj->>'created_at'))
      from (
        select jsonb_build_object(
          'id', q.id,
          'text', q.text,
          'created_at', q.created_at,
          'author', coalesce(aut.display_name, 'Miembro del club'),
          'assignment', case
            when a.id is not null then jsonb_build_object(
              'id', a.id,
              'assignee', coalesce(asg.display_name, 'Miembro del club'),
              'state', a.state,
              'notes', a.notes,
              'aprecio_exposition_avg', a.aprecio_exposition_avg,
              'aprecio_exposition_count', a.aprecio_exposition_count,
              'aprecio_complement_avg', a.aprecio_complement_avg,
              'aprecio_complement_count', a.aprecio_complement_count
            )
            else null
          end
        ) as obj
        from questions q
        left join members aut on aut.id = q.author_id
        left join assignments a on a.question_id = q.id and a.session_id = s.id
        left join members asg on asg.id = a.assignee_id
        where q.session_id = s.id
      ) q
    ), '[]'::jsonb),

    'awards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', aw.id,
        'trigger', aw.trigger,
        'member_id', aw.member_id,
        'display_name', awm.display_name,
        'emoji', coalesce(b.emoji, '🏆'),
        'name', coalesce(b.name, b.key, ''),
        'badge_key', coalesce(b.key, '')
      ) order by aw.created_at)
      from awards aw
      left join badges b on b.id = aw.badge_id
      left join members awm on awm.id = aw.member_id
      where aw.session_id = s.id
    ), '[]'::jsonb)
  )
  from sessions s
  where s.id = target_session_id;
$$;

-- ============================================================
-- 8. Snapshot de Sala: el Cierre ya no expone trivia ni takes.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."room_snapshot"("target_session_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
	assignee_avatar text;
	author_avatar text;
	next_assignee_avatar text;
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
			'avatar', m.avatar,
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
			'author_avatar', m.avatar,
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
		   and sp.role = 'member'
		   and not sp.opt_out) as members_total,
		(select count(*)::int as cnt
		 from session_participants sp
		 where sp.session_id = target_session_id
		   and sp.role = 'member'
		   and not sp.opt_out
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
			'author_avatar', m_author.avatar,
			'assignee_avatar', m_assignee.avatar,
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
		select a.id, a.state, a.reveal_order, a.question_id, a.assignee_id, a.notes, a.phase_started_at, a.extension_count
		into active
		from assignments a
		where a.session_id = target_session_id
			and a.state in ('exposition', 'complement')
		order by a.reveal_order
		limit 1;

		if found then
			select q.text, m.display_name, ma.display_name, m.avatar, ma.avatar
			into qtext, author, assignee, author_avatar, assignee_avatar
			from questions q
			join members m on m.id = q.author_id
			join members ma on ma.id = active.assignee_id
			where q.id = active.question_id;

			if active.assignee_id = my_id then
				my_notes := active.notes;
			end if;

			if active.state in ('exposition', 'complement') then
				if active.state = 'exposition' then
					select count(*)::int into eligible_count
					from session_participants sp
					where sp.session_id = target_session_id
					  and sp.member_id <> active.assignee_id;
				else
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
				'assigneeAvatar', assignee_avatar,
				'authorName', author,
				'authorAvatar', author_avatar,
				'revealOrder', active.reveal_order,
				'myNotes', my_notes,
				'phaseStartedAt', active.phase_started_at,
				'extensionCount', active.extension_count,
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
				select m.display_name, m.avatar into assignee, next_assignee_avatar
				from members m where m.id = nxt.assignee_id;

				debate_json := json_build_object(
					'mode', 'waiting_reveal',
					'nextAssigneeName', assignee,
					'nextAssigneeId', nxt.assignee_id,
					'nextAssigneeAvatar', next_assignee_avatar,
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
		cierre_json := json_build_object();
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
$$;

-- ============================================================
-- 9. Tablas de minijuegos: DROP directo (cero filas en la nube).
-- ============================================================

drop table if exists public.trivia_answers cascade;
drop table if exists public.trivia_hits cascade;
drop table if exists public.trivia_items cascade;
drop table if exists public.trivia_rounds cascade;
drop table if exists public.take_votes cascade;
drop table if exists public.takes cascade;
drop table if exists public.trivias cascade;

drop type if exists public.trivia_round_status cascade;
drop type if exists public.take_status cascade;
drop type if exists public.take_position cascade;
