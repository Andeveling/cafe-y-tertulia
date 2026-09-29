---
target: materials grid (app/materials/_components/materials-grid.tsx)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/materials-grid.tsx"
target_fingerprint: "sha256:90ec48b4f628d28a545917c52decc4f3fba5a3f0b9f8015fe4519a8ef390aa22"
target_path: /home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/materials-grid.tsx
timestamp: 2026-09-29T02-06-31Z
slug: app-materials-components-materials-grid-tsx
---
# Critique — Materials Grid (estantería) — app/materials/_components/materials-grid.tsx

## Report header
Method: degraded single-context (nested subagent depth limit blocked parallel A/B; Assessment A design review then Assessment B detector run sequentially, no isolation). Note: an earlier `detect --json` clean result ([]) was already in context before Assessment A finished, so the specificity verdict below is mildly anchored; scores were held to the rubric regardless.

## Design Health Score — 25/40 (Aceptable, Operate funcional pero intercambiable)

| # | Heuristica | Score | Hallazgo clave |
|---|------------|-------|----------------|
| 1 | Visibility of System Status | 3 | Badges Seleccionado/En curso/Terminado + sesiones + rating orientan; pero Propuesto = ausencia de badge (ambiguo) y no se marca el material activo de la semana. |
| 2 | Match System / Real World | 3 | Español del dominio correcto (Libro/Podcast, Propuesto…, sesión/sesiones, sin votos); la tarjeta no habla ritual: nada de estantería/tertulia más allá del copy padre. |
| 3 | User Control and Freedom | 3 | Toda la tarjeta es un enlace (salida/entrada trivial); sin acciones destructivas; sin filtros que limpiar — bien para el alcance actual. |
| 4 | Consistency and Standards | 3 | shadcn Card/Badge + Hugeicons consistentes; desvíos: `hover:ring-foreground/25` sin ancho de anillo (posible clase muerta) y `text-xs` ad hoc fuera de rampa de labels. |
| 5 | Error Prevention | 2 | `MaterialCover` con fallback onError (bien); pero `alt=""` en portada significativa y sin guard para título/autor vacíos. |
| 6 | Recognition Rather Than Recall | 2 | Kind con icono fantasma + etiqueta (bien); Propuesto exige inferir ausencia; `sessions_count` desnudo exige recordar qué cuenta. |
| 7 | Flexibility and Efficiency | 2 | Sin buscar/filtrar/ordenar; con 12+ materiales la estantería es scroll largo; sin atajos (aceptable aquí, débil a escala). |
| 8 | Aesthetic and Minimalist Design | 3 | Tarjeta limpia y enfocada; ruido leve: kind triplemente codificado (icono fantasma + label fallback + línea "autor · kind"). |
| 9 | Error Recovery | 2 | Fallback de imagen existe; título/autor rotos/vacíos no se manejan; `created_at` se pide y no se muestra (dato muerto). |
| 10 | Help and Documentation | 2 | Sin ayuda contextual: qué significa cada estado, qué pasa al abrir, qué es "sesión". El patrón STAGE_HELP de la Sala no se reutiliza. |
| **Total** | | **25/40** | **Aceptable — funciona, pero podría ser cualquier mediateca** |

Modo: **Operate** (la miembra completa la tarea: repasar la estantería y abrir un material). H7 y H10 aplican completas; ninguna es n/a, máximo 40.

## Design Specificity Verdict

**LLM assessment — limpia, Lounge-coherente, pero intercambiable.** Los tokens están bien usados (`bg-muted/40`, `text-primary/25`, `ring` hover, `border-t` en footer, `tabular-nums` en rating) y el fallback de portada — etiqueta de kind en mayúsculas + icono gigante fantasma (`-bottom-4 right-3 size-24 text-primary/25`, materials-grid.tsx:69-78) — es el único momento authored: garantiza que nunca se vea un icono de imagen rota, muy "casa". Todo lo demás lo firmaría cualquier mediateca: grid de Cards 2/3 col, Badge de estado genérico, título en Manrope medium (¡sin Literata en toda la tarjeta!), fila de meta gris. La promesa del copy padre — "La estantería de {grupo}" — no se cumple visualmente: no hay estantería, ni madera, ni lomo, ni serif editorial, ni ancla de "esta semana". Una estantería de 10 libros propuestos se ve como 10 rectángulos idénticos salvo el título.

