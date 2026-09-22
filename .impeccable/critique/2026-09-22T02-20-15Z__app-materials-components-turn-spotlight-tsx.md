---
target: room TurnSpotlight En la palabra Edwar Sanz
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/turn-spotlight.tsx"
target_fingerprint: "sha256:6151756ecab8006ff9c3d51ff7870c734e0cef46af383c7667051ae209f2a568"
target_path: /home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/turn-spotlight.tsx
timestamp: 2026-09-22T02-20-15Z
slug: app-materials-components-turn-spotlight-tsx
closed: true
---
# Critique — Sala Debate TurnSpotlight (En la palabra / Edwar Sanz)

Target phrasing: critique room TurnSpotlight En la palabra Edwar Sanz
Resolved: app/materials/_components/turn-spotlight.tsx (screenshot is NOT waiting-reveal-view.tsx; that file is sealed-question pause)
Method: dual-agent (A: design review · B: detector+browser evidence)
Mode: Operate — la conversación primero, la app acompaña invisible.

## Health 20/40 Acceptable (bajo)
| # | Heurística | Score | Key Issue |
|---|---|---|---|
|1|Visibilidad|2|4 canales de estado compiten; 49:17 sin semántica overtime|
|2|Mundo real|2|COMPLEMENTA/En vivo/hearts suenan a streaming, no a tertulia|
|3|Control|1|Dialog focus auto-open por turno, sin salida quieta|
|4|Consistencia|2|Dos barras, dos pills COMPLEMENTO/COMPLEMENTA, dos roles|
|5|Prevención|2|+1 min junto al reloj, hearts votables sin contexto|
|6|Reconocimiento|3|Pregunta visible completa — lo mejor; footer confunde autor vs speaker|
|7|Flexibilidad|1|Sin modo quieto/glance; expandir agranda, nunca calma|
|8|Minimalismo|0|~12 pesos compitiendo; 5 héroes donde Operate pide 1|
|9|Recuperación|2|turnCopy "tú escuchas" existe pero bajo el fold|
|10|Ayuda|3|Se entiende "escuchar"; icono speaker ambiguo|

## Especificidad
LLM: tokens correctos (espresso, miel, Literata+Manrope) pero composición intercambiable Twitch/Kahoot. Viola reglas DESIGN.md: One Warm Voice (4 ámbar + 3 primary a la vez), Literata Speaks Last (timer, nombre, comilla, pregunta todo en serif), triple kicker (EN LA PALABRA + COMPLEMENTA + PREGUNTA DE…).
Detector: clean [] exit 0 en waiting-reveal-view.tsx y stage-panel.tsx. Scanner ciego a semántica: no ve duplicado aria-label en render, icon-only en active-turn, ni contraste muted-foreground. Room URL 307→/auth/login, sin verificación autenticada.

## Impresión
Funciona como dashboard de proceso, falla como compañero pausado. Oportunidad: convertir la pregunta en único héroe y todo lo demás en susurro.

## Funciona (2)
- Single-card TurnSpotlight: instinto correcto, restar dentro no reestructurar.
- Blockquote + PREGUNTA DE… editorial: lo único que se siente círculo literario; promover a héroe.

## P1 Cinco héroes, cero jerarquía
What: stepper + Turno/COMPLEMENTO + EN LA PALABRA/49:17/barra + Edwar/COMPLEMENTA + pregunta + hearts pelean.
Why: "pelea por atención" literal; ~9 pesos sobre presupuesto quieto Operate.
Fix: 1 héroe (pregunta), 1 línea status quieta, timer a text-sm muted, merge pills, hearts fuera del complemento activo.
Suggested: /impeccable quieter

## P1 Timer domina y miente
What: 49:17 en Literata text-3xl junto a label 11px; 5:00+overtime esperado.
Why: urgencia donde ritual promete pausado; rompe confianza Realtime.
Fix: Manrope text-sm tabular muted right, matar una de las dos barras, clamp interventionDisplay.
Suggested: /impeccable layout

## P1 Dialog auto-focus secuestra Operate
What: Dialog open por defecto cada turnKey (active-turn.tsx:114-124,346).
Why: compañera se vuelve modal compitiendo con Meet.
Fix: inline por defecto, foco opt-in, affordance "solo pregunta", nunca auto-open.
Suggested: /impeccable harden

## P2 Hearts durante escucha
What: 5 outline hearts (5 opciones > límite 4) durante complemento.
Why: votar vs escuchar, juicio mid-speech, anti "miel".
Fix: mover a post-turno / single quiet apreciar; LastAprecio ya es su casa.
Suggested: /impeccable distill

## Personas
- Tertuliano en Meet (proyecto): Meet+card = dos stages; minimizará app y pierde pregunta.
- Sam: labels 11px uppercase muted sobre espresso, serif numerals — legibilidad crítica.
- Riley nuevo/inseguro: COMPLEMENTA+hearts = perform y sé juzgado; sin reassurance en viewport.

## Menor
- PREGUNTA DE EDWAR cuando speaker==autor redundante; lógica "Tu pregunta".
- Speaker icon ambiguo (¿TTS?); si decorativo fuera.
- Avatar cyan cartoon rompe warmth; 4.5rem→2.5rem.
- Doble progreso Turno 1 de 2 + 1/2+barra; dejar uno.
- ≥5 reglas horizontales en una card; dejar borde card, resto espacio.

## Preguntas
- ¿Si la videollamada es el stage, y si la card se rinde a caption?
- ¿Qué se rompe si hearts solo entre turnos?
- ¿Qué frase en 3s debe llevarse el distraído — es hoy lo más grande?
