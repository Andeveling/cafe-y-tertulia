---
target: Estantería de materiales
total_score: 16
max_score: 32
na_heuristics: 5,9
p0_count: 1
p1_count: 2
target_identity: "file:/home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/materials-grid.tsx"
target_fingerprint: "sha256:90ec48b4f628d28a545917c52decc4f3fba5a3f0b9f8015fe4519a8ef390aa22"
target_path: /home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/materials-grid.tsx
timestamp: 2026-09-29T02-07-13Z
slug: app-materials-components-materials-grid-tsx
---
Method: dual-agent (A: ses_f1517beafffexgd9mt71TVgKOz · B: ses_f1517beaeffeY7LFsdDtBWQQ4A)

# Critique: Estantería de materiales (`app/materials/_components/materials-grid.tsx` + `app/g/[slug]/materiales/page.tsx`)

Mode: Operate. Review source-only (no browser connected); detector exit 0 with zero hits.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | El estado mayoritario (`proposed`) no renderiza badge; 5 de 6 cards sin señal de estado |
| 2 | Match System / Real World | 3 | Buen español de dominio; "sin votos" y "— · N votos" suenan a base de datos |
| 3 | User Control and Freedom | 3 | Card-enlace completa + CTA visible; sin salidas que falten |
| 4 | Consistency and Standards | 2 | Pills presentes en 3 estados y ausentes en 1; significado solo en color de variante |
| 5 | Error Prevention | n/a | Grid de solo lectura, sin entradas |
| 6 | Recognition Rather Than Recall | 2 | Propuesto exige recordar; 5 bandas idénticas obligan a leer cada título |
| 7 | Flexibility and Efficiency | 1 | Sin filtro, orden ni búsqueda; escaneo lineal |
| 8 | Aesthetic and Minimalist Design | 2 | Footer apelotonado; banda fallback de 112px como marca de agua |
| 9 | Error Recovery | n/a | Sin superficie de error de usuario; imagen rota degrada en silencio |
| 10 | Help and Documentation | 2 | Vacío sin CTA; nada explica el pipeline proponer → tertuliar |

**Total: 16/32 (50% — Acceptable).** Dos heurísticas n/a (5, 9); el máximo aplicable es 32.

## Design Specificity Verdict

**LLM assessment**: Intercambiable de categoría con barniz español. Los títulos hablan en Manrope cuando DESIGN.md reserva Literata para exactamente esto; la banda es una franja gris genérica, no un estante; el ritual Propuesto → Terminado no se lee en ningún lado; la cabecera es un caption gris donde el sistema pide un headline Literata. Oportunidades perdidas: títulos en serif, estado como posición ritual, textura por tipo de material, vacío como invitación.

**Deterministic scan**: `impeccable detect --json` sobre los 4 archivos, exit 0, cero hallazgos. El escáner mecánico no ve nada de lo anterior: todo el peso del reporte viene del juicio de diseño, no hay falsos positivos que descartar.

**Visual overlays**: No disponibles — sin navegador conectado a la sesión; no se inició ningún servidor para visualización.

## Overall Impression

Funciona como lista de archivos, no como la estantería de un círculo literario. El golpe más duro: el pulido de hoy (ocultar "Propuesto") esconde el estado por defecto del ritual — la review lo marca P0 y tiene razón. Lo más barato y con más retorno: devolver el pill siempre y pasar los títulos a Literata.

## What's Working

1. **Card-enlace completa con semántica de lista** (`ul > li > Link.block.h-full`): un tab-stop por card, alturas iguales, sin enlaces anidados.
2. **Contrato accesible del rating** (`role="img"` + `aria-label` completo, estrellas `aria-hidden`): el lector de pantalla recibe el dato en una emisión.
3. **Economía de texto**: título a 2 líneas + un byline; la grilla se mantiene pareja con títulos de cualquier largo.

## Priority Issues

