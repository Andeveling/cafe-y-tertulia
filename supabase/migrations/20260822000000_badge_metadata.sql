-- Extends badges table with display metadata so new badges are data-only,
-- no code changes needed. Also adds metadata to recognition categories.

-- 1. Add name and description to badges
alter table public.badges add column name text not null default '';
alter table public.badges add column description text not null default '';

-- 2. Populate existing badges
update public.badges set
  name = case key
    when 'first_question' then 'Primera pregunta'
    when 'elephant_memory' then 'Memoria de elefante'
    when 'perspective_shift' then 'Cambio de perspectiva'
    when 'thought_provoking_question' then 'Pregunta que hizo pensar'
    when 'perfect_participation' then 'Participación perfecta'
    when 'consistent_reader' then 'Lector constante'
    when 'first_book_finished' then 'Primer libro terminado'
    when 'fifty_sessions' then '50 sesiones'
    when 'hundred_questions' then '100 preguntas'
    else key
  end,
  description = case key
    when 'first_question' then 'Creá tu primera pregunta para una sesión'
    when 'elephant_memory' then 'Ganá una ronda de trivia'
    when 'perspective_shift' then 'El moderador la otorga en vivo durante el debate'
    when 'thought_provoking_question' then 'El moderador la otorga cuando tu pregunta genera un debate profundo'
    when 'perfect_participation' then 'Prepará pregunta o trivia y exponé si te toca, sin faltar al cierre'
    when 'consistent_reader' then 'Asistí a varias sesiones consecutivas'
    when 'first_book_finished' then 'El club terminó su primer material'
    when 'fifty_sessions' then 'El club alcanzó 50 sesiones realizadas'
    when 'hundred_questions' then 'El club debatió 100 preguntas'
    else ''
  end;

-- 3. Remove the defaults (now that data is populated)
alter table public.badges alter column name drop default;
alter table public.badges alter column description drop default;

-- 4. Add metadata to recognition categories via a lookup table
create table public.recognition_category_meta (
  category public.recognition_category primary key,
  emoji text not null,
  name text not null
);

insert into public.recognition_category_meta (category, emoji, name) values
  ('trivia_master', '🧠', 'Maestro de la trivia'),
  ('great_debater', '🎤', 'Gran debatiente'),
  ('question_creator', '✍️', 'Creador de preguntas'),
  ('perfect_attendance', '📅', 'Asistencia perfecta');

alter table public.recognition_category_meta enable row level security;
create policy "recognition_meta_select" on public.recognition_category_meta
  for select to authenticated using (true);
grant select on public.recognition_category_meta to authenticated, service_role;
