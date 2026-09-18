# UI layers (design system)

## Decisions (defaults)

| Topic | Choice |
| ------- | -------- |
| What "design system" means | Tokens + composition rules; not a private registry (yet) |
| Look lives in | `app/globals.css` tokens first (warm café, `--radius` ~0.875rem, not ad-hoc `ui/*` colors) |
| Re-add shadcn component | Prefer **never overwrite** edited `components/ui/*`; only `add` new names. Diff if you must upgrade one file. |

## Layers

```
app/**/page.tsx          → data, auth, redirects (no heavy markup)
  └── *-view.tsx         → pure UI props (layout: fullscreen)
components/**            → feature UI (forms, panels) — no direct Supabase if avoidable
components/ui/*          → shadcn primitives only — tokens, no domain
app/globals.css          → theme tokens + @theme (source of look)
```

### Rules

1. **`components/ui`**: only shadcn/base-ui primitives. No domain copy, no fetch, no server actions.
2. **Theme**: change look via CSS variables / `@theme` in `globals.css`. Do not restyle the whole app by editing every `ui/*.tsx`.
3. **Edit `ui/*` only when** a primitive cannot express the need with tokens/variants (structure, a11y API). Note the edit; re-`add` will fight you.
4. **E2E**: login, invite, material flows with real env — Playwright.
5. **New shadcn pieces**: `pnpm dlx shadcn@latest add <name>`.

## shadcn + reinstall

- `components.json` + tokens in CSS survive CLI adds.
- Overwriting `button.tsx` does **not** if you don't re-add `button`.
- Deep custom look later: [shadcn/create](https://ui.shadcn.com/create) preset, or private registry — only when tokens aren't enough.

## Commands

```bash
pnpm test:e2e           # real routes
pnpm dlx shadcn@latest add <component>
```
