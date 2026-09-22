-- Tope de 2 extensiones por Intervención + bump atómico.
--
-- Hasta ahora extend_exposition era idempotente en el ancla (movía -60s,
-- ya corregido en 20260922060000 a +60s) pero no en el efecto: cada +1
-- sumaba 60 s y un `question_hot` al autor, sin límite. Un Moderador
-- generoso o distraído podía inflar el contador y regalar minutos sin
-- rastro en el Histórico.
--
-- Aquí:
--  1. Columna `extension_count smallint not null default 0` en assignments.
--  2. Bump atómico + check de tope dentro del RPC `extend_exposition`.
--  3. El RPC rechaza el 3er +1 con `raise exception` (mismo idioma que
--     ya usa para "solo el Moderador"). El cliente solo recibe el error
--     vía `useRoomMutation` → toast.error existente.
--  4. El `question_hot` solo se cuenta si el bump tuvo éxito.
--
-- Tests en supabase/tests/actualizarán el caso de extensión al nuevo tope.

alter table public.assignments
	add column extension_count smallint not null default 0
	check (extension_count between 0 and 2);

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
	current_count smallint;
begin
	select a.session_id, a.extension_count into assignee_session, current_count
	from public.assignments a
	join public.sessions s on s.id = a.session_id
	where a.id = target_assignment_id
		and a.state = 'exposition'
		and s.status = 'in_progress'
		and s.moderator_id = auth.uid();
	if assignee_session is null then
		raise exception 'Solo el Moderador puede extender en Exposición';
	end if;
	if current_count >= 2 then
		raise exception 'Tope de extensiones alcanzado en esta Intervención (máx 2)';
	end if;

	update public.assignments
	set phase_started_at = coalesce(phase_started_at, now()) + interval '60 seconds',
	    extension_count = extension_count + 1
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

grant execute on function public.extend_exposition(uuid) to authenticated;
