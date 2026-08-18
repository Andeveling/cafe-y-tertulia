# Taste

## Communication

- Communicates in Spanish; expects responses in Spanish. Confidence: 0.95
- Prefers to handle CLI authentication/secrets themselves (e.g., running `supabase login`) rather than sharing tokens or passwords in chat, even when the assistant offers to accept credentials directly. Confidence: 0.6
- Prefers the assistant to inspect the project, report what's missing/blocking, and explicitly list what inputs are needed (e.g., credentials, confirmations) before completing a task, rather than proceeding on assumptions. Confidence: 0.7

## Workflow

- When a framework/library changes or breaks (e.g., Next.js renaming middleware), expects the assistant to read the official docs first — including the local docs bundled in `node_modules` — before migrating code. Confidence: 0.7
