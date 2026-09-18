# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router, Server Components), React 19, Supabase (PostgreSQL, Auth, Realtime, RLS), Tailwind CSS 4, shadcn/ui (base-nova), TypeScript, Bun, Vercel.

## Users

**Primary:** Miembros de un club de lectura hispanohablante que se reúne semanalmente (normalmente por videollamada) para tertuliar de un tema relacionado a un Material (libro, podcast, video, artículo). Valoran el intercambio intelectual, la comodidad y la exclusividad de un grupo cerrado.

**Secondary (later):** Moderadores de otros clubs que quieran crear su propia instancia (multi-club, not yet built).

## Product Purpose

Café y Tertulias acompaña y organiza las sesiones de un club de lectura: antes de la reunión recoge las preguntas, durante la tertulia organiza la dinámica (sorteo, debate, minijuegos) y después conserva la memoria de lo discutido. La conversación está primero; la aplicación acompaña, no dirige.

Success means the club's conversations are richer because of the app, and the memory of what was discussed is preserved and accessible — not that the app replaces the conversation.

## Positioning

A premium, unhurried companion for intellectual conversation — not a meeting tool, not a social network, not a content platform. The app's role is invisible during the conversation and invaluable before and after it. No other product positions itself as the quiet companion to a reading club's ritual.

## Operating Context

- **Cadence:** Reuniones semanales, normalmente por videollamada (Google Meet, Zoom, etc.). La app funciona en ambos modos (presencial/remoto) pero el caso principal es remoto.
- **Ritual:** Cada sesión tiene un Material opcional. Los miembros preparan preguntas antes, la sesión se desarrolla en Etapas fijas (Preguntas → Presentes → Sorteo → Debate → Cierre), y después queda el Histórico.
- **Invite-only:** No hay registro público. Los miembros invitan a otros mediante enlaces compartibles. Es un club cerrado.
- **Language:** Interfaz y contenido en español.

## Capabilities and Constraints

**Confirmed functionality:**
- Sesiones con Etapas fijas y transiciones en tiempo real (Supabase Realtime)
- Sala de Sesión única que ocupa toda la pantalla; nadie navega fuera durante la sesión
- Materials (libros, podcasts, videos, artículos) con pipeline de estados y rating agregado
- Preguntas preparadas antes de la sesión, visibles solo para su autor hasta la Intervención
- Sorteo aleatorio 1:1 (cada uno responde una pregunta ajena)
- Debate con Escenario: pregunta revelada, intervención actual, temporizador regresivo (5:00 + overtime)
- Espectadores (opt-out del sorteo)
- Minijuegos: Trivia (preguntas de opción múltiple sobre el Material) y Takes (frases disparadoras con votación rápida)
- Gamificación: Puntos, Insignias (individuales), Hitos (colectivos), Reconocimientos por Temporada (mensual)
- Rating agregado de Materials (1-5 estrellas, anónimo, congelado al cerrar sesión)
- Histórico de cada sesión: preguntas, notas, minijuegos, logros, rating
- Convocatoria: invitar a un miembro a una Sala abierta en tiempo real
- Invitación: enlace compartible para sumar nuevos miembros (padrino → invitado → activo)

**Technical constraints:**
- Supabase RLS para aislamiento de datos
- Realtime para sincronización de la Sala
- Single club por ahora; la arquitectura debe permitir multi-club más adelante
- Deploy en Vercel

**Undecided:**
- Multi-club: fecha o prioridad no definida. La arquitectura actual no lo impide pero no hay tablas de organización/club.

## Brand Commitments

- **Name:** Café y Tertulias (or "Café y Tertulia" — both used interchangeably in codebase)
- **Aesthetic:** "Private Club" — warmth of a high-end coffee lounge or traditional literary circle. Hushed, premium, inviting. Modern Corporate with Tactile Warmth.
- **Typography:** Literata (serif, headlines) + Manrope (sans-serif, UI/body). Dual-font strategy.
- **Palette:** Deep espresso background, warm amber accents. Dark mode only in current implementation.
- **Voice:** In Spanish. Premium but not pretentious. The app speaks when needed, not to fill space.
- **Gamification principle:** "Miel, no neón" — rewards use the same Lounge palette, never extra colors. Reward = warmth, not arcade.
- **DESIGN.md exists** with full design system: colors, typography, spacing, elevation, shapes, component specs, gamification tokens.

## Evidence on Hand

- `CONTEXT.md` — 30+ domain terms with precise definitions (the product's vocabulary)
- `DESIGN.md` — complete design system (colors, typography, spacing, elevation, components, gamification)
- `supabase/migrations/` — 20+ migrations defining the full data model
- `app/` — working routes: home, auth (login/register/invite/reset), materials, sessions (lobby/room/stage/minigames/rating), members, profile
- `e2e/` — Playwright tests for session lifecycle
- `docs/adr/` — architecture decision records
- No testimonials, press, or external case studies yet.

## Product Principles

1. **La conversación está primero.** The app accompanies, it never directs. During a session, the interface should be invisible — the conversation is the product.
2. **Memoria, no archivo.** The historical record is alive and valuable, not a dusty filing cabinet. What was discussed matters after the session ends.
3. **Ritual, no herramienta.** The weekly meeting is a ritual. The app should feel like part of the ritual — warm, familiar, unhurried — not like a productivity tool.
4. **Exclusividad sin barreras.** Invite-only creates intimacy, not exclusion. The invite flow should be frictionless for the member extending it.
5. **Simplicidad deliberada.** Every feature earns its place. If it doesn't serve the conversation or the memory, it doesn't ship.

## Accessibility & Inclusion

WCAG 2.1 AA compliance required. Spanish-language interface. The app must work on both desktop and mobile browsers (responsive web).