### [P0] El estado mayoritario es invisible (`materials-grid.tsx:82-89`)
- **What**: `proposed` no renderiza badge; el resto sí. 5 de 6 cards sin señal.
- **Why it matters**: El miembro no distingue "propuesto" de "dato roto"; el pipeline del ritual — el producto — queda mudo en su paso por defecto.
- **Fix**: Renderizar siempre el pill; Propuesto en tratamiento silencioso (`outline`/muted), ámbar reservado para `selected`/`in_progress`.
- **Suggested command**: `/impeccable clarify`

### [P1] Cinco bandas fallback idénticas (`:63-81`)
- **What**: `h-28 bg-muted/40` + micro-label + icono fantasma gigante recortado. Muro de monotonía; el icono duplica el byline.
- **Why it matters**: Mata el escaneo visual y el pico emocional del estante; el gris pelea con el sistema tonal espresso.
- **Fix**: Autorear el fallback como superficie lounge (contenedor tonal, motivo legible por tipo: lomo/libro, onda/podcast…), no como disculpa por foto ausente.
- **Suggested command**: `/impeccable shape` o `/impeccable colorize`

### [P1] Los títulos hablan con la voz equivocada (`:92`)
- **What**: Manrope `font-medium` donde corresponde Literata ("títulos que merecen ser leídos en voz alta").
- **Why it matters**: La palanca de identidad más barata de la superficie, sin jalar. Manrope = Jira; Literata = círculo literario.
- **Fix**: `font-heading` al título, `line-clamp-2 leading-snug`; byline y footer quedan en Manrope.
- **Suggested command**: `/impeccable typeset`

### [P2] Footer sobrecargado (`:98-104` + `rating-display.tsx:37-51`)
- **What**: Sesiones + 5 estrellas + promedio + votos en una fila `text-xs`; dos formatos nulos ("sin votos" vs "— · N votos", el guion parece bug).
- **Why it matters**: Tres números y cinco glifos para responder "¿le gustó al grupo?".
- **Fix**: Un solo juicio (estrellas + promedio si hay votos; "Sin votos todavía" si no), sesiones al byline, unificar nulo y capitalización.
- **Suggested command**: `/impeccable distill`

### [P2] La cabecera no tiene placa (`page.tsx:26-37`)
- **What**: "La estantería de X." en `text-sm muted` junto al CTA: solo kicker, sin heading; con nombre largo el botón se aprieta en móvil.
- **Why it matters**: Llegada plana, identidad del grupo ausente, riesgo responsive en la única acción.
- **Fix**: `headline-lg` Literata ("La estantería de {grupo}"), CTA con apilado en angosto.
- **Suggested command**: `/impeccable typeset` o `/impeccable layout`

## Persona Red Flags

**Sam (accesibilidad)**: el `Link` envolvente anuncia sopa de texto concatenado sin nombre claro; las portadas reales llevan `alt=""` (el ancla visual de los demás no existe para Sam); el estado propuesto es silencio; el hover ámbar no tiene equivalente `:focus-visible`.
**Jordan (primerizo)**: nada explica el pipeline ni qué hacer primero; el vacío (`page.tsx:39-50`) enseña pero sin CTA — el momento de enseñar y la acción viven en lugares distintos.
**Casey (móvil distraído)**: microcopy de 11px ilegible a distancia, cinco estrellas de 14px para decidir "¿cuál mola?", y la cabecera `justify-between` que exprime el CTA con nombres largos.

## Minor Observations

- `transition-shadow` + `hover:ring` pelea con flat-by-default y la transición no anima nada (sin sombra que cambie).
- Banda `bg-muted/40` sobre `bg-card` sin delineación de 1px: el borde se ve accidental.
- Labels de estado/tipo duplicados para esquivar `server-only`: riesgo de deriva silenciosa en un rename.
- Alias `VariantC` y imports sin uso en `page.tsx` (`redirect`, `getGroupBySlug`): deuda de prototipo/refactor.
- Icono decorativo del vacío sin `aria-hidden`: será anunciado.

## Questions to Consider

- ¿Y si el estante mostrara tres libros (ahora / próximo / amado) en vez de N cards, con el archivo plegado debajo?
- ¿Cómo se vería con cero portadas, con orgullo — lomos, no pósters — si lo sin-imagen es la norma?
- ¿Para quién es el footer: para el auditor que cuenta artefactos o para el miembro que decide qué sentir?
