-- Ticket #34: Sistema de Niveles de Miembro (LVL 0-5)
-- Niveles derivados de Conteos (sesiones asistidas) + Insignias individuales.
-- Sin tabla nueva — la función calcula on-the-fly.

-- 1. Función principal: calcula nivel, título y progreso.
create or replace function public.compute_member_level(target_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  sessions_total int := 0;
  insignias_count int := 0;
  lvl int := 0;
  title text := '';
  current_threshold int := 0;
  next_threshold int := 1;
  next_title text := 'Novato';
  next_insignias_required int := 0;
begin
  -- Contar sesiones asistidas (acumulado global, no por temporada).
  select coalesce(sum(value), 0) into sessions_total
  from public.counts
  where member_id = target_member_id
    and event = 'session_attended';

  -- Contar insignias individuales otorgadas.
  select count(*) into insignias_count
  from public.awards a
  join public.badges b on b.id = a.badge_id
  where a.member_id = target_member_id
    and b.kind = 'individual';

  -- Calcular nivel según umbrales y gates de insignias.
  -- LVL 0: 0 sesiones
  -- LVL 1: ≥1 sesión (Novato)
  -- LVL 2: ≥5 sesiones (Parroquiano)
  -- LVL 3: ≥12 sesiones Y ≥1 insignia (Habitual)
  -- LVL 4: ≥25 sesiones Y ≥2 insignias (Veterano)
  -- LVL 5: ≥50 sesiones Y ≥3 insignias (Sabio)

  if sessions_total >= 50 and insignias_count >= 3 then
    lvl := 5; title := 'Sabio'; current_threshold := 50;
    next_threshold := 50; next_title := 'Sabio'; next_insignias_required := 3;
  elsif sessions_total >= 25 and insignias_count >= 2 then
    lvl := 4; title := 'Veterano'; current_threshold := 25;
    next_threshold := 50; next_title := 'Sabio'; next_insignias_required := 3;
  elsif sessions_total >= 12 and insignias_count >= 1 then
    lvl := 3; title := 'Habitual'; current_threshold := 12;
    next_threshold := 25; next_title := 'Veterano'; next_insignias_required := 2;
  elsif sessions_total >= 5 then
    lvl := 2; title := 'Parroquiano'; current_threshold := 5;
    next_threshold := 12; next_title := 'Habitual'; next_insignias_required := 1;
  elsif sessions_total >= 1 then
    lvl := 1; title := 'Novato'; current_threshold := 1;
    next_threshold := 5; next_title := 'Parroquiano'; next_insignias_required := 0;
  else
    lvl := 0; title := ''; current_threshold := 0;
    next_threshold := 1; next_title := 'Novato'; next_insignias_required := 0;
  end if;

  return jsonb_build_object(
    'level', lvl,
    'title', title,
    'sessions_attended', sessions_total,
    'insignias_count', insignias_count,
    'current_threshold', current_threshold,
    'next_threshold', next_threshold,
    'next_title', next_title,
    'next_insignias_required', next_insignias_required
  );
end;
$$;

grant execute on function public.compute_member_level(uuid) to authenticated;

comment on function public.compute_member_level(uuid) is
  'Calcula el nivel del Miembro a partir de sesiones asistidas e insignias individuales. Devuelve JSON con level, title, sessions_attended, insignias_count y umbrales del siguiente nivel.';
