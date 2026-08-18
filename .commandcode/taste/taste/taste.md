# Taste
- Communicates in Spanish; expects responses in Spanish. Confidence: 0.95
- Prefers to handle CLI authentication/secrets themselves (e.g., running `supabase login`) rather than sharing tokens or passwords in chat, even when the assistant offers to accept credentials directly. Confidence: 0.6
- Prefers the assistant to inspect the project, report what's missing/blocking, and explicitly list what inputs are needed (e.g., credentials, confirmations) before completing a task, rather than proceeding on assumptions. Confidence: 0.7
- When a framework/library changes or breaks (e.g., Next.js renaming middleware), expects the assistant to read the official docs first — including the local docs bundled in `node_modules` — before migrating code. Confidence: 0.7
- Uses Biome as the project linter (not ESLint); expects the assistant to run it and fix every reported issue — including tooling config problems such as enabling `tailwindDirectives` in `biome.json` for Tailwind v4 CSS — until lint passes clean, rather than just reporting the problems. Confidence: 0.75
- Prefers installing UI components via the shadcn CLI (e.g., `pnpm dlx shadcn@latest add ...`) rather than hand-writing them, keeping generated components as the source of truth. Confidence: 0.6
- Expects the assistant to follow the project's activated skill guidelines (e.g., shadcn skill requiring verification of imports/composition/icons after adding components) rather than just completing the task ad-hoc. Confidence: 0.6
