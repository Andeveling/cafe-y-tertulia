---
target: ruleta del sorteo (DrawWheel)
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/draw-wheel.tsx"
target_fingerprint: "sha256:0ac1388be8b6c99ea63876ecb0b7c14f663f94cf9bbed7ab79d928d0fb2094f9"
target_path: /home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/draw-wheel.tsx
timestamp: 2026-09-19T00-44-31Z
slug: app-materials-components-draw-wheel-tsx
---
Method: dual-agent (A: ses_f48e278b0ffemf42sicOgn6StJ · B: ses_f48e278b0ffdMU9LZ2EvUqu91k)

## Design Health Score — Sorteo / DrawWheel

| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Cuenta 3-2-1 computada jamás renderizada; "Sorteando" estático 3.9s |
| 2 | Match System / Real World | 1 | Diagrama orbital promete ciclo; modelo real es derangement 1:1 |
| 3 | User Control and Freedom | 2 | Sin salida ni re-ejecución visible durante 3.9s |
| 4 | Consistency and Standards | 1 | Rompe Flat-By-Default, Literata Speaks Last; `DrawWheel` vs glosario que prohíbe "Ruleta" |
| 5 | Error Prevention | 2 | N=1 no bloqueado; self-loop asignaría la propia |
| 6 | Recognition Rather Than Recall | 1 | Solo iniciales 8px; misión/turno ocultos en el momento crítico |
| 7 | Flexibility and Efficiency | 1 | Sin skip para moderador experto; ~4s + stagger×N siempre |
| 8 | Aesthetic and Minimalist Design | 1 | Doble anillo + 8 vueltas + sway infinito para cero datos |
| 9 | Error Recovery | 2 | Lag realtime = giro infinito indistinguible de "sorteando" |
| 10 | Help and Documentation | 2 | Copy tranquilizador desaparece justo durante el giro |
| **Total** | | **14/40** | **Poor (30-49%)** |

## Design Specificity Verdict

**LLM assessment:** Intercambiable y auto-prohibida. Composición orbital genérica (círculo + nodos + flechas) que serviría a un load-balancer o slot machine. Nada dice club de lectura, pregunta ajena, texto oculto hasta Intervención, noche por videollamada. CONTEXT.md prohíbe "Ruleta, rifa"; el componente se llama `DrawWheel`, aria-label "Ciclo del sorteo girando", y el usuario la percibe como ruleta. Lo único específico — `ResultsBeat` ("Tu misión / Tú expones / Orden de intervención / textos ocultos") — es el ritual real enterrado una vista después.

**Deterministic scan:** `impeccable detect --json` sobre los 3 archivos: exit 0, `[]`, 0 findings. Limpio porque los tokens visibles son legítimos (`text-label-sm`, `text-xs` + muted, `→` con aria-hidden, `·` fallback, live region duplicada). El detector no cubre SVG `<text>` 8-9px, semántica del diagrama, ni copy ritual — todo el problema vive fuera de su alcance. Sin falsos positivos que descartar.

**Visual overlays:** No hay overlay visible — Assessment B no tuvo browser automation en su runtime (solo archivos/shell), así que no se creó tab ni se inyectó `detect.js` (ausente en scripts/). Dev server confirmado vivo (:3000, 307) pero sin URL de ceremonia navegable (requiere Sala autenticada). Fallback: captura del usuario + lectura de código como evidencia.

## Overall Impression

Tenés razón: es un capricho. Ingeniería de reloj compartido sólida con un render que miente sobre la mecánica, esconde la información cuando más importa y deja como recuerdo el giro vacío en vez de la misión. El reemplazo ya existe (`ResultsBeat`) — hay que llevarlo al frente y matar el orbital.

## What's Working

1. **Reloj compartido derivado de `created_at`** (`draw-ceremony.ts`, tick 80ms, freeze en fanfare hasta asignaciones autoritativas). Sincronía real multi-dispositivo. Conservar tal cual.
2. **`ResultsBeat` ya es el ritual** ("Tu misión" ámbar + pregunta neutra, orden numerado tabular, stagger blur sobrio, "Los textos se ocultan hasta el debate"). Miel-no-neón, tipografía correcta. Elevar, no rehacer.
3. **Pre-copy honesto** ("Luego ves a quién te tocó — el texto espera al debate") y `countLabel` "vacío". Buena voz de salón; lástima que desaparece en motion.

