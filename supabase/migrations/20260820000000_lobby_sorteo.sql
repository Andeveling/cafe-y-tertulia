-- Ticket #16: lobby y Sorteo oculto (SPEC §2.4, §2.6-2.7, §3.2 · ADR 0001)

create type public.draw_status as enum ('pending', 'hidden', 'revealing', 'revealed');
create type public.assignment_state as enum ('hidden', 'preparation', 'exposition', 'complement', 'complete');

create table public.session_participants (
	session_id uuid not null references public.sessions(id) on delete cascade,
	member_id uuid not null references public.members(id) on delete cascade,
	opt_out boolean not null default false,
	primary key (session_id, member_id)
);

create table public.draws (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null unique references public.sessions(id) on delete cascade,
	status public.draw_status not null default 'pending',
	created_at timestamptz not null default now()
);

create table public.assignments (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null references public.sessions(id) on delete cascade,
	question_id uuid not null references public.questions(id) on delete cascade,
	assignee_id uuid not null references public.members(id) on delete cascade,
	reveal_order int not null,
	state public.assignment_state not null default 'hidden',
	notes text not null default '',
	draw_id uuid not null references public.draws(id) on delete cascade,
	unique (draw_id, question_id, assignee_id),
	unique (draw_id, reveal_order)
);

create index session_participants_session_idx on public.session_participants(session_id);
create index assignments_session_idx on public.assignments(session_id);

alter table public.session_participants enable row level security;
alter table public.draws enable row level security;
alter table public.assignments enable row level security;

create policy "participants_select_member" on public.session_participants for select to authenticated using (public.is_member());
create policy "participants_insert_member" on public.session_participants for insert to authenticated with check (public.is_member() and member_id = auth.uid());
create policy "participants_update_member" on public.session_participants for update to authenticated using (member_id = auth.uid() or public.is_session_moderator(session_id)) with check (member_id = auth.uid() or public.is_session_moderator(session_id));

-- The draw and assignments are intentionally unreadable while hidden. The
-- reveal RPC is the only path that exposes one assignment at a time.
create policy "draws_select_after_reveal" on public.draws for select to authenticated using (public.is_member() and status <> 'hidden');
create policy "assignments_select_after_reveal" on public.assignments for select to authenticated using (
	public.is_member() and exists (select 1 from public.draws d where d.id = draw_id and d.status <> 'hidden')
);

grant select, insert, update on public.session_participants to authenticated;
grant select on public.draws, public.assignments to authenticated;
create or replace function public.execute_draw(target_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_draw uuid;
begin
	if not exists (select 1 from sessions where id = target_session_id and moderator_id = auth.uid() and status = 'lobby') then
		raise exception 'Solo el Moderador puede ejecutar el Sorteo en el lobby';
	end if;
	if exists (select 1 from draws where session_id = target_session_id) then
		raise exception 'El Sorteo solo puede ejecutarse una vez';
	end if;

	insert into draws (session_id, status) values (target_session_id, 'hidden') returning id into new_draw;
	with eligible as (
		select sp.member_id, row_number() over (order by gen_random_uuid()) as slot
		from session_participants sp
		where sp.session_id = target_session_id and not sp.opt_out
	), questions as (
		select q.id, q.author_id, row_number() over (order by gen_random_uuid()) as slot
		from questions q
		where q.session_id = target_session_id and not q.outside_draw
	), pairs as (
		select q.id as question_id, e.member_id, row_number() over (order by gen_random_uuid()) as reveal_order
		from questions q cross join eligible e
		where q.author_id <> e.member_id
		order by gen_random_uuid()
		limit (select count(*) from eligible)
	)
	insert into assignments (session_id, question_id, assignee_id, reveal_order, draw_id)
	select target_session_id, question_id, member_id, reveal_order, new_draw from pairs;

	return new_draw;
end;
$$;

grant execute on function public.execute_draw(uuid) to authenticated;

-- Reveals the next fixed-order assignment; callers never choose the order.
create or replace function public.reveal_next_assignment(target_session_id uuid)
returns setof public.assignments
language plpgsql
security definer
set search_path = public
as $$
declare next_order int;
begin
	if not exists (select 1 from sessions where id = target_session_id and moderator_id = auth.uid()) then
		raise exception 'Solo el Moderador puede revelar';
	end if;
	select min(a.reveal_order) into next_order from assignments a join draws d on d.id = a.draw_id where a.session_id = target_session_id and a.state = 'hidden';
	if next_order is null then return; end if;
	update draws set status = case when (select count(*) from assignments where session_id = target_session_id and state = 'hidden') = 1 then 'revealed' else 'revealing' end where session_id = target_session_id;
	update assignments set state = 'preparation' where session_id = target_session_id and reveal_order = next_order;
	return query select * from assignments where session_id = target_session_id and reveal_order = next_order;
end;
$$;

grant execute on function public.reveal_next_assignment(uuid) to authenticated;
revoke all on function public.execute_draw(uuid), public.reveal_next_assignment(uuid) from public;
