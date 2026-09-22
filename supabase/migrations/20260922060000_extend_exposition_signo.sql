-- Fix: extend_exposition restaba tiempo en vez de sumarlo.
--
-- El reloj de Exposición es cuenta atrás: remaining = budget - elapsed,
-- donde elapsed = now - phase_started_at. Mover el ancla ATRÁS (-60s)
-- aumenta elapsed y por tanto REDUCE el restante. Para sumar 60 s hay que
-- mover el ancla ADELANTE (+60s), reduciendo elapsed.
--
-- Síntoma reportado: pulsar "+1 min" con 1:57 restante dejaba ~0:57.

create or replace function public.extend_exposition(target_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	assignee_session uuid;
	author uuid;
	season uuid;
begin
	select a.session_id into assignee_session
	from public.assignments a
	join public.sessions s on s.id = a.session_id
	where a.id = target_assignment_id
		and a.state = 'exposition'
		and s.status = 'in_progress'
		and s.moderator_id = auth.uid();
	if not found then
		raise exception 'Solo el Moderador puede extender en Exposición';
	end if;

	update public.assignments
	set phase_started_at = coalesce(phase_started_at, now()) + interval '60 seconds'
	where id = target_assignment_id;

	select q.author_id into author
	from public.assignments a
	join public.questions q on q.id = a.question_id
	where a.id = target_assignment_id;

	select id into season from public.seasons
	where status = 'open' order by starts_at desc limit 1;
	if season is null then return; end if;

	update public.counts
	set value = value + 1
	where member_id = author and event = 'question_hot' and season_id = season;
	if not found then
		insert into public.counts (member_id, event, season_id, value)
		values (author, 'question_hot', season, 1);
	end if;
end;
$$;
