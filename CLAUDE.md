# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Memory (Engram)

Tienes acceso a memoria persistente via MCP tools de Engram (`mem_save`, `mem_search`, `mem_context`, `mem_session_summary`, etc.).

- Guarda proactivamente después de trabajo significativo — no esperes a que te lo pidan.
- Después de cualquier compactación o reset de contexto, llama `mem_context` para recuperar el estado de la sesión antes de continuar.
- Eventos que merecen `mem_save`: decisiones de arquitectura, bugs resueltos, configuraciones cambiadas, patrones descubiertos, acuerdos con el usuario.

## Project Overview

**Deudometro** — app web para que personas con deudas personales registren, visualicen y planifiquen el pago de todas sus deudas. Incluye 5 estrategias de pago (Avalanche, Snowball, Hybrid, Crisis First, Guided Consolidation) y generación de plan personalizado via IA (Claude).

Arquitectura completa en `docs/`. Antes de tocar código, leer `docs/architecture.md`.

## Stack

| Capa | Tecnología | Deploy |
|------|-----------|--------|
| Frontend | Nuxt 3 + Vue 3 + Tailwind CSS | Vercel |
| Backend / API | Express.js (REST) + patrón SDD | Railway |
| ORM | Prisma | — |
| Base de datos | PostgreSQL via Supabase | Supabase |
| Auth | Supabase Auth (JWT) | Supabase |
| IA | Claude API (Anthropic) — modelo `claude-sonnet-4-6` | — |
| Package manager | pnpm workspaces | — |

## Patrón de backend: SDD

`Router → Managers → Skills → Repositories`

- **Router** (`backend/src/router/`): valida JWT, parsea intent, delega al manager. Sin lógica de negocio.
- **Managers** (`backend/src/managers/`): orquestan un caso de uso completo llamando skills en orden.
- **Skills** (`backend/src/skills/`): unidad mínima de lógica. Una sola responsabilidad. Siempre tienen su spec en `specs/skills/`.
- **Repositories** (`backend/src/repositories/`): único punto de acceso a Prisma. Sin lógica de negocio.

**Regla:** ningún skill se implementa sin su `specs/skills/SKILL-<nombre>.md`. Si el código se desvía de la spec, se corrige el código.

## Managers

| Manager | Responsabilidad |
|---------|----------------|
| `DebtManager` | CRUD de deudas, validación, detección de críticas |
| `AnalysisManager` | Cálculo del plan: ordenamiento + PlanActions + prompt IA |
| `PlanManager` | Consulta y gestión del plan activo / historial |
| `ProgressManager` | Pagos, actualización de saldos, milestones |

## Estructura del proyecto

```
deudometro/
├── docs/          # Artefactos de arquitectura (Etapas 1–5)
├── specs/         # Specs SDD: skills/, managers/, ROUTER.md
├── frontend/      # Nuxt 3 app
│   ├── components/debt|plan|dashboard|milestone/
│   ├── composables/
│   ├── pages/
│   └── stores/    # Pinia
└── backend/       # Express API
    ├── src/router|managers|skills|repositories|ai|middleware/
    └── prisma/schema.prisma
```

## Commands

```bash
# Desde la raíz del monorepo
pnpm dev:frontend       # http://localhost:3000
pnpm dev:backend        # http://localhost:3001
pnpm db:migrate         # nueva migración de Prisma
pnpm db:generate        # regenerar cliente Prisma
pnpm db:studio          # Prisma Studio

# Backend directo
pnpm --filter backend dev
pnpm --filter backend build       # tsc compile
pnpm --filter backend test        # vitest run
pnpm --filter backend test:watch

# Frontend directo
pnpm --filter frontend dev
pnpm --filter frontend build
```

## Variables de entorno

Ver `.env.example` en la raíz. Las variables críticas son:
- `DATABASE_URL` — Supabase PostgreSQL pooler (backend)
- `SUPABASE_SERVICE_ROLE_KEY` — para validar JWTs en el middleware (backend)
- `ANTHROPIC_API_KEY` — Claude API (backend)
- `NUXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client (frontend)
- `NUXT_PUBLIC_API_URL` — URL del backend Express (frontend)

## Git Workflow — GitHub Flow

- `main` siempre estable y deployable
- Branches: `feature/<desc>`, `fix/<desc>`, `docs/<desc>`, `specs/<desc>`
- PR hacia `main`, no push directo

## Documentación de referencia

| Qué buscar | Dónde |
|-----------|-------|
| Entidades, tipos, relaciones | `docs/domain-model.md` |
| Reglas de negocio numeradas | `docs/business-rules.md` |
| Funcionalidades P0/P1/P2 | `docs/feature-map.md` |
| Capas, ADRs, endpoints, folder structure | `docs/architecture.md` |
| Templates de specs (skills/managers/router) | `docs/sdd-methodology.md` |
