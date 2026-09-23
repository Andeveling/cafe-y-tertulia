# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router, Server Components), React 19, Supabase (PostgreSQL, Auth, Realtime, RLS), Tailwind CSS 4, shadcn/ui (base-nova), TypeScript, Bun, Vercel.

## Users

**Primary:** Un Miembro hispanohablante que pertenece a uno o varios Grupos de lectura (pareja, trabajo, familia) y se reúne, normalmente por videollamada, a tertuliar de un Material. Es la misma persona en todos; lo que se habla en uno no se ve en otro.

## Product Purpose

Café y Tertulias acompaña y organiza las sesiones de un club de lectura: antes de la reunión recoge las preguntas, durante la tertulia organiza la dinámica (sorteo, debate, minijuegos) y después conserva la memoria de lo discutido. La conversación está primero; la aplicación acompaña, no dirige.

Success means the club's conversations are richer because of the app, and the memory of what was discussed is preserved and accessible — not that the app replaces the conversation.

## Positioning

A premium, unhurried companion for intellectual conversation — not a meeting tool, not a social network, not a content platform. The app's role is invisible during the conversation and invaluable before and after it. No other product positions itself as the quiet companion to a reading club's ritual.

## Operating Context

- **Cadence:** Reuniones semanales, normalmente por videollamada (Google Meet, Zoom, etc.). La app funciona en ambos modos (presencial/remoto) pero el caso principal es remoto.
- **Ritual:** Cada sesión tiene un Material opcional. Los miembros preparan preguntas antes, la sesión se desarrolla en Etapas fijas (Preguntas → Presentes → Sorteo → Debate → Cierre), y después queda el Histórico.
- **Registro abierto, Grupo cerrado:** Cualquiera puede crear cuenta y crear Grupos. Un Grupo privado solo se abre con Invitación de un Administrador. Sin Grupos, igual entra al perfil.
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
- Invitación: enlace de un Administrador a un Grupo privado; si no hay cuenta, el enlace registra y mete en ese Grupo

**Technical constraints:**
- Supabase RLS para aislamiento de datos
- Realtime para sincronización de la Sala
- Cada Grupo es un universo cerrado (`group_id` + RLS). La cara del Miembro es global.
- Deploy en Vercel

**Undecided:**
- Registro abierto aún no está construido. El padrinazgo de plataforma sigue en el código y en ADR-0005; el modelo vigente ya no es ese.

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
4. **El Grupo es el cierre.** La cuenta es abierta; la intimidad vive en el Grupo. Invitar a un Grupo privado es de un gesto, no un trámite.
5. **Simplicidad deliberada.** Every feature earns its place. If it doesn't serve the conversation or the memory, it doesn't ship.

## Accessibility & Inclusion

WCAG 2.1 AA compliance required. Spanish-language interface. The app must work on both desktop and mobile browsers (responsive web).