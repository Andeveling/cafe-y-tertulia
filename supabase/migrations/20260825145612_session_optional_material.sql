-- Ticket #36: session optional material — material_id nullable, kill cascade.
-- Sessions and questions survive material deletion (ON DELETE SET NULL).
-- New RPCs: create_session, attach_material, detach_material.
-- Bug fixes: close_session, start_trivia_round, open_session_rating handle null material_id.

-- ============================================================
-- 1. Schema: sessions.material_id nullable, ON DELETE SET NULL
-- ============================================================

alter table public.sessions alter column material_id drop not null;
alter table public.sessions drop constraint sessions_material_id_fkey;
alter table public.sessions
	add constraint sessions_material_id_fkey
	foreign key (material_id) references public.materials (id) on delete set null;

-- sessions.range nullable; if material_id is set, range must be non-empty.
alter table public.sessions alter column range drop not null;
alter table public.sessions
	add constraint sessions_range_material_check
	check (
		material_id is null
		or range is not null and length(trim(range)) > 0
	);

-- ============================================================
-- 2. Schema: questions.material_id nullable, ON DELETE SET NULL
-- ============================================================

alter table public.questions alter column material_id drop not null;
alter table public.questions drop constraint questions_material_id_fkey;
alter table public.questions
	add constraint questions_material_id_fkey
	foreign key (material_id) references public.materials (id) on delete set null;

-- ============================================================
-- 3. RLS: questions_insert_member — IS NOT DISTINCT FROM + lobby
-- ============================================================

drop policy if exists "questions_insert_member" on public.questions;

create policy "questions_insert_member" on public.questions
	for insert
	to authenticated
	with check (
		public.is_member()
		and (select auth.uid()) = author_id
		and exists (
			select 1
			from public.members m
			where m.id = author_id
			and m.status = 'active'
		)
		and exists (
			select 1
			from public.sessions s
			where s.id = session_id
			and s.status in ('preparation', 'lobby')
			and s.material_id is not distinct from material_id
		)
	);

-- ============================================================
-- 4. RPC: create_session
-- ============================================================

