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
  mem record;
  ses_n int;
  ses_id uuid;
  mat_mem_id uuid;
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

  -- El guard de histórico dispara en el INSERT, antes del ON CONFLICT.
  insert into public.session_participants (session_id, member_id, group_id)
  select ses_hist_id, member_id, nojau_id
  from (values (andres_id), (tertuliano_id)) as m(member_id)
  where exists (
    select 1 from public.sessions
    where id = ses_hist_id and status not in ('closed', 'archived')
  )
  on conflict (session_id, member_id) do nothing;

  insert into public.questions (id, session_id, material_id, author_id, text, group_id)
  select
    'cccccccc-0000-0000-0000-000000000004',
    ses_hist_id,
    mat_id,
    andres_id,
    '¿Qué esperábamos del club antes de empezar el libro?',
    nojau_id
  where exists (
    select 1 from public.sessions
    where id = ses_hist_id and status not in ('closed', 'archived')
  )
  on conflict (id) do nothing;

  -- Archivamos la sesión: preparation → lobby → in_progress → closed → archived
  -- (forward-only guard exige cada paso; el filtro deja el seed reaplicable)
  update public.sessions set status = 'lobby' where id = ses_hist_id and status = 'preparation';
  update public.sessions set status = 'in_progress' where id = ses_hist_id and status = 'lobby';
  update public.sessions set status = 'closed' where id = ses_hist_id and status = 'in_progress';
  update public.sessions set status = 'archived' where id = ses_hist_id and status = 'closed';

  -- ── Memoria: terminados con sesiones reales y rating congelado ────────
  -- La estantería cuenta sessions(id) y muestra el agregado. Se nace en
  -- preparación (el histórico no acepta hijos) y se archiva paso a paso.
  for mem in
    select *
    from (
      values
        (10, 'El arte de conversar'::text, 'podcast'::public.material_kind, 'Radio Ambulante'::text, 1, 4.0::numeric, 2, interval '12 days'),
        (11, 'The Anthropocene Reviewed', 'podcast'::public.material_kind, 'John Green', 2, null::numeric, 0, interval '28 days'),
        (12, 'Sapiens: de animales a dioses, una breve historia de la humanidad', 'book'::public.material_kind, 'Yuval Noah Harari', 6, 3.5::numeric, 4, interval '40 days'),
        (13, 'Everything is a Remix', 'video'::public.material_kind, 'Kirby Ferguson', 2, 4.0::numeric, 2, interval '70 days'),
        (14, 'Cómo mienten los mapas', 'article'::public.material_kind, 'Mark Monmonier', 1, 2.5::numeric, 1, interval '100 days'),
        (15, 'Pedro Páramo', 'book'::public.material_kind, 'Juan Rulfo', 3, 5.0::numeric, 2, interval '140 days'),
        (16, 'Los detectives salvajes', 'book'::public.material_kind, 'R. Bolaño', 4, 4.5::numeric, 2, interval '200 days')
    ) as t(n, title, kind, author, sessions, rating_avg, rating_count, age)
  loop
    mat_mem_id := format('aaaaaaaa-0000-0000-0000-%s', lpad(mem.n::text, 12, '0'))::uuid;

    insert into public.materials (
      id, group_id, title, kind, author, status, created_by, created_at
    ) values (
      mat_mem_id, nojau_id, mem.title, mem.kind, mem.author, 'finished', andres_id, now() - mem.age
    )
    on conflict (id) do nothing;

    for ses_n in 1..mem.sessions loop
      ses_id := format(
        'bbbbbbbb-%s-0000-0000-%s',
        lpad(mem.n::text, 4, '0'),
        lpad(ses_n::text, 12, '0')
      )::uuid;

      insert into public.sessions (
        id, group_id, material_id, range, status, moderator_id, rating_avg, rating_count
      ) values (
        ses_id,
        nojau_id,
        mat_mem_id,
        'Sesión ' || ses_n,
        'preparation',
        andres_id,
        case when ses_n = 1 and mem.rating_count > 0 then mem.rating_avg else null end,
        case when ses_n = 1 then mem.rating_count else 0 end
      )
      on conflict (id) do nothing;

      update public.sessions set status = 'lobby' where id = ses_id and status = 'preparation';
      update public.sessions set status = 'in_progress' where id = ses_id and status = 'lobby';
      update public.sessions set status = 'closed' where id = ses_id and status = 'in_progress';
      update public.sessions set status = 'archived' where id = ses_id and status = 'closed';
    end loop;

    perform public.refresh_material_rating(mat_mem_id);
  end loop;

  raise notice 'test-data OK: material % · sesión lobby % · sesión histórica % · memoria sembrada', mat_id, ses_lobby_id, ses_hist_id;
end
$$;

commit;
