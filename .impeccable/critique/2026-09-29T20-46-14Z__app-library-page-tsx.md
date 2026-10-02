---
target: /library la page
total_score: 13
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/home/andres/Proyectos/cafe-y-tertulia/app/library/page.tsx"
target_fingerprint: "sha256:8d85331069684dbbabca207abf71843a02351816e8badc404c9a54dfc35dd280"
target_path: /home/andres/Proyectos/cafe-y-tertulia/app/library/page.tsx
timestamp: 2026-09-29T20-46-14Z
slug: app-library-page-tsx
---
# Critique: /library (Mi biblioteca) — 2026-09-29

Method: dual-agent (A: design review · B: detector). Screenshots: desktop 1440 + mobile 390, authenticated, zero console/page errors. Detector: exit 0, 0 findings.

## Heuristics: 13/40 (Poor)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No progress/draft state; NOVATO·0% signals zero status |
| 2 | Match System / Real World | 2 | Correct words, wrong object: no shelf/covers; Fuente/Imagen speak as DB fields |
| 3 | User Control and Freedom | 1 | No edit entry; one-click irreversible ghost delete, no undo/confirm |
| 4 | Consistency and Standards | 2 | Same Book01Icon for Materiales and Biblioteca; h1 Biblioteca + h2 Mi biblioteca duplicate |
| 5 | Error Prevention | 1 | Ghost Borrar no confirm; required-vs-optional only implied; raw URL boxes no preview |
| 6 | Recognition Rather Than Recall | 1 | Six full-weight fields force recall; after-save path (postular) invisible |
| 7 | Flexibility and Efficiency | 1 | Single path, no clone/import/filter; expert with 20 candidates gets same slog |
| 8 | Aesthetic and Minimalist Design | 1 | Two amber masses + six equal inputs + duplicated description/empty copy |
| 9 | Error Recovery | 2 | FieldError/aria-invalid/toast plumbing fine; no recovery guidance, no autocomplete/describedby |
| 10 | Help and Documentation | 0 | Privacy asserted but no link/preview/next step toward postular |

## Specificity: interchangeable with dark paint

Tokens correct (espresso card, amber CTA, Literata/Manrope) but composition is generic shadcn Card + six inputs. No shelf, no covers, no honest-empty border-dashed, no bridge to postular. Only product-specific line is the CardDescription privacy sentence.

## Priority issues

- [P0] Placeholders impersonate filled values (Título/Autor render like values on empty account; placeholders use real book/author names).
- [P1] Floating pill/avatar overlaps content (covers empty-state text on mobile, floats over card on desktop).
- [P1] Six equal-weight fields, no staging; after-save path invisible (no mention of postular flow).
- [P2] No edit, no-confirm delete; saved rows are dead text (edit prop exists, never rendered).
- [P3] Double heading + duplicate Book icons (h1 Biblioteca vs h2 Mi biblioteca; same icon for Materiales/Biblioteca).

## Persona red flags

- Jordan: placeholders look pre-filled on empty account; doesn't know whether to clear/keep/overwrite; post-click reset indistinguishable from no-op.
- Sam: six undifferentiated textboxes (no required/describedby); ghost Borrar without disambiguated accessible name; floating pill is unknown tab stop over content.
- Casey: whole flow below fold on 390px; CTA crossing the overlapping pill; URL pasting one-handed with no preview; Motivo textarea looks mandatory.

## Minor

CardTitle>h2 nesting; silent Formato default undersells non-book formats; warmest line (Motivo hint) vanishes as placeholder; NOVATO·0% + empty + no-group triple-shames newcomer; rows truncate the info needed to choose nominees; motive unbounded.

## Questions to consider

Shelf without shelf? Page completable without ever seeing "postular"? Seconds-to-first-save one-handed? Who is NOVATO·0% for?
