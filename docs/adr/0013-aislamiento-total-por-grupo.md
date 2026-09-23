# Aislamiento total por Grupo: cada Grupo es un universo cerrado

## Status: accepted

## Context

Hasta hoy el sistema opera como un club único implícito (ADR-0005): todos los Miembros comparten el mismo pool global de Materiales, Sesiones, Categorías y gamificación. El PRD multi-grupo (#69) introduce el **Grupo** como comunidad aislada dentro de la plataforma "Café y Tertulias". Hay que decidir el alcance del aislamiento: ¿cada Grupo es un universo cerrado con todo propio (full), o solo Materiales/Sesiones se aíslan y lo demás se comparte (partial)?

La decisión contradice en espíritu a ADR-0005 (club único → plataforma que aloja grupos) y es difícil de revertir: pasar de full a partial exige fusionar datos por-grupo en tablas compartidas; pasar de partial a full exige repartir datos compartidos sin dueño claro. Por eso se registra aquí.

## Decision

**Aislamiento total (full isolation).** Cada Grupo es un universo cerrado: nada se comparte entre Grupos.

Scopeado por `group_id` directo: `materials`, `sessions`, `categories`, `material_categories`, `session_categories`, `seasons`, `badges`, `awards`, `counts`, `season_recognitions`, `trivias`, `questions`, `draws`, `assignments`, `session_participants`, `takes`, `trivia_rounds`, `votes`, `hearts`, `convocatorias`.

Scopeado transitivamente (sin `group_id` propio, vía padre): `trivia_items` (vía `trivias`), `trivia_answers` y `trivia_hits` (vía `trivia_rounds`), `take_votes` (vía `takes`).

No scopeados (globales): `members` (identidad única en la plataforma), `invitations` (padrinazgo de plataforma), `recognition_category_meta` (datos de referencia).

Consecuencias directas:

- Categorías, Insignias, Temporadas y Conteos son por-Grupo (maestro en A, semilla en B es posible).
- `create_group` siembra categorías, catálogo de insignias y temporada del mes.
- Toda política RLS de contenido pasa de `is_member()` a `is_group_member(group_id)`; `is_member()` queda solo para checks de plataforma (ver Mis Grupos, perfil).
- El acceso anónimo a `materials`/`sessions` se elimina (la memoria pública por-grupo queda para después).

## Considered Options

- **Partial isolation (solo Materiales/Sesiones scopeados, Categorías/Insignias/Temporadas/Conteos compartidos)**: se descarta; rompe el modelo mental "grupo = club independiente", crea preguntas de permiso sin respuesta buena (¿quién edita una categoría compartida? ¿un grupo borra la insignia de otro?) y mezcla gamificación entre comunidades que no se conocen.
- **Taxonomía global + contenido local (categorías compartidas, resto aislado)**: se descarta; mismo problema de gobernanza que partial, con el agravante de que la Maestría por categoría dejaría de tener sentido por-grupo.
- **Gamificación global + contenido local (conteos/insignias agregados cross-grupo)**: se descarta; impide "maestro en A, semilla en B", exige dashboards cross-grupo que están fuera de alcance (#69 Out of Scope) y filtra señal entre grupos.
- **Grupos como vistas/filtros sobre un pool compartido (sin `group_id`, solo etiquetas)**: se descarta; no hay aislamiento real, las políticas RLS no pueden garantizar "miembro de A no lee nada de B".

## Consequences

- Migración en tres fases (expand → migrate → contract): `groups` + `group_members`, `group_id` nullable con backfill a "nojau", luego NOT NULL + FKs + reescritura de ~40 políticas en una sola transacción probada en staging (detalle en #71–#74).
- Sin features cross-grupo: ni feeds, ni rankings, ni búsqueda global de contenido; el catálogo público solo expone nombre, descripción, avatar y conteos.
- Identidad única global (`members` sin `group_id`): nombre/avatar iguales en todos los grupos; la Invitación (padrinazgo) da acceso a la plataforma, la Invitación al Grupo da acceso a un grupo privado — conceptos separados.
- Suplementa (no deroga) a ADR-0005 en membresía por invitación y a ADR-0011 en el patrón token-por-enlace para la Invitación al Grupo.