**Deterministic scan — limpio: `[]`, exit 0** sobre `materials-grid.tsx` + `material-cover.tsx` + `rating-display.tsx` (3 archivos). Cero findings, cero falsos positivos que descartar. El detector no vio lo que el ojo sí ve (clase hover posiblemente muerta, `alt=""`, triple codificación del kind): esta es una corrida donde el review humano aporta todo el valor.

**Visual overlays — no disponibles.** Sin herramienta de automatización de navegador en este harness: no se abrió pestaña, no se inyectó `detect.js`, no existe overlay visible. Fallback: evidencia CLI + lectura de fuente. (Hay devServer en :3000 a nivel informativo; no se inició/detuvo ningún servidor en esta corrida.)

## Overall Impression

La estantería cumple su trabajo — repasar y abrir — con tarjetas generosas y un fallback con carácter. Pero es el momento menos "salón a media luz" del producto que he visto: el Debate tiene TurnSpotlight en itálica serif, el Sorteo es ceremonia; aquí no hay ni una línea de Literata. La mayor oportunidad es **darle voz editorial a la tarjeta (título serif, ancla semanal) y convertir los estados en sistema explícito**, no en presencia/ausencia de Badge.

## What's Working

1. **Fallback de portada con carácter.** `materials-grid.tsx:69-78` — etiqueta de kind `uppercase tracking-widest` + icono fantasma `size-24 text-primary/25` + `MaterialCover` con `onError → fallback` (`material-cover.tsx:19-26`). Jamás una imagen rota; coherente con "Miel, no neón".
2. **Toda la tarjeta es el enlace.** `materials-grid.tsx:61-62` + título con `group-hover:text-primary transition-colors` (`:92`). Click generoso, bueno para pulgar móvil y para teclado (foco nativo del enlace).
3. **RatingDisplay accesible y honesto.** `rating-display.tsx:60-91` — `role="img"` con `aria-label` completo, `tabular-nums`, estados `sin votos` / `— · N votos` sin inventar datos. Detalle premium real.

## Priority Issues

### [P1] Hover sin affordance: `hover:ring-foreground/25` sin ancho de anillo
- **What**: `materials-grid.tsx:62` — `hover:ring-foreground/25` solo fija color de anillo; sin `ring-1/2` (ni `ring` base) la mayoría de builds no pinta nada. El único feedback hover es el título → primary. Sin estilo `focus-visible` tampoco hay confirmación por teclado.
- **Why it matters**: la tarjeta parece no-clicable hasta adivinarlo; usuarias de teclado (Sam) no ven a dónde van.
- **Fix**: `hover:ring-1 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50` (o `hover:border-primary/30`). Verificar en build que el anillo aparece.
- **Suggested command**: /impeccable polish

### [P1] Propuesto codificado como ausencia de Badge
- **What**: `materials-grid.tsx:82-89` — `m.status !== "proposed" ? <Badge/> : null`. La ausencia significa algo, pero nada lo dice.
- **Why it matters**: viola reconocimiento > recuerdo; Jordan no distingue "propuesto" de "dato faltante" y escanear "qué se propuso" exige inferencia por descarte.
- **Fix**: Badge explícito `Propuesto` en variante outline/ghost muted para cada tarjeta; reserva `default`/`secondary` para estados activos.
- **Suggested command**: /impeccable clarify

### [P1] `alt=""` en portada significativa
- **What**: `materials-grid.tsx:67` pasa `alt=""` a `MaterialCover` (`material-cover.tsx:21-27`). La portada es el único diferenciador visual; el nombre accesible del enlace cae solo al título.
- **Why it matters**: Sam no recibe nada de la imagen; si el título es vago ("Tertulia 12"), la tarjeta es opaca.
- **Fix**: `alt={Portada de ${m.title}}` cuando hay `src`; mantener `alt=""` solo en el fallback fantasma (decorativo, ya `aria-hidden`).
- **Suggested command**: /impeccable audit

