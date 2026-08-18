# Investigación: Supabase Auth y opciones de invitación

Ticket: [#3 — Investigación: Supabase Auth y opciones de invitación](https://github.com/Andeveling/cafe-y-tertulia/issues/3)
Fecha: 2026
Fuentes: documentación oficial de Supabase (supabase.com/docs), referencia JS del SDK, tipos de `@supabase/supabase-js`/`@supabase/auth-js` instalados en `node_modules` (v2.112.3 / auth-js), `supabase/config.toml` del repo y el código de GoTrue (`supabase/supabase`).

## Decisión ya tomada (contexto)

- Email + contraseña (password-based auth), **sin registro público**.
- Membresía **cerrada por invitación** (lista fija de personas del club).
- Toda la UI en español; código en inglés.
- Stack: Next.js 16 (App Router) + `@supabase/ssr` v0.12.4 + `@supabase/supabase-js` v2.112.3.

## Resumen ejecutivo

**Recomendación: desactivar el registro público a nivel de proyecto y crear cada miembro con `supabase.auth.admin.inviteUserByEmail()` desde el servidor (Route Handler / Server Action con la service role key). El invitado recibe un email con un enlace de invitación, define su contraseña y queda como usuario confirmado. Sin signup público: `enable_signup = false` (config.toml) o "Allow new users to sign up" desactivado (dashboard).**

Esta es la opción de menor fricción, usa solo features del free tier, y encaja con `@supabase/ssr` + PKCE para el resto del login. Las alternativas (Admin API con `createUser`, magic links/OTP, generación manual de enlaces con `generateLink`) se comparan abajo.

---

## 1. Opciones para crear usuarios invitados sin signup público

### 1.1 `supabase.auth.admin.inviteUserByEmail(email, options)` — la recomendada

Crea el usuario (si no existe) y envía un email con un **enlace de invitación** (`type=invite`). Al hacer clic, el invitado define su contraseña y su email queda confirmado. Método admin: requiere la **service role key** y solo debe llamarse desde el servidor (`GoTrueAdminApi.inviteUserByEmail`).

- En `node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.d.ts` (líneas 131–136): firma `inviteUserByEmail(email: string, options?: { data?: object; redirectTo?: string }): Promise<UserResponse>`.
- El usuario creado llega con `confirmation_sent_at` seteado y su email confirmado al aceptar (la respuesta de ejemplo muestra `invited_at` y `confirmation_sent_at`).
- **Limitación importante**: no soporta PKCE — "the browser initiating the invite is often different from the browser accepting the invite which makes it difficult to provide the security guarantees required of the PKCE flow" (docs y `.d.ts`). Para el flujo de invitación esto no es problema; para el login normal sí usamos PKCE (SSR).
- La plantilla de email es personalizable ("Invite user", dashboard `Authentication → Email Templates` o `[auth.email.template.invite]` en config.toml) y usa variables como `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Data }}`.

Fricción: la clave de servicio debe vivir solo en el servidor (variable de entorno, nunca en el cliente); el invitado tiene que pasar por el email (si el correo no llega o se escanea y consume el enlace — single-use — hay que reenviar con `resend({ type: 'invite' })` o `inviteUserByEmail` de nuevo).

### 1.2 `supabase.auth.admin.createUser({ email, password, email_confirm: true, ... })` — Admin API directa

Crea el usuario sin enviar email. Útil para importación/migración o cuando tú defines la contraseña inicial. `AdminUserAttributes` (en `lib/types.d.ts`, líneas 450–516) incluye `email`, `password`, `email_confirm`, `user_metadata`, `app_metadata`, `role`, `password_hash` (migración de hashes bcrypt/scrypt/argon2), `id`.

- `createUser()` **no envía** email de confirmación (remarque del `.d.ts`: "will not send a confirmation email to the user").
- Sin `email_confirm: true`, el usuario queda con email sin confirmar y no puede iniciar sesión con password hasta confirmarlo (o confirmarlo vía `updateUserById(..., { email_confirm: true })`).

Fricción: definir/entregar la contraseña inicial (o enviar `generateLink({ type: 'invite' })` después), gestionar el estado "invitado pero no confirmado" a mano. Más código propio que la opción 1.1.

### 1.3 Magic links / OTP — `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })`

Passwordless: el usuario recibe un enlace mágico o un código OTP por email. **Importante**: por defecto `signInWithOtp` **crea el usuario si no existe** (`shouldCreateUser` default `true`, ver `lib/types.d.ts` líneas 571–572). Para membresía cerrada hay que pasar `shouldCreateUser: false`, de modo que solo funcione para emails ya existentes.

Fricción alta para el spec: contradice la decisión de email+contraseña (no hay password), el flujo depende del template de email (magic link vs OTP), y el límite de reenvío es de 60s entre OTPs. No se descarta como mecanismo complementario (p. ej. login sin contraseña de un miembro), pero no como flujo principal.

### 1.4 `supabase.auth.admin.generateLink({ type: 'invite' | 'signup' | 'magiclink' | ... })` — control total del envío

Genera el enlace/token sin enviar el email (crea el usuario para `signup`/`invite`/`magiclink`). Devuelve `action_link`, `email_otp`, `hashed_token`, `verification_type`. Es la base para enviar correos con tu propio proveedor de email (SendGrid, Resend, etc.) o para flujos server-side de SSR (ver la guía de email templates: `verifyOtp({ token_hash, type })` para canjear en el servidor).

Fricción: hay que implementar el envío del correo (SMTP propio o proveedor), el render de la página de canje y el manejo de tokens. Solo vale la pena si quieres control total de la entrega de emails o un flujo de confirmación server-side.

### 1.5 Confirmación de email (signup confirmado) — no es invitación

`supabase.auth.signUp()` + "Confirm email" activado: el usuario se auto-registra y confirma por email. Es el flujo de signup público estándar, **no** una invitación. Con `enable_signup = false` a nivel proyecto no aplica. Se menciona para descartarla.

---

## 2. Cómo desactivar el registro público por completo

Dos capas, ambas recomendadas:

1. **A nivel proyecto** (bloquea el signup de verdad):
   - Hosted: Dashboard → **Authentication → Sign In / Providers** → desactivar **"Allow new users to sign up"**. La doc oficial: "If this config is disabled, only existing users can sign in" ([general-configuration.mdx](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/general-configuration.mdx)).
   - Local/self-hosted: `supabase/config.toml` → `[auth] enable_signup = false` (config actual del repo tiene `enable_signup = true` en `[auth]` y `[auth.email]` — hay que cambiarlo).
2. **A nivel de datos** (defensa en profundidad): RLS + tabla propia de miembros (p. ej. `public.members`) donde el acceso de la app se filtra por membresía, no por "haber creado cuenta".

**Gotcha (config.toml, local)**: en el CLI actual, `[auth.email].enable_signup = false` **desactiva todo el proveedor de email** (los invitados no podrían autenticarse) en lugar de solo bloquear signups — es el bug/confusión documentado en [supabase/supabase#40582](https://github.com/supabase/supabase/issues/40582). Para invitación-only el arreglo es: `[auth] enable_signup = false` (global) dejando `[auth.email].enable_signup = true` (proveedor email encendido). Verificado contra el repo de Supabase (GoTrue/CLI, nov 2025).

---

## 3. Límites del free tier relevantes

Fuente: [supabase.com/pricing](https://supabase.com/pricing) y [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod).

- **Usuarios: ilimitados** (Total Users: Unlimited). Los **MAUs** incluidos son 50.000 — irrelevante para un club de ~8 personas.
- **Emails de Auth** (con el servicio por defecto, sin SMTP propio): **2 emails por hora** por proyecto (rate limit de `/auth/v1/signup`, `/auth/v1/recover`, `/auth/v1/user`, actualizado el 3-sep-2024). Con **SMTP propio** el límite sube a **30 usuarios nuevos por hora** (custom SMTP rate limit).
  - Invitaciones: son emails de auth → aplicar el límite de 2/h (servicio por defecto) o 30/h (SMTP propio). Para un club de ~8 personas, da de sobra.
  - Además: límite de 60s entre envíos de OTP/magic link por usuario, 30 signups/sign-ins por IP en ventana de 5 min, y 360 OTPs/hora (endpoints `/auth/v1/otp`).
- **Proyecto**: 500 MB de DB, se pausa tras 1 semana de inactividad (free), 2 proyectos activos.
- **Custom SMTP**: incluido en free (con branding de Supabase en los emails, no removible en free).
- **Sesiones**: los enlaces/OTPs de email expiran a las 24h por defecto; el JWT de acceso a 3600s; refresh token de un solo uso.

Nota para el spec: si en producción se quiere entregabilidad confiable y >2 emails/hora (p. ej. reenvíos de invitaciones, resets de contraseña), hay que configurar **Custom SMTP** (incluido en free). Para el MVP de ~8 personas, el servicio por defecto alcanza.

---

## 4. Comparativa de fricción

| Opción | Fricción | Seguridad | UX invitado | ¿Para el spec? |
|---|---|---|---|---|
| **`inviteUserByEmail`** | Baja — 1 llamada server-side; email automático con plantilla propia | Alta — solo la service role key crea usuarios; sin PKCE solo en el flujo de invitación | Excelente — clic en enlace + definir contraseña | **Sí, flujo principal** |
| `createUser` + entrega manual | Media — gestionar contraseña inicial / confirmación a mano | Alta (misma key) | Media — depende de cómo entregues credenciales | Solo importación/migración |
| Magic link / OTP (`signInWithOtp`, `shouldCreateUser:false`) | Media-alta — choca con email+contraseña decidido | Media — riesgo de account takeover si el email se compromete; depende del template | Alta — sin contraseña que recordar | No (complemento opcional) |
| `generateLink` + envío propio | Alta — implementar entrega de email y canje | Alta — control total | Depende de tu implementación | Solo si custom SMTP propio desde el día 1 |
| Signup público + confirmación | Baja (pero es lo que NO queremos) | Baja (signup abierto) | Alta | Descartada |

Riesgos transversales:
- **service role key** = superusuario: guardarla solo en el servidor (env), nunca en el cliente. El cliente de Supabase del repo usa la `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; la key de servicio es para un server client aparte (Route Handler / Server Action / Edge Function).
- **User enumeration**: los errores de login no distinguen "no existe" de "contraseña incorrecta" (`signInWithPassword`); `resetPasswordForEmail` no revela si el email existe. Mantenerlo así.
- **Emails single-use**: los scanners de email (Safe Links, etc.) pueden consumir el enlace de invitación → "Token has expired or is invalid". Mitigación: plantilla con OTP (`{{ .Token }}`) o enlace propio con `{{ .ConfirmationURL }}` (guía de email templates).
- **RLS siempre**: incluso con signup cerrado, RLS en todas las tablas (Production Checklist).
- **PKCE y SSR**: el login normal en Next.js SSR usa PKCE; `inviteUserByEmail` no soporta PKCE solo en el flujo de invitación (documentado), así que no mezclar.

---

## 5. Recomendación concreta para el spec

1. **Registro público desactivado** a nivel proyecto (dashboard "Allow new users to sign up" OFF en hosted; en `supabase/config.toml` local: `[auth] enable_signup = false`, dejando `[auth.email]` y `[auth.sms]` con `enable_signup = true` para no apagar los proveedores).
2. **Alta de miembros**: un único endpoint server-side (Route Handler o Server Action) protegido por rol que llame a `supabase.auth.admin.inviteUserByEmail(email, { redirectTo, data })` con la service role key. El email de invitación en español (plantilla "Invite user" con variables `{{ .SiteURL }}`/`{{ .ConfirmationURL }}`).
3. **Login**: `signInWithPassword` + `@supabase/ssr` (PKCE), como ya está esbozado en `lib/supabase/`.
4. **Reseteo de contraseña**: `resetPasswordForEmail` (página pública de reset + `updateUser({ password })`).
5. **Membresía como dato**: tabla `public.members` (id = `auth.uid()`, rol, fecha de alta) + RLS; el "cerrado" se refuerza en la capa de datos, no solo en Auth.
6. **Free tier**: usuarios ilimitados + 50k MAUs: sin problema para un club de ~8 personas. Emails: el servicio por defecto (2/h) alcanza para el MVP; planear Custom SMTP (incluido en free) cuando se necesite reenviar invitaciones o resetear contraseñas de forma fiable.
7. **Fuera de alcance** para el MVP: OAuth/social, magic-link como flujo principal, SSO/SAML, MFA (en free solo TOTP básico), invitaciones con expiración propia.

## Fuentes primarias

- Supabase Docs — [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- Supabase Docs (JS reference) — [inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp), [signUp](https://supabase.com/docs/reference/javascript/auth-signup)
- Supabase Docs — [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- Supabase Docs — [Production Checklist (auth rate limits, SMTP)](https://supabase.com/docs/guides/deployment/going-into-prod)
- Supabase Docs — [CLI config (`auth.enable_signup`, `auth.email.enable_signup`)](https://supabase.com/docs/guides/local-development/cli/config)
- Supabase Docs (fuente) — [General configuration ("Allow new users to sign up")](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/general-configuration.mdx)
- Supabase — [Pricing / Free tier](https://supabase.com/pricing)
- Supabase GitHub — [supabase/supabase#40582: `enable_signup=false` vs provider enabled (invite-only config)](https://github.com/supabase/supabase/issues/40582)
- Código instalado: `node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.d.ts` y `lib/types.d.ts` (firmas y remarks de `inviteUserByEmail`, `createUser`, `generateLink`, `shouldCreateUser`); `supabase/config.toml` del repo.
