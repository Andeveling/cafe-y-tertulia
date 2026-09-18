<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Skills

shadcn con base UI - .agents/skills/shadcn/SKILL.md
para estructurar el proyecto - .agents/skills/nextjs-16/SKILL.md

## Design

- Don't make me think; no excessive text.
- **Tokens** in `app/globals.css` (CSS variables / `@theme`) — café, radio suave, no colores ad-hoc en `ui/*`.
- **UI layers** (page → view → ui, shadcn re-add policy): `docs/agents/ui-layers.md`.
- `components/ui` = primitives only (see `components/ui/AGENTS.md`).
- **Module design** — use `.agents/skills/codebase-design/SKILL.md` vocabulary (module, interface, depth, seam, adapter) when shaping or splitting modules. Load it at `/to-tickets` to get seams right before implementation, and verify against it during `/implement`.
`./DESIGN.md`

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Andeveling/cafe-y-tertulia`), accessed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles mapped to `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

