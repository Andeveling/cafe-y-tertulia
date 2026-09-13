-- Seed local para Café y Tertulia
-- Uso: supabase db reset  (ejecuta migrations + este seed)
--      o  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql
--
-- Crea/actualiza los miembros base como 'active'
-- Password local: cafe1234  (cámbialo en Supabase Studio si querés)
-- Idempotente: podés correrlo N veces sin duplicar.

do $$
declare
  u record;
  target_password text := 'cafe1234';
  new_user_id uuid;
  instance_uuid uuid := '00000000-0000-0000-0000-000000000000';
  existing_id uuid;
begin
  for u in
    select * from (values
      ('andresparra.nojau@gmail.com', 'Andrés Parra'),
      ('edwarsanz.nojau@gmail.com', 'Edwar Sanz')
    ) as t(email, name)
  loop
  select id into existing_id from auth.users where email = u.email;

  if existing_id is null then
    new_user_id := gen_random_uuid();
    -- 1) auth.users
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin, is_sso_user, is_anonymous
    ) values (
      instance_uuid, new_user_id, 'authenticated', 'authenticated', u.email, crypt(target_password, gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', u.name),
      now(), now(), false, false, false
    );

    -- 2) auth.identities (requerido por GoTrue para login con email)
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      new_user_id::text, new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', u.email),
      'email', now(), now(), now()
    );

    -- 3) public.members (el club)
    insert into public.members (id, status, display_name)
    values (new_user_id, 'active', u.name)
    on conflict (id) do update set status = 'active', display_name = excluded.display_name;

    raise notice 'Seed: creado % (%) con password %', u.email, new_user_id, target_password;
  else
    -- Ya existe: asegúrate que pueda loguearse y sea active
    update auth.users
      set encrypted_password = crypt(target_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('display_name', u.name),
          updated_at = now()
      where id = existing_id;

    -- Asegura identity (si viene de un invite fallido puede faltar)
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      existing_id::text, existing_id,
      jsonb_build_object('sub', existing_id::text, 'email', u.email),
      'email', now(), now(), now()
    ) on conflict (provider_id, provider) do nothing;

    insert into public.members (id, status, display_name)
    values (existing_id, 'active', u.name)
    on conflict (id) do update set status = 'active', display_name = excluded.display_name;

    raise notice 'Seed: actualizado % (%) -> active, password %', u.email, existing_id, target_password;
  end if;
  end loop;
end
$$;

-- Opcional: segundo usuario para probar realtime a 2 puntas sin crear invites
-- Comenta este bloque si no lo necesitás
do $$
declare
  target_email text := 'tertuliano@test.local';
  target_password text := 'cafe1234';
  new_user_id uuid := gen_random_uuid();
  instance_uuid uuid := '00000000-0000-0000-0000-000000000000';
  existing_id uuid;
begin
  select id into existing_id from auth.users where email = target_email;
  if existing_id is null then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin, is_sso_user, is_anonymous)
    values (instance_uuid, new_user_id, 'authenticated', 'authenticated', target_email, crypt(target_password, gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Tertuliano Test"}'::jsonb, now(), now(), false, false, false);
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (new_user_id::text, new_user_id, jsonb_build_object('sub', new_user_id::text, 'email', target_email), 'email', now(), now(), now());
    insert into public.members (id, status, display_name) values (new_user_id, 'active', 'Tertuliano Test') on conflict (id) do update set status='active';
  end if;
end
$$;
