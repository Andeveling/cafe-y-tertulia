-- Ticket #21: insignias, hitos, conteos y temporadas (SPEC §2.10–2.13, §6; ADR 0004)

create type public.badge_kind as enum ('individual', 'collective');
create type public.count_event as enum (
  'question_created', 'session_attended', 'trivia_won', 'exposition_done',
  'material_finished'
);
create type public.season_status as enum ('open', 'closed');
create type public.recognition_category as enum (
  'trivia_master', 'great_debater', 'question_creator', 'perfect_attendance'
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.season_status not null default 'open',
  created_at timestamptz not null default now(),
  constraint seasons_dates_valid check (ends_at > starts_at),
  constraint seasons_month_natural check (
    starts_at = date_trunc('month', starts_at)
    and ends_at = date_trunc('month', ends_at)
    and ends_at = starts_at + interval '1 month'
  )
);

create unique index seasons_one_open on public.seasons (status) where status = 'open';

alter table public.sessions add column season_id uuid references public.seasons (id);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  emoji text not null,
  kind public.badge_kind not null,
  created_at timestamptz not null default now()
);

create table public.awards (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references public.badges (id),
  member_id uuid references public.members (id),
  session_id uuid references public.sessions (id),
  assignment_id uuid,
  trigger text not null,
  created_at timestamptz not null default now(),
  constraint award_target check (member_id is not null or session_id is null)
);

create table public.counts (
  member_id uuid references public.members (id),
  event public.count_event not null,
  season_id uuid not null references public.seasons (id),
  value integer not null default 0 check (value >= 0),
  constraint counts_member_or_club check (member_id is not null or event in ('material_finished'))
);

create unique index counts_member_unique on public.counts (member_id, event, season_id) where member_id is not null;
create unique index counts_club_unique on public.counts (event, season_id) where member_id is null;
);

create table public.season_recognitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id),
  member_id uuid not null references public.members (id),
  category public.recognition_category not null,
  created_at timestamptz not null default now(),
  unique (season_id, category)
);

insert into public.badges (key, emoji, kind) values
  ('first_question', '☕', 'individual'),
  ('elephant_memory', '🧠', 'individual'),
  ('perspective_shift', '🔥', 'individual'),
  ('thought_provoking_question', '🎯', 'individual'),
  ('perfect_participation', '⭐', 'individual'),
  ('consistent_reader', '📚', 'individual'),
  ('first_book_finished', '🏆', 'collective'),
  ('fifty_sessions', '🏆', 'collective'),
  ('hundred_questions', '🏆', 'collective');

alter table public.seasons enable row level security;
alter table public.badges enable row level security;
alter table public.awards enable row level security;
alter table public.counts enable row level security;
alter table public.season_recognitions enable row level security;

create policy "gamification_select_member" on public.seasons for select to authenticated using (public.is_member());
create policy "badges_select_member" on public.badges for select to authenticated using (public.is_member());
create policy "awards_select_member" on public.awards for select to authenticated using (public.is_member());
create policy "counts_select_member" on public.counts for select to authenticated using (public.is_member());
create policy "recognitions_select_member" on public.season_recognitions for select to authenticated using (public.is_member());

-- Otorgamientos subjetivos: únicamente el moderador de la Sesión, incluso a sí mismo.
create policy "awards_insert_moderator" on public.awards for insert to authenticated
with check (
  public.is_member()
  and session_id is not null
  and public.is_session_moderator(session_id)
  and exists (select 1 from public.badges b where b.id = badge_id and b.kind = 'individual')
);

grant select, insert, update, delete on public.seasons, public.badges, public.awards,
  public.counts, public.season_recognitions to authenticated, service_role;
-- Conteo base: cada Pregunta creada alimenta la temporada abierta y la primera insignia.
create function public.record_question_gamification()
returns trigger language plpgsql security definer set search_path = public
as $$
declare season uuid; badge uuid; n integer;
begin
  select id into season from public.seasons where status = 'open' order by starts_at desc limit 1;
  if season is null then return new; end if;
  update public.counts
    set value = value + 1
    where member_id = new.author_id and event = 'question_created' and season_id = season;
  if not found then
    insert into public.counts (member_id, event, season_id, value)
      values (new.author_id, 'question_created', season, 1);
  end if;
  select value into n from public.counts where member_id = new.author_id and event = 'question_created' and season_id = season;
  select id into badge from public.badges where key = 'first_question';
  if n = 1 and not exists (select 1 from public.awards where badge_id = badge and member_id = new.author_id) then
    insert into public.awards (badge_id, member_id, session_id, trigger) values (badge, new.author_id, new.session_id, 'first_question');
  end if;
  return new;
end $$;

create trigger questions_record_gamification after insert on public.questions
for each row execute function public.record_question_gamification();

create function public.ensure_current_season()
returns public.seasons language plpgsql security definer set search_path = public
as $$
declare result public.seasons;
begin
  insert into public.seasons (starts_at, ends_at)
  values (date_trunc('month', now()), date_trunc('month', now()) + interval '1 month')
  on conflict do nothing;
  select * into result from public.seasons where starts_at = date_trunc('month', now()) limit 1;
  return result;
end $$;

grant execute on function public.ensure_current_season() to authenticated, service_role;
comment on function public.ensure_current_season() is 'Crea la Temporada del mes bajo demanda; el cron puede invocarla al cambio de mes.';
