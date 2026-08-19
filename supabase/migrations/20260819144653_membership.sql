-- Membership invitation flow (SPEC §2.14, §9 · ADR 0005).
--
-- NOTE: this migration intentionally does NOT create the members table or the
-- member_status enum. Those are defined in the materials pipeline migration
-- (ticket #14, supabase/migrations/*_materiales_sesiones.sql), which is a
-- sibling branch that merges before or alongside this one. Members is the FK
-- target for invited_by and the RLS membership check lives there too.

-- Invitation lifecycle.
create type public.invitation_status as enum ('pending', 'accepted', 'expired');

-- The padrinazgo: who invited whom, when, and whether it was accepted.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by uuid not null references public.members (id) on delete cascade,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.invitations is 'Registro de padrinazgo: invitación de un Miembro activo, expira a las 24h (SPEC §2.14).';

-- Indices for the common lookups.
create index invitations_invited_by_idx on public.invitations (invited_by);
create index invitations_email_idx on public.invitations (email);

-- Only a member with status 'active' can invite a new person. Enforced at the
-- application layer (server action) and re-checked here for defense in depth.
create or replace function public.is_active_member(uid uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.id = uid and m.status = 'active'
  );
$$;

-- RLS: the lock lives in the data layer (ADR 0005). RLS on members itself is
-- enabled in the materials migration; invitations is enabled here.
alter table public.invitations enable row level security;

-- Invitations: members of the club can read invitations, mainly so the
-- padrino can see and resend their own pending ones; the invitee can see their
-- own row to mark it accepted.
create policy "invitations_select_members" on public.invitations
  for select
  to authenticated
  using (
    public.is_active_member(auth.uid())
    or email = (select auth.jwt() ->> 'email')
  );

-- Invitations: only the padrino can create the invitation row for the person
-- they invite.
create policy "invitations_insert_padrino" on public.invitations
  for insert
  to authenticated
  with check (
    public.is_active_member(auth.uid())
    and invited_by = auth.uid()
  );

-- Invitations: the padrino can mark their own pending invitations as expired
-- (e.g. when re-inviting). They cannot forge an acceptance — only the invitee
-- can do that (invitations_update_invitee).
create policy "invitations_update_padrino" on public.invitations
  for update
  to authenticated
  using (invited_by = auth.uid())
  with check (
    invited_by = auth.uid()
    and status = 'expired'
  );

-- Invitations: the invitee marks their own invitation as accepted when they
-- complete the sign-up. The email match is safe because the invitee owns that
-- email (verified by Auth when they exchanged the invite token).
create policy "invitations_update_invitee" on public.invitations
  for update
  to authenticated
  using (email = (select auth.jwt() ->> 'email'))
  with check (
    email = (select auth.jwt() ->> 'email')
    and status = 'accepted'
  );

-- Members: every active member can read the roster (horizontal club), and
-- each member can always read their own row (needed to check their own status
-- at sign-in, e.g. invited / left).
create policy "members_select_any_member" on public.members
  for select
  to authenticated
  using (
    public.is_active_member(auth.uid())
    or id = auth.uid()
  );

-- Data API access. New public tables are not auto-exposed, so grant
-- explicitly. RLS still governs row visibility. (members grants come from the
-- materials migration.)
grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.invitations to authenticated;
grant select, insert, update on table public.invitations to service_role;
grant execute on function public.is_active_member(uuid) to authenticated;
grant execute on function public.is_active_member(uuid) to service_role;
