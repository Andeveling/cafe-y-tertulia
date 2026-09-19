-- Issues #59/#60/#61: Categorías y Maestrías — tablas base.
-- Categoría cuelga del Material (puente 1..N); la Sesión sin Material lleva
-- las suyas propias (session_categories). La Sesión con Material hereda:
-- session_categories solo acepta sesiones sin material (trigger).
-- Maestría no crea tablas: deriva de counts/awards por categoría.

-- ============================================================
-- 1. Tablas
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table public.material_categories (
  material_id uuid not null references public.materials (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (material_id, category_id)
);

create table public.session_categories (
  session_id uuid not null references public.sessions (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, category_id)
);

-- Búsqueda inversa por categoría (la PK cubre el otro sentido).
create index material_categories_category_idx on public.material_categories (category_id);
create index session_categories_category_idx on public.session_categories (category_id);

-- ============================================================
-- 2. Guard: session_categories solo sin material
-- ============================================================

create or replace function public.session_categories_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  sess record;
begin
  -- session_child_frozen_guard() no conoce esta tabla (rama else = no-op):
  -- el congelado vive aquí.
  if TG_OP = 'DELETE' then
    select material_id, status into sess from public.sessions where id = old.session_id;
  else
    select material_id, status into sess from public.sessions where id = new.session_id;
  end if;
  if sess.status = 'archived' then
    raise exception 'La sesión en histórico es inmutable (%)', TG_TABLE_NAME using errcode='P0001';
  elsif sess.status = 'closed' then
    raise exception 'No se puede modificar % en sesión cerrada', TG_TABLE_NAME using errcode='P0001';
  end if;
  if TG_OP <> 'DELETE' and sess.material_id is not null then
    raise exception 'La sesión con material hereda sus categorías (%)', TG_TABLE_NAME using errcode='P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger session_categories_guard
  before insert or update or delete on public.session_categories
  for each row execute function public.session_categories_guard();

-- ============================================================
-- 3. RLS (club cerrado: is_member; etiquetado por cualquier miembro activo)
-- ============================================================

alter table public.categories enable row level security;
alter table public.material_categories enable row level security;
alter table public.session_categories enable row level security;

create policy "categories_select_member" on public.categories
  for select to authenticated
  using (public.is_member());

create policy "material_categories_select_member" on public.material_categories
  for select to authenticated
  using (public.is_member());

create policy "material_categories_write_member" on public.material_categories
  for all to authenticated
  using (public.is_member())
  with check (public.is_member());

create policy "session_categories_select_member" on public.session_categories
  for select to authenticated
  using (public.is_member());

create policy "session_categories_write_member" on public.session_categories
  for all to authenticated
  using (public.is_member())
  with check (public.is_member());

grant select on public.categories to authenticated, service_role;
grant select, insert, update, delete on public.material_categories, public.session_categories to authenticated, service_role;

-- ============================================================
-- 4. Seeds: 5 categorías (icono = export de @hugeicons/core-free-icons)
-- ============================================================

insert into public.categories (key, name, icon) values
  ('filosofia', 'Filosofía', 'Idea01Icon'),
  ('cine', 'Cine', 'ClapperboardIcon'),
  ('actualidad', 'Actualidad', 'NewspaperIcon'),
  ('poesia', 'Poesía', 'FeatherIcon'),
  ('historia', 'Historia', 'LandmarkIcon')
on conflict (key) do update set name = excluded.name, icon = excluded.icon;
