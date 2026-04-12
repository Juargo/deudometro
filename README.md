# Deudometro

App web para seguimiento de deudas personales, visualizacion de pagos y simulacion de estrategias de pago (Avalanche/Snowball). Enfocada en el mercado chileno (moneda CLP por defecto).

## Stack

- **Frontend**: Nuxt 3, Vue 3, Tailwind CSS, Pinia
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Base de datos**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (JWT)
- **IA**: Anthropic Claude (analisis de planes de pago)
- **Monorepo**: pnpm workspaces

## Requisitos

- Node.js >= 20
- pnpm >= 9

## Setup

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

| Variable | Descripcion |
|----------|-------------|
| `DATABASE_URL` | Connection string de PostgreSQL (Supabase pooler) |
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `ANTHROPIC_API_KEY` | API key de Anthropic (para analisis IA) |
| `NUXT_PUBLIC_SUPABASE_URL` | Misma URL de Supabase (para el frontend) |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase (para el frontend) |
| `NUXT_PUBLIC_API_URL` | URL del backend, por defecto `http://localhost:3001/api/v1` |
| `PORT` | Puerto del backend (default: `3001`) |
| `CORS_ORIGIN` | Origen permitido para CORS (default: `http://localhost:3000`) |

### 3. Preparar la base de datos

Genera el cliente Prisma y aplica el schema a la base de datos:

```bash
pnpm db:generate
pnpm --filter @deudometro/backend db:push
```

> `db:push` sincroniza el schema de Prisma directamente con la base de datos sin crear archivos de migracion. Para migraciones formales usa `pnpm db:migrate`.

### 4. Levantar en desarrollo

En dos terminales separadas, o ambos desde la raiz:

```bash
# Terminal 1 — Backend (Express en :3001)
pnpm dev:backend

# Terminal 2 — Frontend (Nuxt en :3000)
pnpm dev:frontend
```

Abre http://localhost:3000 en el navegador.

## Comandos utiles

```bash
pnpm dev:backend           # Inicia backend con hot-reload (tsx watch)
pnpm dev:frontend          # Inicia frontend Nuxt en :3000
pnpm test                  # Ejecuta tests del backend (vitest)
pnpm typecheck             # Typecheck de todos los packages
pnpm lint                  # Lint de todos los packages
pnpm db:generate           # Genera el cliente Prisma
pnpm db:migrate            # Ejecuta migraciones (prisma migrate dev)
pnpm db:studio             # Abre Prisma Studio (GUI para la BD)
pnpm build:backend         # Compila el backend (tsc)
pnpm build:frontend        # Compila el frontend (nuxt build)
```

## Estructura del proyecto

```
packages/
  backend/          Express API + Prisma
    src/
      config/       Configuracion (env, prisma, supabase)
      managers/     Orquestadores de logica de negocio
      repositories/ Acceso a datos (interfaces + implementaciones Prisma)
      routers/      Rutas Express
      shared/       Middleware, tipos, errores
      skills/       Operaciones de dominio (un caso de uso por clase)
    prisma/
      schema.prisma Schema de la base de datos
    tests/          Tests unitarios (vitest)
  frontend/         Nuxt 3 + Vue 3 + Tailwind
    pages/          Paginas de la app
    components/     Componentes Vue
    composables/    Composables reutilizables
    stores/         Stores Pinia
    layouts/        Layouts de Nuxt
  shared/           Tipos TypeScript compartidos entre frontend y backend
```

## Arquitectura backend

La API sigue un patron de capas: **Router -> Manager -> Skill -> Repository**.

- **Router**: define endpoints Express, valida input con Zod, serializa respuestas
- **Manager**: orquesta skills y repositorios para un dominio (auth, debts, plan, profile)
- **Skill**: logica de negocio pura, un caso de uso por clase
- **Repository**: acceso a datos via interfaces (implementaciones Prisma)

Todo el wiring de dependencias se hace en `src/container.ts`.

## Auth

Supabase maneja autenticacion. El frontend usa el cliente Supabase con la anon key. El backend verifica JWTs usando JWKS de Supabase.

Cadena de middleware: `jwtMiddleware` -> `spaceResolver` -> route handler.

Cada request autenticado lleva un `req.context` con: `userId`, `profileId`, `financialSpaceId`, `role`.
