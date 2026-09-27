-- Categorías de crecimiento: el club tertulia sobre todo desarrollo
-- personal y hábitos (Grit, Mindset, Hábitos atómicos, Hyperfocus),
-- salud (La revolución de la glucosa) y emprendimiento (podcasts).
-- Las 5 originales (filosofía, cine, actualidad, poesía, historia)
-- no cubrían esos materiales.
--
-- Siembra por grupo (categories es por-grupo desde #71): cada grupo
-- existente recibe las 4 claves; los grupos futuros las heredan vía
-- create_group, que copia la plantilla (nojau). Idempotente por
-- (group_id, key).

insert into public.categories (group_id, key, name, icon)
select g.id, v.key, v.name, v.icon
from public.groups g
cross join (values
  ('desarrollo-personal', 'Desarrollo personal', 'SparklesIcon'),
  ('habitos-productividad', 'Hábitos y productividad', 'Target02Icon'),
  ('salud-bienestar', 'Salud y bienestar', 'HealthIcon'),
  ('emprendimiento', 'Emprendimiento', 'Rocket01Icon')
) as v(key, name, icon)
on conflict (group_id, key)
  do update set name = excluded.name, icon = excluded.icon;
