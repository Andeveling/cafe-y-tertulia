> Importado de GitHub #69 (Andeveling/cafe-y-tertulia). GitHub queda como archivo historico de solo lectura; el tracker local rige desde ahora.
> Source: https://github.com/Andeveling/cafe-y-tertulia/issues/69
> Category: enhancement
> Status: ready-for-human
> Triage: 2026-09-22 — spec completo pero epico (46 historias); pendiente descomposicion en tickets tracer-bullet antes de /implement.

# Multi-Grupo: Espacios aislados de lectura y conversación

## Problem Statement

Hoy el sistema opera como un único club implícito: todos los Miembros comparten el mismo pool global de Materiales, Sesiones, Categorías y gamificación. No hay forma de crear espacios separados para distintos grupos de lectura. Esto limita el crecimiento — no se pueden tener comunidades paralelas con contenido y participantes independientes.

## Solution

Introducir el concepto de **Grupo**: una comunidad aislada dentro de la plataforma "Café y Tertulias" con sus propios Materiales, Sesiones, Categorías, Temporadas, Insignias y Conteos. Un Miembro puede pertenecer a múltiples Grupos. Los Grupos pueden ser públicos (descubribles, unión instantánea) o privados (solo por invitación). Los datos existentes migran a un grupo llamado "nojau".

## User Stories

### Gestión de Grupos

1. As a Miembro, I want to create a new Group (name, description, avatar, visibility), so that I can start an isolated community for reading and conversation.
2. As a Miembro, I want to choose whether my Group is public or private at creation time, so that I control who can discover and join it.
3. As an Administrador, I want to edit my Group's name, description, and avatar, so that I can keep the group information up to date.
4. As an Administrador, I want to change my Group's visibility (public ↔ private), so that I can adjust the group's discoverability over time.
5. As an Administrador, I want to delete my Group with double confirmation, so that I can remove a group that is no longer needed. All data (materials, sessions, gamification) is permanently lost.
6. As an Administrador, I want to name other Miembros as co-Administradores, so that group management is not a single point of failure.
7. As an Administrador, I want to remove a Miembro from my Group, so that I can manage membership. The removed Miembro's contributions (questions, trivia, etc.) remain as group memory.
8. As a Miembro, I want to leave a Group voluntarily, so that I can disengage from a community. My contributions remain as group memory.
9. As a Miembro, I want to be automatically promoted to Administrador if the sole Admin leaves and I am the longest-standing member, so that the group never becomes orphaned.

### Descubrimiento y Unión

10. As a Miembro without any groups, I want to browse a catalog of public Groups, so that I can find communities to join.
11. As a Miembro browsing public Groups, I want to see each group's name, description, avatar, member count, material count, and session count, so that I can decide whether to join without seeing the group's internal content.
12. As a Miembro, I want to join a public Group instantly by tapping "Unirse", so that there is no friction in joining open communities.
13. As a Miembro, I want to not see private Groups in the catalog, so that private communities remain invisible to non-members.
14. As an Administrador of a private Group, I want to generate a shareable invitation link (token-based), so that I can invite specific Miembros to my private group.
15. As a Miembro, I want to join a private Group by using an invitation link, so that I can access invite-only communities.
16. As a Miembro without any groups, I want to create a new Group, so that I can start my own community even without belonging to one first.

### Navegación y Contexto

17. As a Miembro belonging to multiple Groups, I want to see a "Mis Grupos" screen as my home, so that I can choose which group to enter.
18. As a Miembro on the "Mis Grupos" screen, I want to see each of my groups with an indicator of recent activity (member count online), so that I can pick the most relevant group.
19. As a Miembro inside a Group, I want all content (materials, sessions, members, gamification) to be scoped to that group only, so that I have a focused experience without cross-group noise.
20. As a Miembro, I want to switch between my groups without signing out, so that I can participate in multiple communities seamlessly.
21. As a Miembro navigating within a Group, I want the URL to include the group identifier (e.g., `/g/{group-slug}/...`), so that links are shareable and bookmarkable within the group context.

### Contenido dentro de un Grupo

22. As a Miembro of a Group, I want to create Materials within that group, so that the group has its own reading/content pipeline.
23. As a Miembro of a Group, I want to create Sessions within that group, so that the group has its own discussion calendar.
24. As a Miembro of a Group, I want to propose, select, advance, and finish Materials through the pipeline, so that the material lifecycle works the same as it does today but scoped to my group.
25. As a Miembro of a Group, I want to moderate a Session within that group, so that any member can lead a discussion (not just the Administrador).
26. As a Miembro of a Group, I want to participate in the full session flow (questions, presence, draw, debate, cierre), so that the session experience is unchanged within a group.

