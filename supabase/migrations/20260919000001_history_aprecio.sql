-- Historial: expone el Aprecio congelado por asignación.
-- Re-define get_session_history con las 4 claves de aprecio en el objeto
-- assignment (idéntico al cuerpo de 20260822040000 salvo esas claves).

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

    -- Material asociado
    'material', (
      select jsonb_build_object(
        'id', m.id, 'title', m.title, 'kind', m.kind,
        'author', m.author, 'status', m.status,
        'rating_avg', m.rating_avg, 'rating_count', m.rating_count
      )
      from materials m where m.id = s.material_id
    ),

    -- Participantes
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

    -- Preguntas con asignación (si existe)
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

    -- Trivia rounds con hits
    'trivia_rounds', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tr.id,
        'title', coalesce(t.title, 'Trivia'),
        'status', tr.status,
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'member_id', th.member_id,
            'display_name', coalesce(thm.display_name, 'Miembro del club'),
            'hits', th.hits
          ))
          from trivia_hits th
          left join members thm on thm.id = th.member_id
          where th.round_id = tr.id
        ), '[]'::jsonb)
      ) order by tr.created_at)
      from trivia_rounds tr
      left join trivias t on t.id = tr.trivia_id
      where tr.session_id = s.id
    ), '[]'::jsonb),

    -- Takes con conteo de votos agregado
    'takes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tk.id,
        'prompt', tk.prompt,
        'status', tk.status,
        'counts', jsonb_build_object(
          'agree', coalesce((select count(*) from take_votes tv where tv.take_id = tk.id and tv.position = 'agree'), 0),
          'disagree', coalesce((select count(*) from take_votes tv where tv.take_id = tk.id and tv.position = 'disagree'), 0),
          'neutral', coalesce((select count(*) from take_votes tv where tv.take_id = tk.id and tv.position = 'neutral'), 0)
        )
      ) order by tk.created_at)
      from takes tk
      where tk.session_id = s.id
    ), '[]'::jsonb),

    -- Awards
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
