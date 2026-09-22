-- Expone extension_count en el snapshot del Debate para que el cliente
-- pueda pintar la cuenta atrás de extensiones disponibles (tope 2).
-- El RPC `extend_exposition` y la columna `extension_count` viven en
-- 20260922070000; aquí solo actualizamos `stage_snapshot` para que la
-- sala del Debate lo vea en el JSON del modo `active`.

drop function if exists public.stage_snapshot(uuid);
create or replace function public.stage_snapshot(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	my_id uuid := auth.uid();
	sess sessions%rowtype;
	active assignments%rowtype;
	nxt assignments%rowtype;
	qtext text;
	author text;
	assignee text;
	my_notes text := null;
	mode_label text := null;
	debate_json jsonb := null;
	result jsonb;
begin
	select * into sess
	from public.sessions
	where id = target_session_id;

	if not found then
		raise exception 'Sesión no encontrada';
	end if;

	if sess.room_stage = 'debate' then
		select a.id, a.state, a.reveal_order, a.question_id, a.assignee_id, a.notes, a.phase_started_at, a.extension_count
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

			debate_json := jsonb_build_object(
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
				'extensionCount', active.extension_count,
				'remainingHidden', (
					select count(*)::int from assignments
					where session_id = target_session_id and state = 'hidden'
				)
			);
		end if;
	end if;

	result := jsonb_build_object(
		'session', jsonb_build_object(
			'id', sess.id,
			'status', sess.status,
			'roomStage', sess.room_stage,
			'moderatorId', sess.moderator_id,
			'materialId', sess.material_id
		),
		'debate', debate_json
	);

	return result;
end;
$$;

grant execute on function public.stage_snapshot(uuid) to authenticated;