### Categorías y Gamificación por Grupo

27. As an Administrador, I want my new Group to be pre-seeded with the standard categories (filosofía, cine, actualidad, etc.), so that the group has a starting taxonomy.
28. As an Administrador, I want my new Group to be pre-seeded with the standard badge catalog (individual and collective), so that gamification works from day one.
29. As an Administrador, I want to edit, add, or remove Categories within my Group, so that each group can customize its thematic taxonomy.
30. As a Miembro, I want Seasons to be created automatically per calendar within my Group, so that each group has its own monthly cycle of activity.
31. As a Miembro, I want my Conteos (event counters) to be tracked per-group, so that my participation in Group A does not affect my stats in Group B.
32. As a Miembro, I want my Maestría (category mastery) to be derived per-group, so that I can be "maestro" in one group and "semilla" in another.
33. As a Miembro, I want Insignias to be awarded per-group, so that achievements are contextual to the community where they were earned.

### Presencia y Rostro

34. As a Miembro inside a Group, I want to see only the presence (online status) of other members of that group, so that the roster is relevant and not noisy.
35. As a Miembro on the "Mis Grupos" screen, I want to see a count of online members per group, so that I know where activity is happening without seeing individual names across groups.

### Identidad

36. As a Miembro, I want a single identity (display name and avatar) that is the same across all my Groups, so that I don't have to manage multiple profiles.
37. As a Miembro, I want my profile to be visible to other members of any group I belong to, so that they know who I am within their community.

### Relación con el Sistema de Invitación al Club (Padrinazgo)

38. As a padrino inviting a new person to the platform, I want the invitee to get a platform account without being auto-joined to any group, so that club invitation and group membership are cleanly separated.
39. As a newly registered Miembro (via padrinazgo), I want to start without any group memberships, so that I can explore and choose which groups to join.
40. As a padrino, I want to then invite my newly registered invitee to my private groups separately, so that I control group access independently of platform access.

### Migración

41. As the system, I want all existing data (materials, sessions, categories, badges, seasons, counts, awards, questions, etc.) to be migrated into a group called "nojau", so that nothing is lost during the transition.
42. As the system, I want all existing active Miembros to be added as Miembros of the "nojau" group automatically, so that no one loses access.
43. As the system, I want "nojau" to behave as a normal group (editable, deletable, no special status), so that there is no special-case code for a "default" group.

### Miembros sin Grupo

44. As a Miembro without any group memberships, I want to see the "Mis Grupos" screen with the public group catalog, so that I can discover and join communities.
45. As a Miembro without any group memberships, I want to create a new Group, so that I can start my own community.
46. As a Miembro without any group memberships, I want to not have access to any materials or sessions until I join a group, so that the isolation model is consistent.

## Implementation Decisions

### Database Schema Changes

**New tables:**

- `groups` — The group entity. Columns: `id` (uuid PK), `name` (text, required), `description` (text, nullable), `avatar` (text, nullable), `visibility` (enum: `public`/`private`), `created_by` (FK → members), `created_at` (timestamptz).
- `group_members` — Junction table for group membership. Columns: `group_id` (FK → groups), `member_id` (FK → members), `role` (enum: `admin`/`member`), `created_at` (timestamptz). PK: `(group_id, member_id)`.

**`group_id` FK added to these tables (all scoped to a group):**

- `materials`
- `sessions`
- `categories`
- `material_categories`
- `session_categories`
- `seasons`
- `badges`
- `awards`
- `counts`
- `season_recognitions`
- `trivias`
- `questions`
- `draws`
- `assignments`
- `session_participants`
- `takes`
- `trivia_rounds`
- `votes`
- `hearts`
- `convocatorias`

**Tables NOT group-scoped:**

- `members` — Global identity. A member exists once on the platform.
- `invitations` — Platform-level padrinazgo. Unchanged.
- `trivia_items` — Scoped transitively via `trivia_id` → `trivias.group_id`.
- `trivia_answers` — Scoped transitively via `round_id` → `trivia_rounds.group_id`.
- `trivia_hits` — Scoped transitively via `round_id` → `trivia_rounds.group_id`.
- `take_votes` — Scoped transitively via `take_id` → `takes.group_id`.
- `recognition_category_meta` — Global reference data.

### RLS Architecture

**New function:** `is_group_member(p_group_id uuid)` — checks `auth.uid()` is an active member of the specified group (via `group_members` + `members.status = 'active'`). Security definer, same pattern as current `is_member()`.

