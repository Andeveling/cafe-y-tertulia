-- ADR 0010: presencia híbrida. `last_seen` sostiene "hace X" y el
-- offline real al recargar. Update propio estrecho: solo last_seen,
-- el resto de la fila sigue sin UPDATE propio (ADR 0005).

alter table public.members
	add column if not exists last_seen timestamptz;

create index if not exists members_last_seen_idx
	on public.members (last_seen);

-- Solo la propia fila. El trigger de abajo impide tocar otras columnas.
drop policy if exists "members_update_own_last_seen" on public.members;
create policy "members_update_own_last_seen" on public.members
	for update
	to authenticated
	using ((select auth.uid()) = id)
	with check ((select auth.uid()) = id);

create or replace function public.members_last_seen_only()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	if new.id is distinct from old.id
		or new.status is distinct from old.status
		or new.display_name is distinct from old.display_name
		or new.invited_by is distinct from old.invited_by
		or new.created_at is distinct from old.created_at
	then
		raise exception 'Solo se puede actualizar last_seen de la propia fila'
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;

drop trigger if exists members_last_seen_only on public.members;
create trigger members_last_seen_only
	before update on public.members
	for each row
	execute function public.members_last_seen_only();
