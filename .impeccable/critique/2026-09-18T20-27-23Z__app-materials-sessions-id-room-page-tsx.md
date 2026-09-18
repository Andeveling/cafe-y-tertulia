---
target: la room page
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/andres/Proyectos/cafe-y-tertulia/app/materials/sessions/[id]/room/page.tsx"
target_fingerprint: "sha256:b1c64fb8966030874a67ebc7b0310310847ac6a6dfc53dbbd398db1a304c99d5"
target_path: /home/andres/Proyectos/cafe-y-tertulia/app/materials/sessions/[id]/room/page.tsx
timestamp: 2026-09-18T20-27-23Z
slug: app-materials-sessions-id-room-page-tsx
---
# Critique — Room Page (Sala) — app/materials/sessions/[id]/room/page.tsx + RoomPanel/SessionView

## Report header
Metodo degradado single-context porque el harness expone subagentes pero se ejecuto inline para no bloquear la entrega. Assessment A (review director) y Assessment B (detector CLI) se corrieron secuencialmente sin aislamiento.

## Design Health Score — 28/40 (Bien, con friccion Operate)

| # | Heuristica | Score | Hallazgo clave |
|---|------------|-------|----------------|
| 1 | Visibility of System Status | 3 | StageBar + "En vivo"/"Reconectando…" + WaitingBanner + reloj compartido funcionan, pero el punto vivo es 6px y pierde el estado critico en proyector. |
| 2 | Match System / Real World | 4 | Vocabulario del dominio intacto: Preguntas → Presentes → Sorteo → Debate → Cierre, "Expones / Complementas / Escuchas", "Tu mision". Impecable. |
| 3 | User Control and Freedom | 2 | Moderador vuelve atras con confirmacion; participante edita/borra pregunta y cambia Espectador. No hay undo para Sortear ni para cerrar Rating, ni escape rapido del timer. |
| 4 | Consistency and Standards | 3 | Hugeicons + shadcn + Card/Badge consistentes. Rota por `border-l-4 border-l-primary/60` en "Tus preguntas" y 10px/11px fuera de rampa. |
| 5 | Error Prevention | 3 | Dialogs bloquean "Continuar a ..." con warnings, `empty` deshabilita sorteo/avance, delete pide confirmacion. Falta guard contra submit vacio duplicado por doble-click. |
| 6 | Recognition Rather Than Recall | 3 | StageBar con `aria-current="step"` + orden de intervencion numerado + mesa (speaker/author/listener) reduce memoria. Pero el texto de la pregunta se oculta hasta Debate y obliga a recordar. |
| 7 | Flexibility and Efficiency | 2 | Operate sin atajos: todo es click, sin teclado para revelar/continuar, sin bulk para Espectador. Moderador hace 6-8 clicks por tertulia. |
| 8 | Aesthetic and Minimalist Design | 3 | Lounge oscuro coherente (tonal layering, sin sombras duras). QuestionsStage acumula 3 Cards verticales y rompe minimalismo en el primer paso. |
| 9 | Error Recovery | 2 | Toasts de exito y `useRoomMutation.pending` bien; errores de Realtime solo "Reconectando…" sin retry visible ni draft recovery de Textarea. |
| 10 | Help and Documentation | 3 | STAGE_HELP + Tooltip en ModeratorNav + InfoButton "¿Quien ve tu pregunta?" excelentes. Falta ayuda global para novatos fuera de esos tooltips. |
| **Total** | | **28/40** | **Bien — Operate funcional pero con friccion para moderador y novato** |

Modo: **Operate** (el visitante completa el ritual de la tertulia, no decide ni lee). Heuristicas 7 y 10 aplican completas; ninguna es n/a, maximo 40.

## Design Specificity Verdict

