-- Reapertura deliberada Debate → Sorteo: el trigger forward-only (ticket
-- #20) rechazaba el `status = 'lobby'` que `advance_room_stage` hace al
-- volver del debate al sorteo ("El estado de la Sesión solo puede avanzar:
-- in_progress → lobby"), dejando el botón "Volver a Sorteo" siempre roto.
--
-- Fix: excepción estrecha — in_progress → lobby solo cuando room_stage va
-- debate → draw en el mismo UPDATE. Cualquier otra pareja sigue bloqueada,
-- y el ciclo de vida nominal (SPEC §3.1) no cambia.

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
			-- Reapertura deliberada: volver del Debate al Sorteo reabre el
			-- lobby (advance_room_stage, botón "Volver a Sorteo").
			or (old.status = 'in_progress' and new.status = 'lobby'
				and old.room_stage = 'debate' and new.room_stage = 'draw')
		)
	then
		raise exception 'El estado de la Sesión solo puede avanzar: % → %',
			old.status, new.status
			using errcode = 'P0001';
	end if;
	return new;
end;
$$;
