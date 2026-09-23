<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Skills

- shadcn primitive, variant, or `add` new piece → `.agents/skills/shadcn/SKILL.md`.
- App Router, Server/Client boundary, actions, handlers, caching → `.agents/skills/nextjs-16/SKILL.md`.
- Shaping or splitting a module, placing a seam, deepening an interface → `.agents/skills/codebase-design/SKILL.md`. Load at `/to-tickets` before fixing seams, verify at `/implement`.
- Designing, refining, auditing, or polishing UI → `.claude/skills/impeccable/SKILL.md`. Run `.claude/skills/impeccable/scripts/impeccable context` before editing UI, read its `reference/craft-floor.md` right before the edit.

## Code

- Human first: explicit over clever, early returns, full names, no abbreviations.
- Self-documenting names: verb + context (`createTertulia`, `isSeatTaken`).
- Comments explain why: decision, tradeoff, or gotcha the code cannot show; never restate what the code does.
- One file = one module: one public export, helpers stay private; split when the file answers two jobs.
- Small interface, deep implementation: few exports, simple params, complexity hidden inside.
- Testable by construction: accept dependencies, return results.

## Design

- Don't make me think; no excessive text.
- Product truth (users, scope, what to build) lives in `PRODUCT.md`; visual spec in `DESIGN.md`.
- Look lives in `app/globals.css` tokens (`@theme`, café, radio suave).
- Layers page → view → ui, `components/ui` primitives only: `docs/agents/ui-layers.md` + `components/ui/AGENTS.md`.

## Agent skills

### Issue tracker

Issues live in github with gh. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles mapped to `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
