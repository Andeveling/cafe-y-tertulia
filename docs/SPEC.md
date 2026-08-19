# Café y Tertulias — Spec del MVP

> La mesa digital del club: antes de la reunión recoge las preguntas, durante la tertulia organiza la dinámica y después conserva la memoria de lo que pensamos juntos.
>
> Principios: **la conversación está primero** · **la aplicación acompaña, no dirige** · **participar se siente natural** · **la memoria colectiva importa** · **la gamificación recompensa participación, no rendimiento**.

Este spec consolida las resoluciones de los tickets del mapa (#2–#11). Es el contrato de implementación: glosario, modelo de datos, máquina de estados, pantallas, minijuegos, gamificación, rating, histórico y decisiones de la §24. Código en inglés; dominio y UI en español.

---

## 1. Glosario

Vocabulario canónico en [`CONTEXT.md`](../../CONTEXT.md) — leerlo es obligatorio antes de tocar el dominio. Resumen de términos:

| Término | Definición (1 línea) |
|---|---|
| **Miembro** | Persona del club con acceso; ciclo `invitado → activo → baja`. Única entidad de persona. |
| **Participante** | Miembro confirmado presente en una Sesión. Término de contexto de sesión, no entidad. |
| **Moderador** | Estado temporal que asume quien abre la Sesión; cedible en el lobby, no transferible en `en_curso`. |
| **Sesión** | Encuentro del club con fases y estados. |
| **Material** | Contenido sobre el que se conversa (libro/podcast/video/artículo); pipeline `propuesto → seleccionado → en curso → terminado`. |
| **Pregunta** | Aporte abierto de un Miembro para una Sesión; tiene autor y asignado. |
| **Asignación** | Vínculo Pregunta↔Miembro del Sorteo; vive allí las Notas. |
| **Intervención** | Ciclo de una Asignación: `oculta → preparación → exposición → complemento → completa`. |
| **Sorteo** | Asignación aleatoria oculta hasta revelar; estados `pendiente → oculto → revelando → revelado`. |
| **Trivia / Ronda de trivia** | Minijuego de opción múltiple; ronda de 3-5 preguntas, +1 por acierto, sin penalización. |
| **Take / Posición** | Disparador de conversación; votación agregada acuerdo/desacuerdo/neutral. |
| **Insignia / Hito** | Logro individual visible / logro colectivo del club. |
| **Conteo / Punto** | Contador de eventos (capa de cálculo) / unidad interna (solo concepto en MVP). |
| **Reconocimiento / Otorgamiento** | Entrega de un Logro en un momento dado / acto de otorgar una Insignia. |
| **Temporada** | Mes calendario natural; cierra con reconocimientos por categoría, sin ranking. |
| **Rating / Voto** | Agregado (promedio + conteo) de un Material / calificación 1-5★ anónima de sesión. |
| **Histórico** | Modo de ver la memoria del club; no es entidad. |

---

## 2. Modelo de datos

Entidades y relaciones. Todo acceso filtrado por RLS (membresía, ADR 0005).

### 2.1 `members`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | = `auth.uid()` |
| `status` | enum | `invited` \| `active` \| `left` |
| `display_name` | text | nombre visible, editable |
| `invited_by` | uuid FK → members | padrino (registrado al invitar) |
| `created_at` | timestamptz | |

- Alta solo server-side: `inviteUserByEmail` (ADR 0005). Sin registro público.
- `left`: aportes permanecen como memoria del club.

### 2.2 `materials`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `kind` | enum | `book` \| `podcast` \| `video` \| `article` |
| `author` | text | |
| `status` | enum | `proposed` \| `selected` \| `in_progress` \| `finished` |
| `created_by` | uuid FK → members | |
| `created_at` | timestamptz | |

### 2.3 `sessions`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `material_id` | uuid FK → materials | |
| `range` | text | ej. "Capítulos 1-3" |
| `status` | enum | `preparation` \| `lobby` \| `in_progress` \| `closed` \| `archived` |
| `moderator_id` | uuid FK → members | asume quien abre; cedible en lobby |
| `scheduled_at` | timestamptz | null en `preparation` |
| `rating_avg` | numeric | congelado al cerrar (1 decimal) |
| `rating_count` | int | |
| `season_id` | uuid FK → seasons | |

### 2.4 `session_participants`

| campo | tipo | notas |
|---|---|---|
| `session_id` | uuid FK → sessions | |
| `member_id` | uuid FK → members | |
| `opt_out` | bool | "Sin sorteo" |
| PK | (session_id, member_id) | |

### 2.5 `questions`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → sessions | |
| `material_id` | uuid FK → materials | denormalizado para Histórico |
| `author_id` | uuid FK → members | |
| `text` | text | |
| `outside_draw` | bool | "Fuera de sorteo" |

### 2.6 `assignments`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → sessions | |
| `question_id` | uuid FK → questions | |
| `assignee_id` | uuid FK → members | |
| `reveal_order` | int | permutación fija del Sorteo |
| `state` | enum | `hidden` \| `preparation` \| `exposition` \| `complement` \| `complete` |
| `notes` | text | Notas de respuesta (pueden quedar vacías) |
| `draw_id` | uuid FK → draws | |

- Hasta 2 asignados por Pregunta; nunca el autor.

### 2.7 `draws`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → sessions | |
| `status` | enum | `pending` \| `hidden` \| `revealing` \| `revealed` |
| `created_at` | timestamptz | |

- Matching aleatorio máx. bipartito con CSPRNG (ADR 0001).

### 2.8 `trivia_rounds` / `trivia_questions` / `trivia_answers`

| tabla | campos clave | notas |
|---|---|---|
| `trivia_rounds` | `id`, `session_id`, `material_id` | una ronda = 3-5 preguntas |
| `trivia_questions` | `id`, `round_id`, `author_id`, `prompt`, `options` (jsonb), `correct_index` | banco por material |
| `trivia_answers` | `id`, `round_id`, `question_id`, `member_id`, `chosen_index`, `correct` | individuales, efímeros |

- Resultado solo **agregado** (aciertos por participante en el Marcador); respuestas individuales no se exponen.
- Ganador alimenta Insignia "Memoria de elefante".

### 2.9 `takes` / `take_votes`

| tabla | campos clave | notas |
|---|---|---|
| `takes` | `id`, `session_id`, `author_id`, `prompt` | MVP: frase disparadora |
| `take_votes` | `id`, `take_id`, `member_id`, `position` | `agree` \| `disagree` \| `neutral` |

- Posición individual nunca se expone; solo conteo agregado.

### 2.10 `badges` / `awards` (gamificación)

| tabla | campos clave | notas |
|---|---|---|
| `badges` | `id`, `key`, `emoji`, `kind` | `individual` \| `collective` (Hito) |
| `awards` | `id`, `badge_id`, `member_id` (null si Hito), `session_id`, `assignment_id` (null), `trigger` | Otorgamiento registrado, ligado a su evento |

- Catálogo (9) en §5.

### 2.11 `counts` (Conteos)

| campo | tipo | notas |
|---|---|---|
| `member_id` | uuid FK | null = conteo del club |
| `event` | enum | `question_created`, `session_attended`, `trivia_won`, `exposition_done`, … |
| `season_id` | uuid FK | acumulación por Temporada |
| `value` | int | contador |

- Capa de cálculo; **no** es Puntos (el Punto es solo concepto en MVP).

### 2.12 `votes` (Rating, efímeros)

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK | |
| `member_id` | uuid FK | |
| `stars` | int 1-5 | |
| PK alterna | (session_id, member_id) | |

- Voluntario, modificable en `en_curso`/`cerrada`; al cerrar se **descarta** el voto individual (privacidad por eliminación, ADR 0003). Solo persisten `sessions.rating_avg` y `rating_count`.

### 2.13 `seasons`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `starts_at` / `ends_at` | timestamptz | mes calendario natural |
| `status` | enum | `open` \| `closed` | |

- Creación/cierre automáticos por calendario; el moderador puede reabrir para corregir.

### 2.14 `invitations`

| campo | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `email` | text | |
| `invited_by` | uuid FK → members | padrino |
| `expires_at` | timestamptz | 24h |
| `status` | enum | `pending` \| `accepted` \| `expired` | |

---

## 3. Máquina de estados

### 3.1 Ciclo de vida de la Sesión

```
preparation ──(crear cita + confirmar)──▶ lobby ──(moderador inicia)──▶ in_progress
     ▲                                                                    │
     │                                                                    │ (moderador cierra)
     └────────────────────────────────────────────────────────────────────▼
                                                             closed ──(auto/confirm)──▶ archived
```

| Estado | Qué pasa | Quién avanza |
|---|---|---|
| `preparation` | miembros proponen Materiales, Preguntas y Trivias; no hay cita | cualquiera |
| `lobby` | moderador confirma Participantes, ejecuta el Sorteo | moderador |
| `in_progress` | debate; revelación progresiva, minijuegos, rating | moderador (100% manual) |
| `closed` | datos congelados; aún editable para corregir errores | moderador |
| `archived` | solo lectura, permanente | — |

- Minijuegos y Rating son **acciones dentro de `in_progress`**, no estados.
- El tiempo es guía, nunca corta (ADR 0002).

### 3.2 Sorteo (`draws.status`)

```
pending ──(ejecutar)──▶ hidden ──(revelar una)──▶ revealing ──(última revelada)──▶ revealed
```

- En `hidden` nadie —ni el Moderador— ve las asignaciones (ADR 0001).
- El orden de revelación es la permutación aleatoria fijada al sortear.

### 3.3 Intervención (`assignments.state`)

```
hidden → preparation → exposition → complement → complete
```

- Avance manual por el Moderador (revelar / continuar / siguiente).
- `complement` solo si el autor está presente; con 2 asignados, complementa una sola vez tras el último.

---

## 4. Pantallas

Tres momentos (PRD §25): **Antes de Meet** (cada quien), **Durante Meet** (pantalla compartida del moderador), **Después de Meet** (memoria).

### 4.1 Antes de Meet
- **Lista de materiales** — pipeline del club (`proposed → selected → in_progress → finished`).
- **Página de material** — rating, sesiones, y (en preparación) el pool de Preguntas y Trivias; aquí se crean.
- **Proponer material** — formulario (título, tipo, autor).

### 4.2 Durante Meet
- **Lobby** — confirmar Participantes, marcar "Sin sorteo", ejecutar el Sorteo.
- **Escenario del moderador** (pantalla compartida, ADR 0002 + wireframe #6): Pregunta revelada, estado de la Intervención, temporizador orientativo. Controles solo **acciones**, nunca contenido oculto.
- **Teléfono del asignado** — Notas de respuesta en el Momento de preparación.
- **Trivia en dispositivo** — responder; resultados agregados en la pantalla del moderador.
- **Take** — votación rápida agregada.

### 4.3 Después de Meet
- **Histórico — página de material** (wireframe #10, variante A Cronología): Material (nombre, autor, tipo, estado, Rating agregado, Hitos del club) → lista de Sesiones en orden descendente, cada una como tarjeta (rango cubierto, Rating de sesión, participantes, Preguntas, minijuegos, Logros).
- **Histórico — página de sesión** (la tarjeta expandida): participantes, Preguntas (autor + asignado), Notas de respuesta, resultados de minijuegos, Logros, Rating.
- **Perfil de Miembro** — insignias propias.
- **Cierre de Sesión** — reconocimientos otorgados ese día.

### 4.4 Sin login vs con sesión
- **Públicas**: página de Material y de Sesión en Histórico (memoria del club, sin ranking personal).
- **Requieren sesión**: todo lo demás (proponer, preguntar, lobby, minijuegos, votar, perfil).

---

## 5. Minijuegos

### 5.1 Trivia
- Se crean colaborativamente en `preparation` (banco reutilizable por material); el moderador selecciona 1-2 trivias/sesión.
- Rondas de 3-5 preguntas de opción múltiple, todos responden a la vez en su dispositivo.
- +1 punto interno por acierto, sin penalización; resultados **agregados** en pantalla del moderador (nunca errores individuales por pregunta).
- **Marcador** visible al final; el ganador alimenta la Insignia "Memoria de elefante".

### 5.2 Takes
- El moderador lanza una frase disparadora (variante MVP: frase + votación rápida).
- Posición: acuerdo / desacuerdo / neutral; solo agregada y anónima; sin puntuación ni ganador.
- 1-3 por sesión.

---

## 6. Gamificación

Catálogo del MVP — las 9 del PRD §14 (ADR 0004):

**Individuales (6)**
| Insignia | Disparo |
|---|---|
| ☕ Primera pregunta | 1ª Pregunta creada |
| 🧠 Memoria de elefante | ganar una Trivia |
| 🔥 Cambio de perspectiva | otorgada por el moderador (subjetiva) |
| 🎯 Pregunta que hizo pensar | otorgada por el moderador (subjetiva) |
| ⭐ Participación perfecta | preparar Pregunta *o* Trivia **y** exponer si toca Asignación, sin faltar al cierre |
| 📚 Lector constante | varias Sesiones consecutivas |

**Colectivas (3, Hitos)**
| Hito | Disparo |
|---|---|
| 🏆 Primer libro terminado | primer Material en `finished` |
| 🏆 50 sesiones realizadas | umbral dormido sobre Conteo |
| 🏆 100 preguntas debatidas | umbral dormido sobre Conteo |

- Las subjetivas se otorgan **en vivo** durante la Intervención, ligadas a esa Pregunta/Asignación; el moderador puede otorgarse a sí mismo (queda registrado).
- **Temporadas**: mes calendario natural, automáticas; cierre con Reconocimientos por categoría (Maestro de la trivia, Gran debatiente, Creador de preguntas, Asistencia perfecta) — **sin Top 1/2/3** ni ranking. Logros históricos persisten.
- **Superficies**: perfil (propias), cierre de Sesión (del día), página del Material (Hitos). Emojis como iconografía.
- **Puntos**: solo concepto. Cada acción registra un **Conteo**; los valores de punto se definen cuando exista un consumidor.

---

## 7. Rating

- Voto 1-5★ anónimo, **solo en sesión** (la página del Material muestra el Rating pero no recoge votos).
- Votan los Participantes confirmados (incluye Moderador y "Sin sorteo"); voluntario, se abre al final del debate y lo cierra el Moderador manualmente.
- UI solo en dispositivo individual; el Moderador ve solo progreso "X de Y" sin nombres.
- Al cerrar: congelado (promedio 1 decimal + conteo), materializado por Sesión y acumulado por Material; **votos individuales descartados**.
- En `closed` el Moderador puede mover/borrar el agregado de la Sesión, nunca votos individuales; en `archived` inmutable.

---

## 8. Histórico

- Modo de ver, no entidad propia. Lectura de Sesiones, Preguntas, Notas, minijuegos, Logros, Rating y Reconocimientos desde la página del Material o de la Sesión.
- La página del Material es la **cronología** (variante A del wireframe #10): Material → Sesiones descendentes → tarjeta expandida = página de Sesión.
- Los Hitos viven en la página del Material/club, no en perfiles individuales.
- Debe sentirse como **memoria del club**, no como registro administrativo.

---

## 9. Autenticación y membresía

- Club cerrado por Invitación: registro público desactivado (`[auth] enable_signup = false`, dejando el proveedor de email encendido); alta solo con `inviteUserByEmail` (server-side, service role key). ADR 0005 + investigación `docs/research/supabase-auth.md`.
- Primer Miembro por bootstrap operativo (script admin / dashboard del dueño) — el dueño es un hecho operativo, no un rol.
- Cualquier Miembro activo puede invitar (padrinazgo registrado); lista sin tope.
- Membresía nace al invitar: `invited → active → left`. Email en español, enlace de 24h → página pública (contraseña + nombre visible). Login `signInWithPassword` + `@supabase/ssr` (PKCE). Reset público anti-enumeración.
- RLS en todas las tablas; la cerradura se refuerza en la capa de datos, no solo en Auth.

---

## 10. Decisiones de la §24

| # | Pregunta | Resolución |
|---|---|---|
| Q1 | ¿Cuánto tiempo para notas de preparación? | **Diferida** — validar con sesiones reales. Temporizador orientativo (sugerido 2 min, nunca corta). |
| Q2 | ¿Trivias colaborativas o encargado? | **Colaborativas** en `preparation`; el moderador selecciona del banco. |
| Q3 | ¿Quién decide "Pregunta que hizo pensar"? | El **moderador**, en vivo, sin votación. |
| Q4 | ¿Cómo se determina "Cambio de perspectiva"? | El **moderador** la otorga, ligada a la Intervención; no es votación. |
| Q5 | ¿Top 1/2/3 o categorías? | **Solo categorías** (Maestro de la trivia, Gran debatiente, Creador de preguntas, Asistencia perfecta). Sin Top ni ranking. |
| Q6 | ¿Cuántos minijuegos por sesión? | **Diferida** — probar con el equipo. Guía: 1-2 trivias, 1-3 takes. |
| Q7 | ¿Temporada mensual o por libro? | **Mensual** (mes calendario natural), automática. |

---

## 11. Fuera de alcance (PRD §20)

Chat interno, llamadas/videollamadas, reemplazar Meet, transcripción/grabación, resúmenes automáticos, estadísticas avanzadas, rankings entre clubes, múltiples organizaciones, participación tardía, app móvil nativa, exportaciones, integraciones complejas, generación IA de preguntas.

---

## 12. Stack

- Next.js 16 (App Router) + `@supabase/ssr` + `@supabase/supabase-js` · Supabase (Auth, Postgres, Realtime) · shadcn/base-ui. Código en inglés, UI en español.

## Referencias

- Glosario: [`CONTEXT.md`](../../CONTEXT.md)
- ADR 0001 Sorteo · 0002 Debate conducido · 0003 Rating · 0004 Gamificación · 0005 Autenticación (`docs/adr/`)
- Wireframes: `docs/prototypes/pantalla-moderador.html` (#6) y `docs/prototypes/historico.html` (#10, rama `prototype/historico`)
- Investigación: `docs/research/supabase-auth.md`
