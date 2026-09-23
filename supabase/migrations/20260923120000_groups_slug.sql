-- Multi-grupo slug para rutas /g/{slug} (#75, PRD #69, ADR-0013).
--
-- Se aplica DESPUÉS del expand #71 (20260923000000), que crea groups sin
-- slug. Extraído del expand convergente de #75 sin duplicar tablas,
-- helpers, RLS ni RPCs (ya existen en #71 con siembra verificada).

-- Columna slug si la tabla ya existía sin ella (#71 antes).
alter table public.groups add column if not exists slug text;

-- Generador de slugs únicos (misma regla que slugify() en lib/groups).
create or replace function public.groups_unique_slug(p_name text, p_exclude uuid default null)
returns text
language plpgsql
stable
set search_path = public
as $body$
declare
	v_base text;
	v_slug text;
	v_n int := 0;
begin
	v_base := regexp_replace(
		lower(translate(trim(coalesce(p_name, '')),
			'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ',
			'aeiouunAEIOUUNaeiouAEIOUaeiouAEIOUaeiouAEIOUcc')),
		'[^a-z0-9]+', '-', 'g');
	v_base := regexp_replace(v_base, '^-+|-+$', '', 'g');
	if v_base = '' then v_base := 'grupo'; end if;
	v_slug := v_base;
	while exists (
		select 1 from public.groups g
		where g.slug = v_slug and (p_exclude is null or g.id <> p_exclude)
	) loop
		v_n := v_n + 1;
		v_slug := v_base || '-' || v_n;
	end loop;
	return v_slug;
end;
$body$;

-- Backfill de slugs para filas preexistentes sin slug (incluye "nojau").
do $bf$
declare
	r record;
begin
	for r in
		select id, name from public.groups
		where slug is null or btrim(slug) = ''
	loop
		update public.groups
		set slug = public.groups_unique_slug(r.name, r.id)
		where id = r.id;
	end loop;
end
$bf$;

-- NOT NULL + unicidad de slug.
alter table public.groups alter column slug set not null;

do $$ begin
	if not exists (
		select 1 from pg_constraint c
		join pg_class t on t.oid = c.conrelid
		join pg_namespace n on n.oid = t.relnamespace
		where c.conname = 'groups_slug_key'
			and t.relname = 'groups'
			and n.nspname = 'public'
	) then
		alter table public.groups add constraint groups_slug_key unique (slug);
	end if;
end $$;

-- Trigger: todo grupo termina con slug aunque el INSERT no lo traiga
-- (vale para create_group de #71 y para inserts directos).
create or replace function public.groups_fill_slug()
returns trigger
language plpgsql
set search_path = public
as $trig$
begin
	if NEW.slug is null or btrim(NEW.slug) = '' then
		NEW.slug := public.groups_unique_slug(NEW.name, NEW.id);
	end if;
	return NEW;
end;
$trig$;

drop trigger if exists groups_fill_slug on public.groups;
create trigger groups_fill_slug
	before insert or update of name, slug on public.groups
	for each row execute function public.groups_fill_slug();

create index if not exists groups_visibility_idx on public.groups (visibility);

grant execute on function public.groups_unique_slug(text, uuid) to authenticated, service_role;