**LLM assessment — Parcialmente autoral, no intercambiable pero contenida.**
La Sala respira "salon a media luz": tipografia Literata en hero "En la palabra", initials en circulo `bg-primary/10 ring-primary/40`, badges `rounded-full`, `ChapterRule ❦` en cierre, y `TurnSpotlight` centrado con `questionText` en italica serif. Ese foco debate es especifico y memorable — ningun SaaS generico pondria la pregunta en cursiva a 20px sobre fondo `ring-foreground/10`. La debilidad esta en las etapas previas: `RoomSessionView` header es generico (`Badge "Sala" + h1 "Sesion"`) y `QuestionsStage` es lista de Cards con border que podria ser cualquier form. El sistema usa bien los tokens Lounge pero aun no convierte Preguntas/Presentes en momentos authored. Oportunidad perdida: convertir "Escribe tu pregunta" en un momento editorial (paper texture, placeholder literario) y "Presentes" en mesa visual, no lista.

**Deterministic scan — 1 warning + 15 advisories en 7 archivos:**
- `warning side-tab` en `room-panel.tsx:624` — `border-l-4 border-l-primary/60` en item de "Tus preguntas". Es el antipatron mas reconocible de UI generada por IA; DESIGN.md prohíbe `border-left >1px coloreado`.
- 14× `design-system-font-size` advisory por `text-[11px]` / `text-[10px]` fuera de rampa (stage-panel.tsx:460,526,637,656,694,709,729,742 + draw-ceremony-view.tsx:326,329,356,359,466 + room-closed-view.tsx:153). Son labels `tracking-[0.1em] uppercase` legitimos pero no estan en `typography.label-md (12px)` — el detector pide o usar `text-xs` (12px) + `tracking-wider` o anadir `label-sm: 11px` al sistema.
- 0 findings en `room/page.tsx` directo. Falsos positivos: los 11px/10px no rompen legibilidad pero si rompen el contrato de tokens; el side-tab si es deuda real.

**Visual overlays — no disponibles.** No se inyecto `detect.js` en navegador (sin live-server en esta corrida). Fallback: solo evidencia CLI + lectura de fuente. Para overlays en vivo, correr `impeccable live-server --background` y re-criticar con navegador.

## Overall Impression
La Sala entiende el ritual y lo respeta — el Debate es el mejor momento del producto, con foco single-task, reloj compartido y mesa estable ("En la palabra / Complementa / Escucha"). El resto de la Sala funciona pero se siente como scaffolding Operate correcto, no como salon. La jerarquia se diluye en Preguntas (3 Cards iguales compiten) y el ModeratorNav queda escondido bajo `opacity-80 + border-t` en Debate, justo cuando mas se necesita. La mayor oportunidad es **elevar Preguntas y Presentes al nivel de craft del Debate** y hacer que el estado vivo/moderacion sea imposible de perder.

## What's Working

1. **Debate TurnSpotlight es authored.** `stage-panel.tsx:TurnSpotlight` — circulo de iniciales 4.5rem, `font-heading text-3xl`, pill `En la palabra / Complementa` con `ring-primary/30` vs `ring-reward/30`, `questionText` en `italic text-xl text-pretty` y `chapterRule h-px w-16`. Es salon, no dashboard. Reutilizar ese lenguaje en otras etapas.
2. **StageBar como rito legible.** `stage-bar.tsx` — `rounded-full px-2.5 py-1 text-xs`, completadas `border-primary/25 bg-primary/10 text-primary + Tick01`, actual `bg-primary shadow-xs`, futuras `muted`. Conectores `h-px w-4→6` con transicion de color. Se lee en 1s donde estas y que falta.
3. **Sorteo como ceremonia, no random.** `draw-ceremony-view.tsx + draw-wheel.tsx` — `DrawWheel` con rotacion `drawWheelRotationDeg(elapsed)` + `ResultsBeat` con `staggerChildren 0.1` y `Tu mision` (Tú expones / Tu pregunta). Convierte una operacion tecnica en momento emocional peak.

## Priority Issues

