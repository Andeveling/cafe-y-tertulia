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
  nojau_id uuid;
  mat_id uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  ses_lobby_id uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  ses_hist_id uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
begin
  select id into andres_id from auth.users where email = 'andresparra.nojau@gmail.com';
  select id into tertuliano_id from auth.users where email = 'tertuliano@test.local';
  select id into nojau_id from public.groups where name = 'nojau' limit 1;

  if andres_id is null or tertuliano_id is null then
    raise notice 'test-data: faltan miembros base; corré primero supabase/seed.sql';
    return;
  end if;

  if nojau_id is null then
    raise notice 'test-data: falta grupo nojau; revisá migraciones multi-grupo';
    return;
  end if;

  -- Asegura membresía activa (por si cambió)
  insert into public.members (id, status, display_name) values
    (andres_id, 'active', 'Andrés Parra'),
    (tertuliano_id, 'active', 'Tertuliano Test')
  on conflict (id) do update set status = 'active';

  -- ── Material bajo prueba ────────────────────────────────────────────────
  insert into public.materials (id, group_id, title, kind, author, status, created_by)
  values (mat_id, nojau_id, 'Cien años de soledad', 'book', 'G. García Márquez', 'in_progress', andres_id)
  on conflict (id) do nothing;

  -- ── Sesión en lobby (flujo activo: presencia → sorteo → debate) ─────────
  insert into public.sessions (id, group_id, material_id, range, status, moderator_id)
  values (ses_lobby_id, nojau_id, mat_id, 'Capítulos 1-3', 'lobby', andres_id)
  on conflict (id) do nothing;

  insert into public.session_participants (session_id, member_id, group_id)
  values (ses_lobby_id, andres_id, nojau_id), (ses_lobby_id, tertuliano_id, nojau_id)
  on conflict (session_id, member_id) do nothing;

  -- Preguntas del pool para el Sorteo
  insert into public.questions (id, session_id, material_id, author_id, text, group_id) values
    ('cccccccc-0000-0000-0000-000000000001', ses_lobby_id, mat_id, tertuliano_id,
     '¿Por qué Macondo atrae tanto a los personajes que llegan después?', nojau_id),
    ('cccccccc-0000-0000-0000-000000000002', ses_lobby_id, mat_id, andres_id,
     '¿El tiempo circular es destino o elección en la familia Buendía?', nojau_id),
    ('cccccccc-0000-0000-0000-000000000003', ses_lobby_id, mat_id, tertuliano_id,
     '¿Qué papel juega la memoria colectiva frente al olvido?', nojau_id)
  on conflict (id) do nothing;

  -- ── Sesión histórica (memoria del club, solo lectura) ───────────────────
  -- Primero creamos la sesión en preparación, luego participantes y preguntas,
  -- y finalmente la archivamos (el frozen guard bloquea inserts en archived).
  insert into public.sessions (id, group_id, material_id, range, status, moderator_id)
  values (ses_hist_id, nojau_id, mat_id, 'Capítulo prólogo', 'preparation', andres_id)
  on conflict (id) do nothing;

  insert into public.session_participants (session_id, member_id, group_id)
  values (ses_hist_id, andres_id, nojau_id), (ses_hist_id, tertuliano_id, nojau_id)
  on conflict (session_id, member_id) do nothing;

  insert into public.questions (id, session_id, material_id, author_id, text, group_id) values
    ('cccccccc-0000-0000-0000-000000000004', ses_hist_id, mat_id, andres_id,
     '¿Qué esperábamos del club antes de empezar el libro?', nojau_id)
  on conflict (id) do nothing;

  -- Archivamos la sesión: preparation → lobby → in_progress → closed → archived
  -- (forward-only guard exige cada paso)
  update public.sessions set status = 'lobby' where id = ses_hist_id;
  update public.sessions set status = 'in_progress' where id = ses_hist_id;
  update public.sessions set status = 'closed' where id = ses_hist_id;
  update public.sessions set status = 'archived' where id = ses_hist_id;

  raise notice 'test-data OK: material % · sesión lobby % · sesión histórica %', mat_id, ses_lobby_id, ses_hist_id;
end
$$;

commit;
