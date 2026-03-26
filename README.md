# Deudometro

Aplicación web para que personas con deudas personales registren, visualicen y planifiquen el pago de todas sus deudas, con cinco estrategias de pago y generación de plan personalizado via IA.

---

## Que hace

- **Registro de deudas** por tipo: tarjeta de crédito, crédito de consumo, crédito hipotecario y deuda informal.
- **Perfil financiero**: ingreso mensual, gastos fijos por categoría y porcentaje de reserva para calcular el presupuesto disponible.
- **Dashboard consolidado**: total adeudado, intereses mensuales, indicador visual "deudómetro" y fecha estimada de libertad financiera.
- **Cinco estrategias de pago**:
  - Avalanche — mayor tasa mensual primero (minimiza intereses totales).
  - Snowball — menor saldo primero (maximiza motivación).
  - Hybrid — deudas críticas por tasa, resto por avalanche.
  - Crisis First — todas las deudas críticas antes que el resto.
  - Guided Consolidation — orden sugerido por score compuesto, ajustable por el usuario.
- **Plan personalizado via IA**: el plan de pagos mes a mes se complementa con un diagnóstico, justificación de la estrategia, foco mensual, milestones proyectados y alertas de deudas críticas generados por Claude.
- **Seguimiento de pagos**: registro de pagos reales, actualización automática de saldos y marcado de deuda como saldada.
- **Milestones y logros**: detección automática de hitos (primer pago, deuda saldada, reducción del 25/50/75% del total).

---

## Stack tecnologico

| Capa | Tecnologia | Deploy |
|------|-----------|--------|
| Frontend | Nuxt 3 + Vue 3 + Tailwind CSS | Vercel |
| Backend / API | Express.js (REST) + patron SDD | Render |
| ORM | Prisma | — |
| Base de datos | PostgreSQL via Supabase | Supabase |
| Auth | Supabase Auth (JWT) | Supabase |
| IA | Claude API — `claude-sonnet-4-6` | — |
| Package manager | pnpm workspaces | — |

---

## Arquitectura

El sistema sigue una arquitectura de tres niveles: frontend Nuxt en Vercel, backend Express en Render y datos en Supabase PostgreSQL.

```
Frontend (Nuxt 3 — Vercel)
        |  HTTPS REST + JWT
        v
Backend (Express.js — Render)
  Router -> Managers -> Skills -> Repositories
                              -> AI Client (Claude)
        |  Prisma Client
        v
Supabase (PostgreSQL + Auth)
```

### Patron SDD (Router → Managers → Skills → Repositories)

El backend aplica un patron de capas con responsabilidad unica:

| Capa | Ubicacion | Responsabilidad |
|------|-----------|----------------|
| **Router** | `backend/src/router/` | Valida JWT, parsea el intent del request, delega al manager. Sin logica de negocio. |
| **Managers** | `backend/src/managers/` | Orquestan un caso de uso completo llamando skills en orden. |
| **Skills** | `backend/src/skills/` | Unidad minima de logica con una sola responsabilidad. Cada skill tiene su spec en `specs/skills/`. |
| **Repositories** | `backend/src/repositories/` | Unico punto de acceso a Prisma. Sin logica de negocio. |

### Managers

| Manager | Responsabilidad |
|---------|----------------|
| `DebtManager` | CRUD de deudas, validacion, deteccion de criticas |
| `AnalysisManager` | Calculo del plan: ordenamiento + PlanActions + prompt IA |
| `PlanManager` | Consulta y gestion del plan activo / historial |
| `ProgressManager` | Pagos, actualizacion de saldos, milestones |

---

## Estructura del proyecto

```
deudometro/                          # Raiz del monorepo (pnpm workspaces)
|
+-- docs/                            # Artefactos de arquitectura
|   +-- problem-statement.md
|   +-- domain-model.md
|   +-- business-rules.md
|   +-- feature-map.md
|   +-- architecture.md
|   +-- sdd-methodology.md
|
+-- specs/                           # Specs SDD por skill y manager
|   +-- skills/                      # SKILL-<nombre>.md
|   +-- managers/                    # MANAGER-<nombre>.md
|   +-- ROUTER.md
|
+-- frontend/                        # App Nuxt 3
|   +-- components/
|   |   +-- debt/                    # DebtCard, DebtForm, DebtTypeSelector
|   |   +-- plan/                    # PlanSummary, StrategySelector, PlanTimeline
|   |   +-- dashboard/               # Deudometro (gauge), DebtSummary, CriticalAlert
|   |   +-- milestone/               # MilestoneModal, MilestoneFeed
|   +-- composables/                 # useDebt, usePlan, useAuth, useProgress
|   +-- pages/                       # Rutas: /, /deudas, /plan, /pagos, /auth
|   +-- stores/                      # Pinia: auth, debts, plan
|   +-- utils/                       # Formatters de moneda y fechas
|   +-- nuxt.config.ts
|   +-- tailwind.config.ts
|
+-- backend/                         # API Express.js
|   +-- src/
|   |   +-- router/                  # debts.router.ts, plan.router.ts, progress.router.ts
|   |   +-- managers/                # DebtManager, AnalysisManager, PlanManager, ProgressManager
|   |   +-- skills/                  # 10 skills del dominio
|   |   +-- repositories/            # UserRepository, DebtRepository, PlanRepository, PaymentRepository
|   |   +-- ai/                      # claude.client.ts
|   |   +-- middleware/              # auth.middleware.ts
|   |   +-- types/                   # domain.ts
|   +-- prisma/
|   |   +-- schema.prisma
|   +-- package.json
|   +-- tsconfig.json
|
+-- .env.example
+-- package.json                     # pnpm workspace root
```

