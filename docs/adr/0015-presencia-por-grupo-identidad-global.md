# Identidad global + presencia por grupo

## Status: accepted

## Context

La tarjeta "Miembros · N en línea" usaba el canal global `club-roster`: un Miembro activo en el grupo B aparecía en línea también en el grupo A. El punto verde delataba actividad fuera del grupo. Además `members.last_seen` es global (un heartbeat por Miembro), así que usarlo como fallback de "en línea" filtra actividad cross-grupo aunque el canal sea por grupo. El roster tampoco enlazaba a ningún perfil (issue #77).

## Decision

- **Identidad global, presencia por grupo.** `members` sigue siendo identidad global (nombre/avatar iguales en todos los grupos, sin cambios de esquema ni de RLS). El scope por grupo lo aplican la query `getGroupRoster` + el canal `group-{id}-roster` (`presenceTopic(groupId)`).
- **Con grupo, el canal manda.** En `useClubPresence(..., { groupId })`, `online = !!payload del canal del grupo`; se ignora `last_seen` global para `online` y para `ultimaVez`. Sin grupo se mantiene el canal histórico `club-roster` con fallback a `last_seen` (ADR-0010).
- **Roster completo, perfil sin presencia.** El roster lista a todos los Miembros del grupo aunque estén offline; cada fila enlaza a `/members/:id` (identidad + insignias vía `getMemberProfile`). Esa ruta nunca expone `last_seen` ni usa el canal de presencia.
- **Alternativa descartada:** RLS por "grupo compartido" para `members`. Se descarta por coste y porque rompe descubrimiento e invitaciones.

## Consequences

- Un compañero activo solo en B aparece desconectado en A; cada pestaña reporta a su grupo por su propio canal.
- Los conteos `online_count` de Mis Grupos (server, desde `last_seen`) siguen siendo aproximación global; la verdad por grupo vive en el canal realtime.
- `members.last_seen` y su índice se conservan sin migración.
