# MCP Biblioteca — exponer biblioteca + postulación a un agente externo

## Goal
Un agente externo opera la Biblioteca personal y la postulación hacia grupos
vía MCP, hosteado en este mismo Next.js en Vercel (`app/api/mcp/route.ts`).

## Decisions (user-approved)
- **Identidad**: JWT del usuario (passthrough). El agente presenta el access
  token del miembro; RLS y RPCs (`auth.uid()`) siguen aplicando. Nada de
  `service_role` para tools.
- **Alcance v1**: 4 tools — crear, listar, postular, retirar.
  Fuera: update/delete de items, sorteo, pacto, rating, sala.
- **Transporte**: Streamable HTTP stateless (`mcp-handler@^2` +
  `@modelcontextprotocol/server@^2`, spec 2026-07-28). Sin Redis, sin SSE.

## Gotchas (from research)
1. `lib/supabase/proxy.ts` redirige a `/auth/login` sin cookie — un POST MCP
   con solo Bearer moriría en 307. Excluir `/api/*` del redirect.
2. Cada tool crea su propio cliente Supabase con el JWT (Fluid: nada global).
3. Reusar `bibliotecaInputSchema` + `normalizeBibliotecaInput` como seam de
   validación; RPCs `nominate_from_library` / `withdraw_nomination` para mutar.

## Tasks
- [x] Research (fuentes primarias + mapa repo) — mem:806
- [ ] Deps: `bun add mcp-handler@^2 @modelcontextprotocol/server@^2`
- [x] `app/api/mcp/route.ts` + helper cliente-con-JWT + `withMcpAuth`
- [x] Exclusión `/api/*` del login-redirect (`lib/supabase/proxy.ts`)
- [x] Tests: verifyToken + 4 tools, 12 en verde (`tests/mcp/`)
- [x] `docs/adr/0017-mcp-biblioteca.md`
- [ ] Verificación contra Inspector real + commit (solo si el usuario lo pide)

## Evidence
- Research: mem:806, topic `mcp-biblioteca-research`
- Implementación: worker (vitest 12/12, biome clean, tsc --noEmit clean)
- Spot check del orquestador: `app/api/mcp/route.ts` reusa schema y
  cliente por llamada, comentarios en español, handlers delgados
- Follow-up anotado en ADR-0017: servir `/.well-known/oauth-protected-resource`
  (DCR/CIMD); con Bearer directo funciona sin eso