**New function:** `is_group_admin(p_group_id uuid)` — checks `auth.uid()` has `role = 'admin'` in the specified group. Security definer.

**Policy rewrite:** Every RLS policy that currently calls `is_member()` is rewritten to call `is_group_member(group_id)`. The `group_id` comes from the row being accessed (for SELECT/UPDATE/DELETE) or from the INSERT values.

**`is_member()` preserved:** The existing `is_member()` function is kept for platform-level checks (e.g., can the user see the "Mis Grupos" screen? Can they manage their profile?). It no longer gates content access — that's `is_group_member()`'s job.

**Anon access:** The current anon SELECT on `materials` (public memory) and `sessions` (archived only) needs to be rethought. With group scoping, anon access could allow reading public group content, or it could be removed. Decision: remove anon access to materials/sessions for now — the public memory concept doesn't map cleanly to multi-group. Can be re-added per-group later.

### New RPCs (Security Definer)

- `create_group(name, description, avatar, visibility)` — Creates group + adds creator as admin member + seeds default categories and badges.
- `join_group(group_id)` — For public groups. Inserts into `group_members` with `role = 'member'`. Fails if group is private.
- `leave_group(group_id)` — Removes from `group_members`. If sole admin, promotes oldest member.
- `invite_to_group(group_id)` — Admin-only. Generates shareable token (same JWT pattern as ADR-0011).
- `remove_member(group_id, member_id)` — Admin-only. Removes member from group.
- `update_member_role(group_id, member_id, role)` — Admin-only. Promotes/demotes between admin and member.
- `delete_group(group_id)` — Admin-only. Hard delete with cascade.

### Template Default for New Groups

When `create_group` runs:
1. Insert the group row.
2. Add creator as admin in `group_members`.
3. Copy the standard category set (current seeded categories) with the new `group_id`.
4. Copy the standard badge catalog (current 9 seeded badges) with the new `group_id`.
5. Create the current month's Season for the new group.

### Migration Strategy

1. Create `groups` and `group_members` tables.
2. Insert "nojau" group with `visibility = 'private'`.
3. Add all existing active members to "nojau" as members (not admins — determine original creator or first member as admin).
4. Add `group_id` column (nullable initially) to all scoping tables.
5. Backfill all existing rows with `group_id = nojau_id`.
6. Make `group_id` NOT NULL.
7. Add FK constraints.
8. Create `is_group_member()` and `is_group_admin()` functions.
9. Rewrite all RLS policies.
10. Drop old `is_member()` usage from content policies (keep for platform-level checks).
11. Create seed data RPC for new group template.

### URL Routing

Group-scoped routes: `/g/{groupSlug}/...`

