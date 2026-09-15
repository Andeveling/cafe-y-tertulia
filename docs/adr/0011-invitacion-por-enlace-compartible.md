# Invitación por enlace compartible, sin correo de Supabase

El envío de correos de Supabase (rate-limit, entregabilidad) bloqueaba el alta de Miembros, así que la Invitación se entrega como enlace firmado por la app (JWT HS256 con `jose` + `INVITE_JWT_SECRET` propio, hash en `invitations` para revocación y un solo uso), atado a un email, vigente 7 días y canjeable en `/auth/invite?token=...` donde el invitado fija nombre visible + contraseña (email bloqueado); se apaga `inviteUserByEmail`, se elimina el reclamo sin enlace (`/auth/register`) y las pendientes viejas se marcan `expired` en un corte limpio.

## Considered Options

- **Seguir con `inviteUserByEmail` + correo como fallback**: se descarta; mantiene la dependencia que causa el problema y dos caminos que probar.
- **Enlace transferible sin email previo**: se descarta; rompe "club cerrado" del ADR-0005 — quien tenga el enlace entraría.
- **Token opaco solo en BD**: se descarta; el JWT permite validar caducidad/firma antes del lookup y es robusto al copiar/pegar en WhatsApp.
- **Convivencia temporal con pendientes viejas y flujo B**: se descarta; corte limpio (`expired` + eliminar `/auth/register`) evita ramas y el agujero de reclamar sin enlace.

## Consequences

- Hay que gestionar `INVITE_JWT_SECRET` en local y Vercel; nunca sale del servidor.
- `/invite` del padrino muestra Copiar + Compartir por WhatsApp + Reenviar (nuevo token invalida el anterior); cada pendiente expone Copiar/Revocar.
- Suplementa al ADR-0005 (membresía al invitar, padrinazgo, revocación) sin cambiar el dominio: solo cambia el canal de entrega.
