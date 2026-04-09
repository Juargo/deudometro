# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Deudometro — web app for personal debt tracking, payment visualization, and payoff strategy simulation (Avalanche/Snowball). Chilean market focus (default currency CLP).

## Commands

```bash
# Install dependencies (pnpm workspaces)
pnpm install

# Development
pnpm dev:frontend          # Nuxt 3 on :3000
pnpm dev:backend           # Express on :3001 (tsx watch)

# Build
pnpm build:frontend
pnpm build:backend

# Database (Prisma + Supabase PostgreSQL)
pnpm db:generate           # Generate Prisma client
pnpm db:migrate            # Run migrations (prisma migrate dev)
pnpm db:studio             # Open Prisma Studio
pnpm --filter @deudometro/backend db:push  # Push schema without migration

# Quality
pnpm typecheck             # Typecheck all packages
pnpm lint                  # Lint all packages
pnpm test                  # Run backend tests (vitest)
pnpm --filter @deudometro/backend test:watch  # Watch mode
```

## Architecture

Monorepo with three pnpm workspaces: `packages/frontend`, `packages/backend`, `packages/shared`.

### Backend (`@deudometro/backend`)

Express.js REST API using a **Skill pattern** — business logic lives in skill classes (e.g. `UserRegistrationSkill`, `InvitationAcceptorSkill`) that receive repository interfaces via constructor injection. All wiring happens in `src/container.ts`.

- `src/skills/` — domain operations (one class per use case)
- `src/repositories/interfaces/` — repository contracts
- `src/repositories/prisma/` — Prisma implementations
- `src/shared/middleware/` — Express middleware (auth, space-resolver)
- `src/config/` — env, prisma client, supabase client
- `prisma/schema.prisma` — single source of truth for the data model

Auth: Supabase JWT verification via `jose` JWKS. Requests carry a `req.context` with `userId`, `profileId`, `financialSpaceId`, `role`. Middleware chain: `jwtMiddleware` → `spaceResolver` → route handler.

Errors: throw `DomainError` with typed error codes from skills — never raw errors. The `errorHandler` middleware maps them to HTTP responses.

Transactions: multi-step operations use `prisma.$transaction()`. Repositories accept optional `TransactionContext`.

### Frontend (`@deudometro/frontend`)

Nuxt 3 + Vue 3 + Tailwind CSS + Pinia. Supabase client-side auth via anon key. API calls go to the backend at `NUXT_PUBLIC_API_URL`.

### Shared (`@deudometro/shared`)

TypeScript types shared between frontend and backend. Consumed directly via source (`"main": "src/index.ts"`) — no build step needed.

### Data Model

Multi-tenant via `FinancialSpace`. A user owns a profile within a space; members can be invited. Core entities: `FinancialSpace`, `UserProfile`, `FinancialSpaceMember`, `Invitation`. Debt/plan models are defined in the schema enums but not yet implemented as tables.

## Conventions

- **pnpm only** — do not use npm or yarn.
- **API versioning**: all endpoints under `/api/v1/` prefix (Decisión D3). Frontend `NUXT_PUBLIC_API_URL` must point to `http://localhost:3001/api/v1`.
- **SDD layering**: Router → Manager → Skill → Repository. Each Manager owns specific entities; no cross-writes between managers.
- Monetary fields use `Decimal(15,2)`. Default currency is CLP.
- New domain operations: create a skill class in `src/skills/`, inject repositories via constructor, wire in `src/container.ts`.
- All DB access goes through repository interfaces, not Prisma directly (except `$transaction`).
- Idempotency key (UUID) required on `POST /api/v1/payments` to prevent duplicate payment records.

## Environment

Copy `.env.example` to `.env` in the repo root. Backend reads `DATABASE_URL`, `SUPABASE_*`, `CORS_ORIGIN`, `PORT`. Frontend reads `NUXT_PUBLIC_*` vars.

## Git Workflow

GitHub Flow — `main` is always stable. Feature branches + PRs, no direct push to main.
