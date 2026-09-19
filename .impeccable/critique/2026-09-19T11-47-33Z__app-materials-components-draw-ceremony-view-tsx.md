---
target: Sorteo step of Sala (draw-ceremony-view)
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/draw-ceremony-view.tsx"
target_fingerprint: "sha256:2618ad0296eadc10d069ef04a2a669a0f7288166563bb6cfae5a822dba22dd31"
target_path: /home/andres/Proyectos/cafe-y-tertulia/app/materials/_components/draw-ceremony-view.tsx
timestamp: 2026-09-19T11-47-33Z
slug: app-materials-components-draw-ceremony-view-tsx
---
Method: dual-agent (A: ses_f46868bcaffe2YTLLGytrBM2k0 · B: ses_f46868b60ffeWdD2TYDULqEEKM)

# Critique — Sala · Etapa Sorteo (idle pre-draw)

**Surface:** composed screen (`room-panel.tsx` chrome + `draw-ceremony-view.tsx` `SorteoBeat`)
**Mode:** Operate (execute the draw ritual in a live session)
**Visual truth:** user screenshot (desktop, session “Que es PO”)
**Live inspect:** skipped — desktop browser disconnected from this session
**Detector:** impeccable-engine 0.1.5, exit 0, `[]` on the three TSX targets

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | StageBar + En vivo work; “El sorteo está listo” reads as done; who is in the ciclo is only a count; Continuar signals the stage is finished |
| 2 | Match System / Real World | 2 | Guarantee speaks mesa Spanish; “ciclo”, prize-icon metaphor, and wizard Back/Next do not |
| 3 | User Control and Freedom | 2 | Volver is a real pre-draw exit; Continuar is a trapdoor; Sortear is irreversible with no confirm beside a skip |
| 4 | Consistency and Standards | 2 | Same Back/Next as every Etapa — that is the bug. Presentes has faces + InfoButton; Sorteo has neither. Two default Buttons |
| 5 | Error Prevention | 1 | UI + RPC allow Debate without a draw. Two ámbar primaries. Separate pending flags. Irreversible Sortear next to skip |
| 6 | Recognition Rather Than Recall | 2 | Rule is on-screen; names/faces are not; “ciclo” requires ADR recall |
| 7 | Flexibility and Efficiency | 2 | Extra beat contradicts “entrar a Sorteo ES sortear”. This idle page wastes the expert |
| 8 | Aesthetic and Minimalist Design | 1 | Vacancy, not restraint. Two primaries. Chrome outweighs content. Nothing of the cycle earns a pixel |
| 9 | Error Recovery | 2 | RPC errors toast; skip-draw can land on empty Debate; no undo after Sortear |
| 10 | Help and Documentation | 2 | Guarantee is the right contextual help; Continuar tooltip is the wrong beat (Listos); no InfoButton |
| **Total** | | **18/40** | **Poor** |

## Design Specificity Verdict

**LLM assessment:** Category-interchangeable wizard wearing lounge clothes. Tokens are Café y Tertulias (espresso, Literata, miel). Composition is a five-step SaaS wizard: labeled pills, status heading, helper paragraph, lonely center CTA, outline Back + filled Next. Swap the copy for another product and nothing breaks. ADR-0009’s figure (ciclo, gajos, flechas autor → asignado) is absent — replaced by “2 personas en el ciclo.” PRODUCT says ritual, not tool; this screen directs. The guarantee line is the only sentence that could not live in another app. Ámbar is on the current pill, on Sortear, and on Continuar at once — One Warm Voice Rule broken.

**Deterministic scan:** 0 findings on `draw-ceremony-view.tsx`, `draw-ceremony.tsx`, `room-panel.tsx` (exit 0, JSON `[]`). Engine is healthy (`sorteo-19.html` prototype still returns findings). Detector does not see dual primaries, empty composition, or lying copy — false negative for this class of issue, not a clean bill of health.

**Visual overlays:** none. Browser disconnected; no tab, no injection, no `detect.js`. No user-visible overlay.

## Overall Impression

The user is right. This is a wizard confirmation with lounge paint. Optical primary is footer-right “Continuar a Debate”, not the ritual verb “Sortear”. The ceremony they already built (3-2-1, Tu misión) is gated behind a vacant, skippable door. Biggest opportunity: one miel verb, mesa on stage, title that tells the truth.

## What's Working