### [P1] Side-tab `border-l-4` rompe "Miel, no neon" y el floor
**What:** `room-panel.tsx:624` — `<li class="... border-l-4 border-l-primary/60 ...">` en "Tus preguntas".
**Why it matters:** Es el antipatron #1 de craft-floor ("A colored border-left above 1px"). Grita UI generada, compite con el unico acento ambar y contradice DESIGN.md Elevation ("borde 1px outline-variant, no acento lateral").
**Fix:** Quitar `border-l-4`. Reemplazar por `ring-1 ring-primary/20 bg-primary/[0.04]` en el item activo o `border border-primary/15` + `shadow-xs` en hover. Si se quiere acento, usar `::before` de 2px con `rounded-full` interno, no 4px lateral.
**Suggested command:** `/impeccable polish app/materials/_components/room-panel.tsx`

### [P1] QuestionsStage — 3 Cards iguales = wall sin jerarquia
**What:** `room-panel.tsx:QuestionsStage` renderiza "Escribe tu pregunta" + "Tus preguntas" + "Participantes" como 3 Cards idénticas `rounded-xl bg-card ring-foreground/10` en stack `gap-4`.
**Why it matters:** Cognitivo: 3 decisiones visibles sin peso — el primario (escribir) no destaca, el secundario (tus preguntas) compite, el terciario (participantes) es contexto. En el primer paso del ritual, el usuario duda donde mirar. Viola checklist "Single focus" y "Visual hierarchy".
**Fix:** Jerarquizar: 1) Input card como hero (`bg-card` + `ring-primary/20` + `shadow-sm` + `CardTitle text-lg font-heading`), 2) "Tus preguntas" como lista `bg-muted/20 border-dashed` cuando vacia, 3) "Participantes" colapsado en `details/summary` o `Sheet` lateral en desktop. Anadir `Empty` con `border-dashed` + ilustracion Hugeicons cuando `myQuestions.length===0`.
**Suggested command:** `/impeccable layout app/materials/_components/room-panel.tsx`

### [P1] ModeratorNav invisible en Debate + "En vivo" imperceptible
**What:** `room-panel.tsx:354-355` — en Debate `navClass="... border-t border-border/40 pt-3 opacity-80"` y `live` es `size-1.5 rounded-full bg-primary + text-xs`.
**Why it matters:** Operate: el moderador es quien mas necesita ver "Continuar a Cierre" y el estado Realtime en proyeccion/compartida. Con `opacity-80` y punto 6px se pierde en sala con luz. Si Realtime cae, nadie nota "Reconectando…".
**Fix:** En Debate, elevar nav a `sticky bottom-0 bg-card/95 backdrop-blur border-t px-4 py-3` con `Button default` (no ghost sm) y badge de estado mas visible: `Badge variant=secondary` con dot 8px + `aria-live`. Añadir `sonner` persistente para "Reconectando" con retry.
**Suggested command:** `/impeccable harden app/materials/_components/room-panel.tsx`

### [P2] Rampa tipografica rota — 10px/11px fuera de DESIGN.md
**What:** 14 usos de `text-[11px]` y `text-[10px]` (stage-panel + draw-ceremony-view + room-closed-view) para `tracking-[0.1em] uppercase` labels.
**Why it matters:** Rompe el contrato de DESIGN.md y el linter Stitch; futuros agentes no saben si es token o one-off. A 11px con `font-semibold` en dark, el contraste con `muted-foreground/70` puede caer bajo AA si se usa sobre `bg-card`.
**Fix:** Normalizar a `text-xs` (12px declarado como 0.875rem en globals.css) con `tracking-[0.12em]` y `font-bold`, o añadir al sistema `label-sm: { fontSize: 11px, letterSpacing: 0.08em }` en DESIGN.md frontmatter y referenciar `{typography.label-sm}`. Actualizar sidecar `typographyMeta`.
**Suggested command:** `/impeccable typeset app/materials/_components/stage-panel.tsx`

