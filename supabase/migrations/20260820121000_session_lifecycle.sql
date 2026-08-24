-- Ticket #20: lifecycle de Sesiones (SPEC §3.1).
-- The database is the final guard against skipping or reversing a state.

create or replace function public.sessions_status_forward_only()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	if new.status is distinct from old.status
		and not (
			(old.status = 'preparation' and new.status = 'lobby')
			or (old.status = 'lobby' and new.status = 'in_progress')
			or (old.status = 'in_progress' and new.status = 'closed')
			or (old.status = 'closed' and new.status = 'archived')
		)
	then
		raise exception 'El estado de la Sesión solo puede avanzar: % → %',
			old.status, new.status
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;

drop trigger if exists sessions_status_forward_only on public.sessions;
create trigger sessions_status_forward_only
	before update of status on public.sessions
	for each row
	execute function public.sessions_status_forward_only();

comment on function public.sessions_status_forward_only() is
	'Impide saltar o retroceder estados de una Sesión (SPEC §3.1, ticket #20)';

-- Rating is intentionally not added here: its source votes and aggregation
-- belong to ticket #19. This migration only closes the lifecycle seam.
