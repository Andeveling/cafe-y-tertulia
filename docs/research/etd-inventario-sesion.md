# Inventario: Sesión, Sala y Etapas en código y DB

Ticket: [#80](https://github.com/Andeveling/cafe-y-tertulia/issues/80) (parte del mapa #79).
Rama: `research/etd-inventario-sesion`. Solo hechos del terreno; no decide modelo ETD.

## 1. Sesión lifecycle

- Enum DB `session_status`: `preparation | lobby | in_progress | closed | archived` —
  `supabase/migrations/20260819144616_materiales_sesiones.sql:20`, tipos en
  `lib/supabase/database.types.ts:1694`.
- Mapa lineal en código: `SESSION_NEXT_STATUS` en `app/materials/_lib/constants.ts:34`
  (`preparation → lobby → in_progress → closed → archived`), etiquetas en
  `SESSION_STATUS_LABELS` (`constants.ts:25`).
- Avance `advanceSession` (`app/materials/_lib/materials-actions.ts:219`): avanza
  exactamente un estado, **excepto** dos desvíos:
  - `lobby → in_progress` NO pasa por aquí; lo hace la Sala al avanzar a Debate
    vía `advance_room_stage` (si no, `room_stage` quedaría desincronizado).
  - `in_progress → closed` NO pasa por aquí; usa `closeSessionAction` → RPC
    atómico `close_session` (`materials-actions.ts:297`).
  - `closed → archived` solo el moderador.
- Creación: RPC `create_session` (`supabase/migrations/20260923140000_session_group_id.sql`):
  con fecha futura nace en `preparation`, sin fecha nace directo en `lobby`
  (moderador = creador). Sesión opcional de material (`20260825145612_session_optional_material.sql`).
- Tablero solo muestra `preparation | lobby | in_progress` (`app/_components/board-helpers.ts:4`);
  `sessionOpensSala` (`board-helpers.ts:78`): `preparation` abre la Sala (avanza a
  `lobby`), `lobby/in_progress` solo entran. `closed/archived` van al Histórico.

## 2. Sala única y Etapas fijas

- Sala única = una sola ruta fullscreen sin chrome: `app/materials/sessions/[id]/room/page.tsx`,
  detectada por `isSalaPath` en `lib/sala-path.ts`. Vista: `RoomSessionView`
  (`app/materials/_components/room-session-view.tsx:31`).
- Enum DB `room_stage`: `questions | presence | draw | debate | cierre`
  (`lib/supabase/database.types.ts:1692`; base `questions,presence,draw` en
  `20260821140000_room_sala.sql:12`, `debate` en `20260823000000_debate_en_sala.sql:10`,
  `cierre` en `20260825000000_cierre_en_sala.sql:13`).
- Orden fijo en código: `ROOM_STAGE_ORDER` en `app/materials/_lib/room-types.ts:18`,
  etiquetas en `ROOM_STAGE_LABELS` (`room-types.ts:26`). NOTA: `room-types.ts:10-13`
  añade `"debate" | "cierre"` por unión porque los tipos generados iban por detrás.
- Avance de etapas: `advanceRoomStage` (`app/materials/_lib/room-actions.ts:193`) →
  RPC `advance_room_stage` (solo moderador, con guardas: sin mesa vacía, sin volver
  a Preguntas/Presentes tras el Sorteo — `20260908000000_room_back_and_no_empty_advance.sql`).
- Derivación de vista: `deriveSalaView` (`app/materials/_lib/room-view.ts:53`) calcula
  `next/prev`, `backBlocked`, `remainingInterventions`, `warnings`; render por etapa en
  `StageContent` (`app/materials/_components/room/stage-content.tsx:43`).
  Props comunes de etapa: `EtapaProps` (`app/materials/_components/room/stage-props.ts:5`).
- Snapshot server: RPC `room_snapshot` (`20260821140000_room_sala.sql:99`, extendido por
  debate/cierre); decodificación client en `app/materials/_lib/room.schema.ts` vía
  `decodeSnapshot` (`snapshot-codec.ts`). Reloj compartido `asOf` (reloj de fetch).

## 3. Sorteo / Debate / Intervención

- Sorteo: `executeDraw` (`room-actions.ts:212`) → RPC `execute_draw` (estricto 1:1 en
  `20260921180656_execute_draw_strict_111.sql`; ejecuta en etapa `draw` —
  `20260916000000_execute_draw_on_draw_stage.sql`). Enum `draw_status`:
  `pending | hidden | revealing | revealed` (`database.types.ts:1679`).
  Reloj 3-2-1: `useDrawClock` (`app/materials/_hooks/use-draw-clock.ts:15`) escucha
  INSERT en `draws` por Realtime; snapshot de ceremonia en
  `20260907153222_draw_ceremony_snapshot.sql`.
- Intervención = fila en `assignments`: `draw_id, question_id, assignee_id, reveal_order,
  state` (`database.types.ts`, tabla `assignments`). Enum `assignment_state`:
  `hidden | exposition | complement | complete` (`database.types.ts:1669`; se eliminó
  `preparation` en `20260915120000_debate_sin_preparacion.sql:36`).
- Debate: snapshot `RoomDebateSnapshot` (`room-types.ts:73`: modos `active |
  waiting_reveal | done`), revelado por turnos (`revealNext` en `room-actions.ts`),
  temporizador 5:00 + overtime, extensiones +1 del moderador (tope 2,
  `extension_count`), corazones/aprecio por fase (`20260919000000_corazones_intervencion.sql`).
- Espectadores: `participant_role = member | spectator` (`20260821130000_rol_espectador.sql`);
  fuera del sorteo pero en la tertulia. Opt-out del sorteo sin ser espectador también existe.

## 4. Material + Rango cubierto

- `sessions.material_id` nullable (sesión sin material posible) + `sessions.range`
  (texto, obligatorio si hay material — guarda `create_session`).
  Columna `range`: "Rango cubierto, ej. Capítulos 1-3"
  (`20260819144616_materiales_sesiones.sql`, comentario de columna).
- Formulario: `SessionForm` (`app/materials/_components/session-form.tsx`) pide
  `range` + fecha programada opcional (`scheduled_at`).
- Pipeline del material (independiente de la sesión): `proposed → selected →
  in_progress → finished` (`advanceMaterial`, `materials-actions.ts:90`).

## 5. Preguntas / Asignaciones

- Tabla `questions`: `session_id, material_id` (denormalizado para Histórico),
  `author_id, text, outside_draw` (`20260819145821_preguntas.sql:11`).
- Privacidad: texto visible solo para su autor hasta la Intervención (RLS + snapshot;
  ver `RoomQuestion.text` en `room-types.ts:50` y `20260914000000_questions_insert_sala_viva.sql`).
- `outside_draw`: el moderador la excluye del sorteo (ADR 0001).
- Asignaciones 1:1 sorteadas (cada uno responde una pregunta ajena); orden de revelado
  `reveal_order`; notas propias por turno (`myNotes`).

## 6. Cierre / Histórico / Rating

- Cierre atómico `close_session` (`20260821120000_cierre_sesion.sql:130`): congela
  rating (promedio + conteo, descarta votos individuales — ADR 0003), exige sorteo
  revelado (`20260825190000_cierre_requiere_sorteo_revelado.sql`,
  `20260907180000_cierre_draw_revealed_when_done.sql`) y minijuegos sin cerrar.
- Rating: RPCs `open_session_rating / cast_session_vote / close_session_rating /
  clear_session_rating / rating_progress` (`20260820160000_rating.sql`); acciones en
  `app/materials/_lib/rating-actions.ts`, lectura en `app/materials/_lib/rating.ts`.
  Rating 1-5 anónimo, congelado al cerrar.
- Histórico: RPC `get_session_history` (`20260822040000_get_session_history_rpc.sql`,
  + aprecio en `20260919000001_history_aprecio.sql`); lectura única en
  `getSessionHistory` (`app/materials/_lib/session-history.ts:14`), decodificación en
  `session-history.schema.ts:192` (`decodeSessionHistory`, nunca lanza).
  Incluye: participantes, preguntas + asignación, trivia_rounds, takes, awards, rating.
  Histórico público en `20260821150000_historico_publico.sql`.

## 7. RLS por Grupo

- Cerradura: `is_group_member(p_group_id)` / `is_group_admin` (security definer,
  `20260923000000_groups_expand.sql:62-92`); grupos `public | private`
  (`group_visibility`), roles `admin | member` (`group_member_role`).
- `group_id` en las ~20 tablas de contenido (sessions, materials, questions, draws,
  assignments, session_participants, votes, hearts, trivias, takes, awards, …) con
  backfill al grupo "nojau" (`20260923000000_groups_expand.sql:181-200`); contrato
  NOT NULL en `20260923000003_groups_contract.sql`.
- Sesión nace en un grupo: `create_session(p_group_id)` exige membresía; sin grupo
  explícito solo vale si el miembro pertenece a exactamente uno
  (`20260923140000_session_group_id.sql`).
- Políticas: lectura = miembro del grupo o catálogo público (`groups_select_member_or_public`);
  aislamiento cross-grupo (lo de un grupo no se ve en otro — PRODUCT.md).

## 8. Seams para una variante ETD (dónde enchufar sin duplicar)

1. `ROOM_STAGE_ORDER` + `ROOM_STAGE_LABELS` (`room-types.ts:18-32`): la lista de etapas
   es una constante + `switch` en `StageContent` (`stage-content.tsx:43`); una variante
   con distintas etapas toca aquí y en el enum `room_stage` + `advance_room_stage`.
2. `advance_room_stage` (SQL): guarda central de transiciones y sus bloqueos
   (no-vacío, no-volver, cierre-requiere-sorteo). Distintas etapas = nuevas reglas aquí.
3. `SESSION_NEXT_STATUS` (`constants.ts:34`) + `advanceSession` / `closeSessionAction`:
   el ciclo de vida es lineal y centralizado; cierre con acuerdos entraría en
   `close_session` (consolidación atómica) sin tocar el resto.
4. `decodeSnapshot` / `decodeSessionHistory` / `decodeRatingProgress`: los snapshots del
   RPC se decodifican en un solo seam por dominio — campos nuevos de variante entran
   por el schema zod, no por los componentes.
5. `deriveSalaView` (`room-view.ts:53`): avisos y `next/prev` derivados en un solo
   lugar puro y testeado — nueva etapa = nuevo caso aquí.
6. Sala (`room/page.tsx` + `isSalaPath`) e Histórico (`getSessionHistory`) son únicos:
   la variante los reutiliza; no duplicar ni la ruta ni el RPC de histórico.
7. `runServerAction` (`lib/server-action.ts:57`): cerradura auth/miembro y revalidación
   en un solo módulo — las acciones nuevas de variante lo heredan gratis.