### [P2] Header de Sala generico — oportunidad de editorial
**What:** `room-session-view.tsx:106-112` — `<Badge>Sala</Badge> + h1 "Sesion" (text-2xl font-heading)`.
**Why it matters:** Es el primer viewport de la Sala y no dice nada del ritual ni del material. Para un producto "Private Club", el header deberia ser editorial y orientar: que tertulia es, que material, que etapa.
**Fix:** Componer header como en `RoomClosedView`: `Eyebrow` con `range · Modera X · 8 presentes` en `label-md uppercase`, titulo en `headline-lg` con nombre del material, subtitulo con `range` y `StageBar` debajo. Reutilizar `ChapterRule` sutil entre header y StageBar.
**Suggested command:** `/impeccable polish app/materials/_components/room-session-view.tsx`

## Persona Red Flags

**Sofia — Moderadora veterana (Power User, 40s, modera 2 tertulias/mes, usa teclado, proyecta la Sala)**
- No hay atajos: revelar, continuar, "Volver a Debate" requieren click preciso; en proyeccion pierde el `ghost sm` de Debate. Abandono en paso 4 por friccion repetida. Falla heuristica 7.
- Realtime "En vivo" de 6px no se ve a 3m; si cae, no hay retry visible — queda en "Reconectando…" sin accion. Se queda sin saber si avanzo el sorteo.

**Mateo — Primerizo invitado (First-Timer, 24, entro por invite, nunca uso la Sala)**
- Entra en Preguntas y ve 3 Cards iguales + `InfoButton` tooltip escondido. No entiende "Tu texto es privado. Los demas solo ven que enviaste una." hasta hacer hover. Jargon "Listo = presente + al menos 1 pregunta" en WaitingBanner sin ejemplo. Abandona en paso 1 por incertidumbre de privacidad.
- En Presentes, no ve donde confirmar: `StatusIcon` es `MinusSign`/`Tick` sin label visible, y `WaitingKind` cambia sin animar. No sabe si su click hizo algo.

**Elena — Participante ansiosa (quiere intervenir poco, valora saber que le toca)**
- En Sorteo, "Tu mision" es excelente pero "Orden de intervencion" muestra 8 filas identicas con `initials` pequeños; no distingue a golpe si expone o le responden (solo badge "Tu" y `text-[10px] Expones`). Pico de ansiedad al no encontrar su turno en 2s.
- En Debate, el reloj `phaseClockLabel` + `timerPct` no comunica overtime con claridad; el caption "Extender" aparece tarde y en `muted`.

## Minor Observations

- `WaitingBanner` usa `tone primary` con `bg-primary/10 border-primary/30` correcto, pero `Clock01Icon` en ambos tonos confunde espera vs listo — usar `CheckmarkBadge01` para "Todos listos".
- `PresenceStage` toasts `se unio / esta listo` pueden spamear con 8 miembros entrando a la vez; agrupar en `toast.info("3 miembros listos")`.
- `StagePanel:ActiveTurn` mesa `buildSeats` orden estable bien, pero avatares `size-8` en `TurnSpotlight` compiten con el hero de 4.5rem — reducir a 6 en lista.
- `CierreStage` checklist usa `Badge outline/secondary` con ✓ textual — cambiar a `Tick01Icon` para consistencia con StageBar.
- `RoomClosedView` es ejemplar: `max-w-2xl items-center text-center + ChapterRule ❦ + rating rounded-xl border/40 bg-card/30` — llevar ese ritmo a Sala abierta.

## Questions to Consider

- ¿Y si "Escribe tu pregunta" fuera el unico Card visible al entrar, y el resto apareciera por progressive disclosure tras enviar la primera?
- ¿La moderacion deberia ser siempre `sticky bottom` en Debate, como una mesa de sonido, en lugar de `opacity-80` abajo del scroll?
- ¿Que version confiada de "Presentes" mostraria la mesa sentada (avatares en circulo) en vez de lista vertical?