---

## Primeros pasos

### Prerequisitos

- Node.js >= 20
- pnpm >= 9
- Una cuenta en Supabase (base de datos y auth)
- Una API key de Anthropic (Claude)

### Instalacion

```bash
git clone <repo-url>
cd deudometro
pnpm install
```

### Variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env
```

**Frontend** (`frontend/.env.local`):

```env
NUXT_PUBLIC_SUPABASE_URL=          # URL del proyecto Supabase
NUXT_PUBLIC_SUPABASE_ANON_KEY=     # Anon key publica de Supabase
NUXT_PUBLIC_API_URL=               # URL del backend Express (ej: http://localhost:3001)
```

**Backend** (`backend/.env`):

```env
DATABASE_URL=                      # Supabase PostgreSQL pooler (transaction mode)
DIRECT_URL=                        # Supabase PostgreSQL direct (para migraciones)
SUPABASE_URL=                      # URL del proyecto Supabase
SUPABASE_SERVICE_ROLE_KEY=         # Service role key (validacion de JWTs)
ANTHROPIC_API_KEY=                 # API key de Claude (Anthropic)
PORT=3001
NODE_ENV=development
```

### Ejecutar en desarrollo

```bash
# Levantar frontend y backend por separado
pnpm dev:frontend    # http://localhost:3000
pnpm dev:backend     # http://localhost:3001
```

---

## Comandos disponibles

Todos los comandos se ejecutan desde la raiz del monorepo.

```bash
# Desarrollo
pnpm dev:frontend          # Servidor de desarrollo Nuxt (puerto 3000)
pnpm dev:backend           # Servidor de desarrollo Express (puerto 3001)

# Build
pnpm build:frontend        # Build de produccion del frontend
pnpm build:backend         # Compilacion TypeScript del backend

# Base de datos
pnpm db:migrate            # Crear y aplicar nueva migracion de Prisma
pnpm db:generate           # Regenerar cliente Prisma
pnpm db:studio             # Abrir Prisma Studio (GUI de la DB)

# Tests (desde el workspace de backend)
pnpm --filter backend test        # Ejecutar tests con vitest
pnpm --filter backend test:watch  # Tests en modo watch
```

---

## Deploy

| Componente | Plataforma | Notas |
|------------|-----------|-------|
| Frontend | Vercel | Deploy automatico desde `main`. Build command: `pnpm build:frontend`. |
| Backend | Render | Servicio web Node.js. Build command: `pnpm build:backend`. Start: `node dist/index.js`. |
| Base de datos | Supabase | PostgreSQL administrado. Migraciones via Prisma. |

El frontend apunta al backend via la variable `NUXT_PUBLIC_API_URL`. El backend se conecta a Supabase via `DATABASE_URL` (pooler en modo transaction) y `DIRECT_URL` (para migraciones).

---

## Documentacion de referencia

| Que buscar | Donde |
|-----------|-------|
| Entidades, tipos y relaciones del dominio | `docs/domain-model.md` |
| Reglas de negocio numeradas (BR-01 a BR-28) | `docs/business-rules.md` |
| Funcionalidades por prioridad (P0/P1/P2) | `docs/feature-map.md` |
| Capas, ADRs, endpoints y folder structure | `docs/architecture.md` |
| Metodologia SDD y templates de specs | `docs/sdd-methodology.md` |
| Specs de skills implementados | `specs/skills/` |
| Specs de managers | `specs/managers/` |

---

## Git workflow

Se sigue GitHub Flow. La rama `main` siempre es estable y deployable.

- Branches: `feature/<desc>`, `fix/<desc>`, `docs/<desc>`, `specs/<desc>`
- Pull request hacia `main`, no push directo.
