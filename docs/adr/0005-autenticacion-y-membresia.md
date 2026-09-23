# Autenticación y membresía: club cerrado por invitación

## Status: superseded by ADR-0014

La membresía cerrada por padrinazgo queda derogada. Siguen la contraseña, el RLS por `auth.uid` y el alta del primer Miembro por bootstrap, hasta que el registro abierto esté construido.

## Decision

El club es una membresía cerrada por Invitación: el registro público está desactivado a nivel de proyecto (`enable_signup = false`, dejando el proveedor de email encendido), el alta se hace exclusivamente con `inviteUserByEmail` desde el servidor (service role key) y el acceso a datos se filtra por la tabla `members` con RLS por `auth.uid`. El primer Miembro nace por un bootstrap operativo fuera de la app (script admin o dashboard del dueño del proyecto) — el "dueño" es un hecho operativo, no un rol del dominio: no existe admin permanente. Cualquier Miembro activo puede invitar (acto de padrinazgo que queda registrado) y la lista crece sin tope: la cerradura la garantiza que nadie de afuera entra sin invitación, no un límite de cupo.

La membresía nace **al invitar**: la fila se crea con estado `invitado` y el email (plantilla en español) llega con un enlace de 24h que aterriza en una página pública de la app donde el invitado define su contraseña y su nombre visible; al primer ingreso pasa a `activo`. El login es `signInWithPassword` con SSR/PKCE; el reseteo de contraseña es autoservicio (página pública con mensaje anti-enumeración). El Miembro puede darse de baja cuando quiera y sus aportes permanecen como memoria del club; revocar a otro miembro queda fuera del MVP (la llave técnica existe solo en manos del dueño). El Moderador lo asume quien abre la Sesión, puede cederlo en el lobby antes del Sorteo y no se transfiere durante la Sesión.

## Rejected alternatives

- **Registro público / signup abierto**: se descarta; el club es una lista cerrada de personas conocidas.
- **Rol administrador permanente**: se descarta; contradice el dominio ("no existe moderador permanente") y la horizontalidad del club; el poder técnico queda en el operador del proyecto, no en la app.
- **Solo el dueño invita**: se descarta; cualquier Miembro puede invitar, la confianza se regula entre personas.
- **Tope fijo de miembros (8)**: se descarta; el tamaño lo decide el club.
- **Membresía al aceptar (en vez de al invitar)**: se descarta; invitar registra al padrino y permite ver y reenviar invitaciones pendientes.
- **Transferencia de moderación en `en_curso`**: se descarta en el MVP; la conversación sigue en Meet y la app acompaña, no dirige.
- **UI de revocación/kick**: se descarta; se resuelve humanamente, con llave técnica solo del dueño.
- **Fotos de perfil y avatar**: se descarta; el nombre visible editable es suficiente para la memoria del club.

## Considerado en la investigación (docs/research/supabase-auth.md)

- Custom SMTP (incluido en free) cuando se necesiten más de 2 emails/hora o reenvíos fiables.
- Mitigación de emails escaneados comiéndose el enlace single-use: plantilla con OTP además del enlace, diferida hasta que haga falta.
- OAuth, MFA y magic-link como flujo principal: fuera del MVP.