1. **Guarantee line is the product.** “Cada uno expone una pregunta ajena — nadie la propia. El texto se revela en tu turno.” Domain-true, sealed-text honest.
2. **StageBar orients.** Labeled Etapas, tick on done, solid miel on Sorteo, muted future. En vivo + Literata session title say “you are in this night.”
3. **The real ceremony is one click away.** Countdown and ResultsBeat already know how to speak at ritual volume. This capture is the waiting room in front of it.

## Priority Issues

### [P1] Two primaries — Continuar outranks Sortear
- **What:** Sortear (center, default) vs Volver (outline) vs Continuar a Debate (filled ámbar + chevron). Continuar is optically stronger. `advance_room_stage` allows draw → debate with no draws row. Two `useRoomMutation` hooks, so pending on one does not block the other.
- **Why it matters:** The moderator’s job is one irreversible matching. The loudest control is “leave.” Debate can open with no Asignaciones.
- **Fix:** One primary: Sortear. Hide, disable, or ghost Continuar until draw.done. Pin the ritual verb as the only filled miel.
- **Suggested command:** `distill` (one action) · `harden` (don’t advance without draw)

### [P1] The stage has no figure — empty salon, no ciclo
- **What:** ADR-0009’s figure is the cycle of people. Capture shows heading, count, paragraph, button, unused espresso. No names, no gajos, no sealed-card metaphor.
- **Why it matters:** Members on Meet cannot glance and see who is in. The draw feels like a settings confirmation. Whitespace is unused room, not ceremonial breathing.
- **Fix:** Put the mesa on stage before the click: faces/names of who entra (and who mira). Sortear under that set, large. Headline you would say out loud (“Sorteamos las misiones”), not a status.
- **Suggested command:** `layout` · `shape` (if the beat is still the wrong object)

### [P1] Copy lies and jargon at the moment of truth
- **What:** “El sorteo está listo” = done. It isn’t. “2 personas en el ciclo.” = ADR talk. Continuar tooltip = Listos (Presentes). Prize/dice metaphor vs CONTEXT (no rifa).
- **Why it matters:** Jordan reads “listo” and clicks Continuar. The mesa does not say “ciclo.”
- **Fix:** Title as an act (“Sortear las misiones” / “Nadie responde la propia”). Count as people with names. Tooltip: “Primero sortea; el texto sigue oculto.”
- **Suggested command:** `clarify`

### [P2] High-stakes with no social proof
- **What:** Irreversible draw, zero faces. Spectator/member lines are tiny muted captions.
- **Why it matters:** You confirm a set you cannot see. Working-memory failure.
- **Fix:** Persist the Presentes set (in-cycle vs mira) as the body of this beat. Guarantee becomes caption under people.
- **Suggested command:** `layout`

### [P2] Ámbar is not scarce
- **What:** Current pill + Sortear + Continuar. Three warm voices.
- **Why it matters:** Miel-no-neón only works if miel is rare.
- **Fix:** Miel only on the ritual control (or only on the current Etapa, not both). Continuar outline/ghost until the draw settles.
- **Suggested command:** `quieter`

## Persona Red Flags

**Jordan (first-timer):** Reads “está listo” as finished → takes textbook Next (Continuar). “ciclo” means nothing. No InfoButton. Guarantee is muted under a lying title. High chance they never press Sortear.

**Casey (distracted, video call / phone):** Glance lands on footer-right filled ámbar — thumb zone, wrong verb. Sortear sits in empty middle. Dual pending: can tap Continuar while Sortear is in flight.

**Inés — miembro en tertulia en vivo (PRODUCT):** App should accompany, not direct. Empty well on a shared screen is embarrassing. Continuar pulls the night forward before matching exists — the app becomes a bad host.

## Cognitive load

6/8 checklist failures (high): single focus, grouping, hierarchy, one thing at a time, working memory, progressive disclosure. Three actions under the numeric cap, but two look primary.

## Emotional journey

This frame is the valley before the peak, and it is optional to skip. Peak should be hush → shared beat → Tu misión. Reassurance is whispered (`text-sm muted`); the skip is shouted.

## Minor Observations

- `STAGE_HELP.draw.nextCondition` copy-pasted from Presentes
- Idle `text-2xl` vs countdown `text-7xl` — system already knows ritual volume
- Member wait copy is a dead end: no who, no when, no faces
- Flat-by-default is respected; the problem is there is nothing to elevate
- Detector silence is expected: these are composition/copy/IA defects, not token violations

## Questions to Consider

- If the code already says entrar a Sorteo ES sortear, why does this page exist as the live beat?
- What if Sortear and Continuar were the same action — the ritual is the advance?
- If Inés should not look at the app, what must be true in two seconds of peripheral vision?
