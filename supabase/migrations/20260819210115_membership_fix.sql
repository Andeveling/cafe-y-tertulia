-- Membership fixes from the code review of the invitation flow (ticket #13).
--
-- 1. Unify the membership helpers: is_active_member(uid) is dropped and all
--    policies use is_member() (security definer). The definer matters: the
--    check must not depend on the members SELECT policies (if a future policy
--    restricts the self-select, an invoker helper re-enters the policy and
--    risks "infinite recursion detected in policy for relation members").
-- 2. Restrict the padrino's invitation UPDATE to active members (a member who
--    left cannot keep marking invitations expired).
-- 3. members.invited_by -> on delete set null: a deleted member's padrinazgo
--    history stays as memory of the club (matches members.invited_by in the
--    materials migration; invitations are the record of the act).
-- 4. Partial unique index on invitations.email where status = 'pending': two
--    padrinos inviting the same email (or a check/insert race) cannot create
--    two live invitations.

-- invitations: the padrino must be an active member to touch invitations.
-- Before, the UPDATE policy only required invited_by = auth.uid(), so a member
-- who left could keep marking their invitations expired.
alter policy "invitations_update_padrino" on public.invitations
  using (
    public.is_member()
    and invited_by = auth.uid()
  )
  with check (
    public.is_member()
    and invited_by = auth.uid()
    and status = 'expired'
  );

-- invitations: members of the club can read invitations (to see their own
-- pending ones); the invitee can always read their own row.
alter policy "invitations_select_members" on public.invitations
  using (
    public.is_member()
    or email = (select auth.jwt() ->> 'email')
  );

-- invitations: only an active member (the padrino) can invite.
alter policy "invitations_insert_padrino" on public.invitations
  with check (
    public.is_member()
    and invited_by = auth.uid()
  );

-- members: every active member can read the roster (horizontal club), and
-- each member can always read their own row (needed to check their own status
-- at sign-in, e.g. invited / left).
alter policy "members_select_any_member" on public.members
  using (
    public.is_member()
    or id = auth.uid()
  );

-- (1) is_active_member is superseded by is_member() (defined security definer
-- in the materials migration). Drop it now that nothing depends on it, so
-- there is a single source of truth for the membership check.
drop function public.is_active_member(uuid);

-- (3) A deleted member's padrinazgo stays as memory of the club.
alter table public.invitations
  drop constraint invitations_invited_by_fkey,
  add constraint invitations_invited_by_fkey
    foreign key (invited_by) references public.members (id) on delete set null;

-- (4) One live invitation per email.
create unique index invitations_pending_email_unique
  on public.invitations (email)
  where status = 'pending';