## Priority Issues

### [P1] El visual miente sobre la mecánica
**What:** `draw-wheel.tsx:126-150` dibuja flechas entre nodos equidistantes. A N=3 parece ciclo místico; a N≥6 espagueti; a N=1 self-loop invisible que violaría "nadie la propia".
**Why:** El usuario sale creyendo en vueltas, no en "cada uno una ajena". Falla el modelo mental del sorteo.
**Fix:** Eliminar diagrama orbital. Enunciar garantía en una línea persistente.
**Suggested command:** /impeccable shape + /impeccable distill

### [P1] Cuenta atrás computada pero jamás mostrada
**What:** `drawCeremonyPhase` devuelve `count: 3|2|1`; `WheelBeat` lo ignora y renderiza "Sorteando" fijo durante 3.9s de giro (`DRAW_WHEEL_TURNS=8`).
**Why:** Se paga sincronía sin cobrar ritual. El 3-2-1 compartido en voz alta es el pegamento de la videollamada.
**Fix:** Beat tipográfico 3-2-1 en Literata grande con el count existente, o eliminar el beat entero (click → misión directo).
**Suggested command:** /impeccable animate

### [P1] High-stakes sin reassurance
**What:** Copy tranquilizador suprimido en motion (`inMotion ? null`); live region solo repite título. Nunca se dice "nadie recibe la propia, el texto se revela en tu turno" durante el giro.
**Why:** El azar define tu noche; sin contención verbal queda ansiedad + casino.
**Fix:** Línea de garantía persistente bajo el beat, antes/durante/después.
**Suggested command:** /impeccable shape + /impeccable clarify

### [P2] Ilegible por construcción + edge cases
**What:** SVG 8-9px, `role="img"` esconde nombres al AT, labels polares colisionan a N grande, `size-56` fijo; guard solo `total===0` (N=1 gira); espectador sin rastro durante giro; lag = giro infinito sin mensaje.
**Why:** Rompe WCAG AA exigido, móvil en videollamada, y reversibilidad del moderador.
**Fix:** Lista HTML real (no SVG text), guard N≥2, fila "miras esta ronda" persistente, estado "esperando red" con timeout + skip para experto.
**Suggested command:** /impeccable layout + /impeccable harden

## Persona Red Flags

**Sam (lector de pantalla/teclado):** Bloqueado. `role="img"` + `<text>` SVG + sr-only genérico = cero nombres, misión o turnos durante ~4-8s. Falla AA.
**Casey (móvil en videollamada, atención dividida):** Wheel 224px + `py-10` saca el contexto del viewport; iniciales 8px ilegibles con Meet/PIP encima; el giro roba la única mirada disponible.
**Tertuliano en videollamada (proyecto-específica):** Necesita número grande, frase de garantía y misión en texto grande. Recibe decoración silenciosa que no se lee de reojo.

## Minor Observations

- Sway idle `[-4,4]` 5.5s infinito: ruido de fondo en la espera más larga; contradice "hushed".
- Labels contrarotados terminan boca abajo a mitad de giro por diseño.
- "Las parejas" describe el diagrama, no al usuario; dominio dice **Asignación**.
- "El sorteo está listo" / "Sorteando" (gerundio sin objeto) obligan a inferir quién actúa.

## Questions to Consider

- Si leés los títulos en voz alta ("El sorteo está listo / Sorteando / Las parejas"), ¿dónde está el salón? ¿En qué se diferencia de una rifa?
- ¿Qué pierde la noche si el sorteo dura 0ms? Si es "nada", es decoración; si es "suspenso compartido", ¿por qué no tiene número, voz ni rostros?
- El dominio prohíbe "Ruleta" y el código exporta `DrawWheel`. ¿Cuántas capas más usan el nombre prohibido?