### [P2] Kind triplemente codificado, autor pierde su línea
- **What**: icono fantasma + label fallback (`:70-77`) + línea `autor · kind` (`:95-97`). La línea de autor gasta su única jerarquía repitiendo lo que el cover ya dice.
- **Why it matters**: ruido visual; a 10 tarjetas la repetición cansa y el autor —dato humano del ritual— queda diluido.
- **Fix**: línea solo con autor (+ año si existe); el kind vive en cover/label. Alternativa: chip de kind y quitar el fantasma. Decidir una sola codificación primaria.
- **Suggested command**: /impeccable distill

### [P2] Sin ancla semanal ni voz editorial (Literata ausente, muro de sameness)
- **What**: títulos en `font-medium` sans (`:92`); 10 libros propuestos con fallback = 10 rectángulos idénticos; nada marca "lo de esta semana" aunque exista `selected`/`in_progress`.
- **Why it matters**: Lucía (miembra que prepara la tertulia) debe escanear badge por badge para responder "¿qué toca?"; la estantería no celebra el ritual.
- **Fix**: título en Literata (`font-heading`), sección o borde cálido para el material activo de la semana; a escala, filtro por kind/estado o agrupación por estado.
- **Suggested command**: /impeccable typeset + /impeccable layout

## Persona Red Flags

**Jordan (first-timer)**: badge-ausente = Propuesto (inferencia); "3 sesiones" sin explicar qué es una sesión ni qué pasa al abrir; sin ayuda sobre Seleccionado vs En curso; tras el clic, destino desconocido (detalle sin preview). Riesgo de vagar sin proponer.

**Sam (a11y)**: portadas `alt=""` (contenido perdido); cambio de color del título solo-hover (invisible a teclado/SR, sin `focus-visible`); kind del fallback solo-visual aunque el icono esté `aria-hidden` (correcto) — el texto plano lo salva a medias. Targets táctiles/teclado bien por el enlace completo.

**Casey (móvil distraída)**: 1 columna en móvil y `loading="lazy"` bien; tarjeta completa = target generoso; imágenes externas sin `sizes` (descarga de más en móvil); sin persistencia de scroll/filtro (no hay filtros — deuda futura, no actual).

**Lucía (miembra del club, prepara la tertulia — project-specific)**: la pregunta "¿qué toca esta semana?" exige escaneo badge por badge; `created_at` muerto (podría decir "propuesto hace 3 días"); rating `sin votos` no invita a votar desde la estantería.

## Cognitive Load

Checklist: single-focus ✓ · chunking ✓ · grouping ✓ · hierarchy ✓ · one-thing-at-a-time ✓ · minimal-choices ✗ (N tarjetas visibles a la vez, sin agrupar/filtrar) · working-memory ✓ · progressive-disclosure ✗ (todo el metadata siempre visible). **2 fallos = carga moderada.** Punto de decisión >4 opciones: el propio grid (N tarjetas simultáneas; con 12+ materiales, muro de opciones).

## Emotional Journey

Peak esperado: encontrar "nuestra próxima lectura". Hoy el peak es plano: todo pesa igual. End: clic al detalle (correcto pero sin antesala). Valle: estantería de fallbacks idénticos (10 libros = 10 fantasmas Book01). Reassurance: proponer (botón padre) no previsualiza cómo quedará en la estantería — pequeña ansiedad evitable.

## Minor Observations

- `text-xs` ad hoc (badge override `:85`, autor `:95`, sesiones `:99`, `sin votos`) vs rampa de labels de DESIGN — misma familia que la Sala; unificar en `label-sm/md`.
- Pluralización `1 sesión / N sesiones` (`:100-101`) cuidada — bien.
- `created_at` se trae y no se pinta — o "propuesto hace…" o se saca del query.
- Alias compat `VariantC` (`:114-115`) — deuda tech inofensiva, documentada.
- `aria-hidden` en icono fantasma (`:76`) correcto.

## Questions to Consider

- ¿Y si el material de esta semana se sintiera como "el libro sobre la mesa", no como una tarjeta más?
- ¿La estantería necesita Literata para sonar a tertulia, o basta con un detalle cálido?
- ¿"Propuesto" merece su insignia tanto como "En curso"?
- ¿Cuántos materiales aguanta este grid antes de pedir filtro — 12, 20, 50?
