-- Seeder de datos de prueba para Café y Tertulia
-- Uso:
--   supabase db reset            (ejecuta migrations + seed.sql + este archivo)
--   o solo estos datos:
--   docker exec -i supabase_db_cafe-y-tertulia psql -U postgres < supabase/seeds/test-data.sql
--
-- Idempotente: UUIDs deterministas + ON CONFLICT. Se puede correr N veces.
-- Requiere que seed.sql haya creado los miembros base.

begin;

do $$
declare
  andres_id uuid;
  tertuliano_id uuid;
  mat_id uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  ses_lobby_id uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  ses_hist_id uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
begin
  select id into andres_id from auth.users where email = 'andresparra.nojau@gmail.com';
  select id into tertuliano_id from auth.users where email = 'tertuliano@test.local';

  if andres_id is null or tertuliano_id is null then
    raise notice 'test-data: faltan miembros base; corré primero supabase/seed.sql';
    return;
  end if;

  -- Asegura membresía activa (por si cambió)
  insert into public.members (id, status, display_name) values
    (andres_id, 'active', 'Andrés Parra'),
    (tertuliano_id, 'active', 'Tertuliano Test')
  on conflict (id) do update set status = 'active';

  -- ── Material bajo prueba ────────────────────────────────────────────────
  insert into public.materials (id, title, kind, author, status, created_by)
  values (mat_id, 'Cien años de soledad', 'book', 'G. García Márquez', 'in_progress', andres_id)
  on conflict (id) do nothing;

  -- ── Sesión en lobby (flujo activo: presencia → sorteo → debate) ─────────
  insert into public.sessions (id, material_id, range, status, moderator_id)
  values (ses_lobby_id, mat_id, 'Capítulos 1-3', 'lobby', andres_id)
  on conflict (id) do nothing;

  insert into public.session_participants (session_id, member_id)
  values (ses_lobby_id, andres_id), (ses_lobby_id, tertuliano_id)
  on conflict (session_id, member_id) do nothing;

  -- Preguntas del pool para el Sorteo
  insert into public.questions (id, session_id, material_id, author_id, text) values
    ('cccccccc-0000-0000-0000-000000000001', ses_lobby_id, mat_id, tertuliano_id,
     '¿Por qué Macondo atrae tanto a los personajes que llegan después?'),
    ('cccccccc-0000-0000-0000-000000000002', ses_lobby_id, mat_id, andres_id,
     '¿El tiempo circular es destino o elección en la familia Buendía?'),
    ('cccccccc-0000-0000-0000-000000000003', ses_lobby_id, mat_id, tertuliano_id,
     '¿Qué papel juega la memoria colectiva frente al olvido?')
  on conflict (id) do nothing;

  -- ── Sesión histórica (memoria del club, solo lectura) ───────────────────
  insert into public.sessions (id, material_id, range, status, moderator_id)
  values (ses_hist_id, mat_id, 'Capítulo prólogo', 'archived', andres_id)
  on conflict (id) do nothing;

  insert into public.session_participants (session_id, member_id)
  values (ses_hist_id, andres_id), (ses_hist_id, tertuliano_id)
  on conflict (session_id, member_id) do nothing;

  insert into public.questions (id, session_id, material_id, author_id, text) values
    ('cccccccc-0000-0000-0000-000000000004', ses_hist_id, mat_id, andres_id,
     '¿Qué esperábamos del club antes de empezar el libro?')
  on conflict (id) do nothing;

  raise notice 'test-data OK: material % · sesión lobby % · sesión histórica %', mat_id, ses_lobby_id, ses_hist_id;
end
$$;

commit;