- `/g` — "Mis Grupos" screen (list of user's groups + public group catalog for discovery)
- `/g/{groupSlug}` — Group home (materials, sessions, members of that group)
- `/g/{groupSlug}/materials` — Materials list within group
- `/g/{groupSlug}/sessions/{sessionId}/room` — Session room within group
- `/g/{groupSlug}/members` — Roster within group
- `/g/{groupSlug}/settings` — Group settings (admin only)

Existing routes that are not group-scoped:
- `/profile` — User profile (global)
- `/invitations` — Platform invitations (padrinazgo)

### Group Context in the App

A `GroupContext` provider wraps group-scoped routes. It provides:
- Current `group_id` and `group_slug`
- Current user's role in this group (`admin` / `member`)
- Group metadata (name, avatar, visibility)

All data hooks consume this context to scope their queries.

### Presence / Realtime

The current `club-roster` Realtime channel becomes group-scoped: `group-{groupId}-roster`. Presence is per-group — when inside Group A, you only see members of Group A online.

## Testing Decisions

### Testing Principles

- Test external behavior, not implementation details.
- RLS policies are the critical correctness boundary — they must be tested against a real Supabase instance, not mocked.
- Group isolation is the most important property to verify: data in Group A must be invisible to members of Group B.

### Testing Seams

**Seam 1 — RLS Integration Tests (primary, highest priority)**

New test file: `tests/groups/rls-isolation.test.ts`

Pattern: Same as `tests/membership.test.ts` — service-role client for setup/assertion, authenticated client for policy testing.

Key scenarios:
- Member of Group A cannot SELECT materials from Group B.
- Member of Group A cannot INSERT materials into Group B.
- Non-member cannot see any group content (public or private).
- Member of a public group can see that group's content.
- Non-member of a private group cannot even see the group exists.
- Admin can manage group members; non-admin cannot.
- Leaving a group revokes access to all group content.
- `is_group_member()` correctly handles active/invited/left member statuses.

New test file: `tests/groups/group-management.test.ts`

Pattern: Same integration approach.

Key scenarios:
- Create group → creator is admin, default categories/badges are seeded.
- Join public group → instant membership.
- Cannot join private group without invitation token.
- Admin can remove member; removed member's past contributions persist.
- Sole admin leaving promotes oldest member.
- Delete group → all cascading data removed.

**Seam 2 — Unit Tests (data access layer)**

New test files: `tests/groups/group-actions.test.ts`, `tests/groups/group-queries.test.ts`

Pattern: Mock Supabase with `{ from }` dependency injection (existing pattern).

Key scenarios:
- Group CRUD actions call correct Supabase methods with `group_id`.
- Group listing filters by membership.
- Public group catalog returns correct fields.

**Seam 3 — Component Tests (UI)**

New test files: `tests/groups/group-switcher.test.tsx`, `tests/groups/group-discovery.test.tsx`

Pattern: React Testing Library + jsdom with mocked actions (existing pattern in `room-panel-harness.tsx`).

Key scenarios:
- "Mis Grupos" renders user's groups.
- Group switcher navigates between groups.
- Public group catalog shows discovery info (name, counts) but not content.
- Admin settings page shows management controls for admins only.

**Seam 4 — E2E Tests**

New test file: `e2e/group-lifecycle.spec.ts`

Pattern: Playwright (existing pattern in `e2e/session-lifecycle.spec.ts`).

Key scenarios:
- Create group → see it in "Mis Grupos" → enter → create material → create session.
- Public group: second user discovers and joins → can participate in session.
- Private group: admin generates invite link → second user uses link → joins.
- Member leaves group → cannot see group content anymore.

## Out of Scope

- **Cross-group features**: No dashboards, feeds, or activity streams that aggregate across groups. Each group is fully siloed.
- **Group-level configuration beyond basics**: No group-specific settings for session behavior, draw rules, debate timers, etc. Those remain global app behavior.
- **Archived/soft-deleted groups**: Hard delete only. No "archive group" state.
- **Member limits per group**: No caps on group size.
- **Group search/discovery beyond basic catalog**: No search, filters, tags, or recommendations for finding public groups. Just a list.
- **Migration of anon access**: The current anon SELECT on materials/sessions is removed. Public-per-group anon access can be added later.
- **Per-group identity**: One global identity per Miembro. No group-specific names or avatars.
- **Cross-group gamification**: No leaderboard or stats that span multiple groups. Gamification is fully per-group.

## Further Notes

### Glossary Changes (to be applied to CONTEXT.md)

- **System description**: "Club de lectura y conversación" → "Plataforma que aloja grupos de lectura y conversación."
- **Miembro**: Updated to "Una persona con cuenta en la plataforma, con acceso a la aplicación. Su relación con contenidos es a través de los Grupos a los que pertenece."
- **New term — Grupo**: Comunidad aislada dentro de la plataforma, con sus propios Materiales, Sesiones, Categorías, Temporadas, Insignias y Conteos. Puede ser público o privado.
- **New term — Administrador del Grupo**: Miembro con poderes de gestión sobre un Grupo (editar info, invitar/expulsar miembros, eliminar grupo, nombrar co-admins). Puede haber varios. No confundir con Moderador de Sesión.
- **New term — Invitación al Grupo**: Acto por el que un Administrador invita a un Miembro existente a unirse a un Grupo privado, mediante enlace compartible con token. Distinta de la Invitación (padrinazgo).

### ADR Candidate

The decision to use **full isolation** (each group is a complete, self-contained universe with its own categories, badges, seasons, and gamification) rather than **partial isolation** (shared categories/badges/seasons across groups, only materials/sessions scoped) warrants an ADR because:

1. **Hard to reverse**: Moving from full to partial isolation later requires merging per-group data back into shared tables — a complex migration.
2. **Surprising without context**: A future reader will wonder why categories and badges are duplicated per-group instead of shared.
3. **Real trade-off**: Partial isolation is simpler (fewer tables to scope) but creates complex permission questions (who manages shared categories?) and breaks the mental model of "group = independent club."

### Migration Risk

The migration is the highest-risk part of this feature. Every RLS policy in the system (~40+ policies across 20+ tables) must be rewritten. The migration must be done in a single transaction to avoid a window where policies are inconsistent. A staging environment test is strongly recommended before production deployment.