create or replace function public.create_session(
	p_material_id uuid default null,
	p_range text default null,
	p_scheduled_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_id uuid;
begin
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	-- Material set + empty range: raise.
	if p_material_id is not null and (p_range is null or length(trim(p_range)) = 0) then
		raise exception 'El rango es obligatorio cuando hay material';
	end if;

	-- Validate material exists if provided.
	if p_material_id is not null then
		if not exists (select 1 from public.materials where id = p_material_id) then
			raise exception 'Material no encontrado';
		end if;
	end if;

	if p_scheduled_at is not null and p_scheduled_at > now() then
		-- Future: preparation, no moderator yet.
		insert into public.sessions (material_id, range, status, moderator_id, scheduled_at)
		values (p_material_id, nullif(trim(p_range), ''), 'preparation', null, p_scheduled_at)
		returning id into new_id;
	else
		-- Now or null: lobby, moderator = auth.uid().
		insert into public.sessions (material_id, range, status, moderator_id, scheduled_at)
		values (p_material_id, nullif(trim(p_range), ''), 'lobby', auth.uid(), p_scheduled_at)
		returning id into new_id;
	end if;

	return new_id;
end;
$$;

grant execute on function public.create_session(uuid, text, timestamptz) to authenticated;

-- ============================================================
-- 5. RPC: attach_material / detach_material
-- ============================================================

create or replace function public.attach_material(
	p_session_id uuid,
	p_material_id uuid,
	p_range text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	-- Only before Sorteo: no draws row OR all draws pending.
	if exists (
		select 1 from public.draws d
		where d.session_id = p_session_id
		and d.status <> 'pending'
	) then
		raise exception 'No se puede cambiar el material después del Sorteo';
	end if;

	-- Validate material exists.
	if not exists (select 1 from public.materials where id = p_material_id) then
		raise exception 'Material no encontrado';
	end if;

	-- Range required when attaching material.
	if p_range is null or length(trim(p_range)) = 0 then
		raise exception 'El rango es obligatorio al adjuntar material';
	end if;

	update public.sessions
	set material_id = p_material_id,
	    range = trim(p_range)
	where id = p_session_id;

	if not found then
		raise exception 'Sesión no encontrada';
	end if;
end;
$$;

create or replace function public.detach_material(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if not public.is_member() then
		raise exception 'Solo miembros';
	end if;

	-- Only before Sorteo: no draws row OR all draws pending.
	if exists (
		select 1 from public.draws d
		where d.session_id = p_session_id
		and d.status <> 'pending'
	) then
		raise exception 'No se puede quitar el material después del Sorteo';
	end if;

	update public.sessions
	set material_id = null,
	    range = null
	where id = p_session_id;

	if not found then
		raise exception 'Sesión no encontrada';
	end if;
end;
$$;

grant execute on function public.attach_material(uuid, uuid, text) to authenticated;
grant execute on function public.detach_material(uuid) to authenticated;

-- ============================================================
-- 6. Bug fix: close_session — check moderator/status separately,
--    skip material rating rollup when material_id is null.
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
  -- Check moderator + status separately (not via material_id).
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

  -- Bloquea el cierre si queda un minijuego o el Sorteo sin terminar.
  select count(*) into n from trivia_rounds
  where session_id = target_session_id and status = 'live';
  if n > 0 then
    raise exception 'Cierra primero la trivia en curso';
  end if;

  select count(*) into n from takes
  where session_id = target_session_id and status = 'open';
  if n > 0 then
    raise exception 'Cierra primero la votación abierta';
  end if;

  select count(*) into n from draws
  where session_id = target_session_id and status <> 'revealed';
  if n > 0 then
    raise exception 'Revela primero el Sorteo';
  end if;

  -- Congela el rating solo si estaba abierto; si nunca se abrió, cierra igual.
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

    -- Privacidad por eliminación (ADR 0003): solo persiste el aporte al agregado.
    delete from votes where session_id = target_session_id;

    -- Skip material rating rollup when no material.
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
-- 7. Bug fix: start_trivia_round — domain error for null material
-- ============================================================

create or replace function public.start_trivia_round(
  target_session_id uuid,
  target_trivia_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
  mid uuid;
  n int;
begin
  -- Check moderator + status first (not via material_id).
  select material_id into mid from sessions
  where id = target_session_id and status = 'in_progress' and moderator_id = auth.uid();
  if not found then
    raise exception 'Solo el moderador en sesión en curso';
  end if;

  -- Domain error: session needs material for trivia.
  if mid is null then
    raise exception 'La sesión no tiene material para Trivia';
  end if;

  if not exists (
    select 1 from trivias t where t.id = target_trivia_id and t.material_id = mid
  ) then
    raise exception 'Trivia no pertenece al material';
  end if;

  select count(*) into n from trivia_rounds where session_id = target_session_id;
  if n >= 2 then
    raise exception 'Máximo 2 trivias por sesión';
  end if;

  if exists (
    select 1 from trivia_rounds
    where session_id = target_session_id and status = 'live'
  ) then
    raise exception 'Ya hay una trivia en curso';
  end if;

  select count(*) into n from trivia_items where trivia_id = target_trivia_id;
  if n < 3 or n > 5 then
    raise exception 'Trivia inválida';
  end if;

  insert into trivia_rounds (session_id, trivia_id)
  values (target_session_id, target_trivia_id)
  returning id into rid;

  return rid;
end;
$$;

-- ============================================================
-- 8. Bug fix: open_session_rating — domain error for null material
-- ============================================================

create or replace function public.open_session_rating(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check moderator + status first.
  if not exists (
    select 1 from sessions
    where id = target_session_id
      and status = 'in_progress'
      and moderator_id = auth.uid()
      and rating_open = false
      and rating_count = 0
  ) then
    raise exception 'Solo el moderador puede abrir el rating en sesión en curso';
  end if;

  -- Domain error: session needs material for rating.
  if not exists (
    select 1 from sessions
    where id = target_session_id and material_id is not null
  ) then
    raise exception 'La sesión no tiene material para Rating';
  end if;

  update sessions
  set rating_open = true
  where id = target_session_id;
end;
$$;

-- ============================================================
-- 9. Bug fix: close_session_rating / clear_session_rating —
--    check moderator/status separately, skip rollup when no material.
-- ============================================================

create or replace function public.close_session_rating(target_session_id uuid)
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
begin
  select material_id into mid from sessions
  where id = target_session_id
    and status = 'in_progress'
    and moderator_id = auth.uid()
    and rating_open;
  if not found then
    raise exception 'Solo el moderador puede cerrar el rating';
  end if;

  select count(*), coalesce(sum(stars), 0)
  into cnt, sum_v
  from votes where session_id = target_session_id;

  if cnt = 0 then
    avg_v := null;
  else
    avg_v := round(sum_v / cnt, 1);
  end if;

  update sessions
  set rating_open = false,
      rating_avg = avg_v,
      rating_count = cnt
  where id = target_session_id;

  -- Privacy by deletion (ADR 0003)
  delete from votes where session_id = target_session_id;

  if mid is not null then
    perform public.refresh_material_rating(mid);
  end if;

  return jsonb_build_object('avg', avg_v, 'count', cnt);
end;
$$;

create or replace function public.clear_session_rating(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  select material_id into mid from sessions
  where id = target_session_id
    and status = 'closed'
    and moderator_id = auth.uid();
  if not found then
    raise exception 'Solo el moderador en sesión cerrada';
  end if;

  update sessions set rating_avg = null, rating_count = 0, rating_open = false
  where id = target_session_id;

  if mid is not null then
    perform public.refresh_material_rating(mid);
  end if;
end;
$$;
