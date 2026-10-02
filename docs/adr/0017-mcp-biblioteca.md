# Servidor MCP: Biblioteca personal (v1)

La Biblioteca llega a agentes externos por MCP sin duplicar reglas: los tools delegan en las mismas tablas y RPCs que usa la UI (#88).

## Status: accepted

Alcance v1: cuatro tools en `POST /api/mcp` (Streamable HTTP sin estado) sobre la Biblioteca y sus postulaciones — `biblioteca_list`, `biblioteca_create`, `biblioteca_nominate`, `postulacion_withdraw`. Sin `service_role` en toda la superficie: cada llamada crea su cliente con el JWT del llamante (`createMcpUserClient`), así PostgREST/RPCs corren como el usuario y RLS + `auth.uid()` siguen valiendo. Sin `revalidatePath`: el MCP no tiene caché UI que invalidar.

## Considered Options

- **JWT passthrough (elegido)**: el Bearer del llamante viaja como `Authorization` global del cliente Supabase. Sin sesiones ni tablas nuevas; la identidad la valida `verifyToken` con `supabase.auth.getUser`.
- **OAuth DCR propio**: un authorization server completo para un v1 con un solo dueño por token. Se descarta por coste; el metadata path queda anunciado para cuando haga falta.
- **service_role con checks manuales**: bypasea RLS y obliga a reimplementar propiedad y membresía en cada tool. Se descarta: el RPC ya lo valida de forma atómica.

## Decisiones

- **Auth**: `withMcpAuth(handler, verifyToken, { required: true, resourceMetadataPath: '/.well-known/oauth-protected-resource' })`. El documento de metadata aún no se sirve (requeriría ruta `app/.well-known/`, fuera del alcance v1): los clientes Bearer directo funcionan sin él.
- **Proxy**: `updateSession` devuelve sin redirigir al login para todo `pathname.startsWith('/api/')`. El comportamiento de navegador queda intacto; cada ruta API dueña su 401.
- **Esquemas**: `biblioteca_create` reutiliza `bibliotecaInputSchema` tal cual; los ids de nominar/retirar son `z.string().uuid()` con mensajes en español. Descripciones de tools en español (lengua del producto).
- **Tests**: tools como funciones puras `(cliente, args)` con cliente mock inyectado; `verifyToken` exportado para tests con `getUser` mockeado.
