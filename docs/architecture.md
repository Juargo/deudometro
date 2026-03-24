# Architecture — Deudometro

**Versión:** 0.1.0
**Fecha:** 2026-03-23
**Estado:** Draft

---

## 1. Principios de arquitectura

1. **Spec antes que código** — ningún manager ni skill se implementa sin su spec en `/specs/`.
2. **Capas con responsabilidad única** — el Router no tiene lógica de negocio, los Managers no tocan la DB directamente, los Skills hacen una sola cosa.
3. **El dominio manda** — `domain-model.md` es la fuente de verdad para el schema de Prisma y los tipos TypeScript. Cualquier cambio al dominio se refleja primero en la spec, luego en el código.
4. **Supabase solo para auth y conexión DB** — no se usan las Row Level Security policies de Supabase como lógica de negocio. Las reglas de acceso viven en el backend Express.
5. **AI como skill, no como capa** — la llamada al LLM es un skill más (`ai-plan-generator`), con input/output tipado y fallback definido. No es un servicio aparte.

---

## 2. Vista de alto nivel

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE                            │
│              Nuxt 3 + Vue 3 + Tailwind                  │
│            (SPA / SSR — deploy en Vercel)               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS REST + JWT
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND — Express.js                   │
│              (deploy en Railway / Render)               │
│                                                         │
│   Router ──► Managers ──► Skills ──► Repositories      │
│                                   └──► AI Client        │
└──────────────────┬──────────────────────────────────────┘
                   │ Prisma Client
                   ▼
┌─────────────────────────────────────────────────────────┐
│               SUPABASE                                  │
│        PostgreSQL (datos)  +  Auth (JWT)                │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Capas del sistema

### 3.1 Frontend — Nuxt 3

**Responsabilidad:** renderizar la UI, manejar sesión del usuario via Supabase Auth client, consumir la API REST del backend.

**No hace:** lógica de negocio, cálculos financieros, validaciones de dominio. Todo eso vive en el backend.

**Patrones usados:**
- `pages/` → rutas de la app (file-based routing de Nuxt)
- `components/` → componentes Vue organizados por dominio
- `composables/` → lógica reutilizable (ej: `useDebt`, `usePlan`, `useAuth`)
- `stores/` → estado global con Pinia (ej: `useDebtStore`, `usePlanStore`)
- `utils/` → formatters de moneda, fechas, helpers de UI

**Auth flow:**
1. Usuario se registra/loguea via Supabase Auth (cliente JS en el browser)
2. Supabase devuelve un JWT
3. Nuxt almacena el JWT en memoria (via Pinia) y lo envía en cada request al backend como `Authorization: Bearer <token>`
4. Al refrescar la página, Supabase Auth client restaura la sesión automáticamente

---

### 3.2 Backend — Express.js + SDD

**Responsabilidad:** validar requests, aplicar reglas de negocio, orquestar operaciones, interactuar con la DB.

**Patrón SDD: Router → Managers → Skills → Repositories**

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────┐
│  ROUTER (src/router/)                   │
│  - Valida JWT con Supabase              │
│  - Parsea el intent del request         │
│  - Delega al Manager correspondiente   │
│  - No tiene lógica de negocio          │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  MANAGER (src/managers/)                │
│  - Orquesta el caso de uso completo    │
│  - Llama skills en orden definido      │
│  - Maneja errores intermedios          │
│  - No accede directamente a la DB      │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌────────────────┐   ┌────────────────────┐
│ SKILLS         │   │ REPOSITORIES       │
│ (src/skills/)  │   │ (src/repositories/)│
│                │   │                    │
│ Unidad mínima  │   │ Único punto de     │
│ de lógica.     │   │ acceso a Prisma.   │
│ Una sola cosa. │   │ Sin lógica de      │
│                │   │ negocio.           │
└────────────────┘   └────────────────────┘
         │
         ▼
┌────────────────┐
│ AI CLIENT      │
│ (src/ai/)      │
│ Claude API     │
└────────────────┘
```

---

### 3.3 Managers y sus responsabilidades

| Manager | Responsabilidad | Skills principales que orquesta |
|---------|----------------|--------------------------------|
| `DebtManager` | CRUD de deudas, validación, detección de críticas | `debt-entry`, `debt-validator`, `critical-debt-detector` |
| `AnalysisManager` | Cálculo del plan completo: ordenamiento + PlanActions + IA | `strategy-sorter`, `plan-calculator`, `prompt-builder`, `ai-plan-generator` |
| `PlanManager` | Consulta y gestión del plan activo / historial | `plan-retriever`, `plan-superseder` |
| `ProgressManager` | Registro de pagos, actualización de saldos, detección de milestones | `payment-recorder`, `balance-updater`, `milestone-detector` |

---

### 3.4 Data layer — Prisma + Supabase PostgreSQL

**Responsabilidad:** persistencia y recuperación de datos.

- **Prisma** es el único punto de acceso a la base de datos. Solo los `Repositories` usan el `PrismaClient`.
- **Supabase PostgreSQL** es la instancia de base de datos. Prisma se conecta via `DATABASE_URL` con connection pooling (via Supabase Pooler en modo `transaction`).
- **Supabase Auth** gestiona usuarios y emite JWTs. El backend valida cada JWT llamando a `supabase.auth.getUser(token)`.

---

### 3.5 AI layer — Claude API

- El skill `ai-plan-generator` llama a la API de Anthropic (Claude).
- El modelo a usar: `claude-sonnet-4-5` (balance entre calidad y costo).
- El prompt se construye en `prompt-builder` con las 5 secciones del Paso 6 (ver `docs/sdd-methodology.md`).
- El output esperado es JSON estricto (`aiOutput` en `DebtPlan`).
- Si la respuesta de la IA no es JSON válido o falla → `ai-plan-generator` devuelve `{ success: false, error: 'AI_GENERATION_FAILED' }`. El `AnalysisManager` guarda el plan sin `aiOutput` y notifica al usuario.

---

## 4. Estructura de carpetas

```
deudometro/                          # Raíz del monorepo (pnpm workspaces)
│
├── docs/                            # Artefactos de arquitectura (Etapas 1–5)
│   ├── problem-statement.md
│   ├── domain-model.md
│   ├── business-rules.md
│   ├── feature-map.md
│   ├── architecture.md              # Este archivo
│   └── sdd-methodology.md
│
├── specs/                           # Specs SDD (Etapas 6–8)
│   ├── skills/                      # SKILL-<nombre>.md por cada skill
│   ├── managers/                    # MANAGER-<nombre>.md por cada manager
│   └── ROUTER.md
│
├── frontend/                        # App Nuxt 3
│   ├── assets/
│   ├── components/
│   │   ├── debt/                    # DebtCard, DebtForm, DebtTypeSelector
│   │   ├── plan/                    # PlanSummary, StrategySelector, PlanTimeline
│   │   ├── dashboard/               # Deudometro (gauge), DebtSummary, CriticalAlert
│   │   └── milestone/               # MilestoneModal, MilestoneFeed
│   ├── composables/
│   │   ├── useDebt.ts
│   │   ├── usePlan.ts
│   │   ├── useAuth.ts
│   │   └── useProgress.ts
│   ├── pages/
│   │   ├── index.vue                # Dashboard
│   │   ├── deudas/
│   │   │   ├── index.vue            # Lista de deudas
│   │   │   ├── nueva.vue            # Formulario nueva deuda
│   │   │   └── [id].vue             # Editar deuda
│   │   ├── plan/
│   │   │   ├── index.vue            # Ver plan activo
│   │   │   └── nueva.vue            # Flujo de generación (Pasos 2–6)
│   │   ├── pagos/
│   │   │   └── index.vue            # Registrar pago
│   │   └── auth/
│   │       ├── login.vue
│   │       └── registro.vue
│   ├── stores/
│   │   ├── auth.ts                  # Pinia: sesión y JWT
│   │   ├── debts.ts                 # Pinia: lista de deudas
│   │   └── plan.ts                  # Pinia: plan activo
│   ├── utils/
│   │   ├── currency.ts              # Formatters CLP
│   │   └── dates.ts                 # Helpers de fechas
│   ├── nuxt.config.ts
│   └── tailwind.config.ts
│
├── backend/                         # API Express.js
│   ├── src/
│   │   ├── router/                  # Rutas HTTP → managers
│   │   │   ├── index.ts             # Express app + middleware
│   │   │   ├── debts.router.ts
│   │   │   ├── plan.router.ts
│   │   │   └── progress.router.ts
│   │   ├── managers/
│   │   │   ├── DebtManager.ts
│   │   │   ├── AnalysisManager.ts
│   │   │   ├── PlanManager.ts
│   │   │   └── ProgressManager.ts
│   │   ├── skills/
│   │   │   ├── debt-entry.skill.ts
│   │   │   ├── debt-validator.skill.ts
│   │   │   ├── critical-debt-detector.skill.ts
│   │   │   ├── strategy-sorter.skill.ts
│   │   │   ├── plan-calculator.skill.ts
│   │   │   ├── prompt-builder.skill.ts
│   │   │   ├── ai-plan-generator.skill.ts
│   │   │   ├── payment-recorder.skill.ts
│   │   │   ├── balance-updater.skill.ts
│   │   │   └── milestone-detector.skill.ts
│   │   ├── repositories/
│   │   │   ├── UserRepository.ts
│   │   │   ├── DebtRepository.ts
│   │   │   ├── PlanRepository.ts
│   │   │   └── PaymentRepository.ts
│   │   ├── ai/
│   │   │   └── claude.client.ts     # Wrapper Anthropic SDK
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts   # Valida JWT con Supabase
│   │   └── types/                   # Tipos TypeScript del dominio
│   │       └── domain.ts
│   ├── prisma/
│   │   └── schema.prisma            # Generado desde domain-model.md
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                     # Variables de entorno requeridas
├── .gitignore
├── CLAUDE.md
└── package.json                     # pnpm workspace root
```

---

## 5. Decisiones técnicas

### ADR-01 · Monorepo con pnpm workspaces
**Decisión:** frontend y backend en el mismo repositorio, gestionados con pnpm workspaces.
**Razón:** facilita compartir tipos TypeScript del dominio, simplifica el CI/CD al tener un solo repo, y reduce fricción en el desarrollo solo o en equipo pequeño.
**Trade-off:** el build y deploy requieren distinguir qué workspace se despliega. Vercel y Railway soportan esto nativamente.

---

### ADR-02 · Express como backend separado (no Nuxt server/Nitro)
**Decisión:** API REST en Express.js, desacoplada del frontend Nuxt.
**Razón:** el patrón SDD (Router → Managers → Skills) se expresa más limpiamente en Express con una estructura de carpetas explícita. Nuxt Nitro mezclaría concerns de frontend y backend en el mismo proceso.
**Trade-off:** requiere gestionar CORS y dos procesos de desarrollo. Se mitiga con un script `dev` en la raíz que levanta ambos en paralelo.

---

### ADR-03 · Supabase Auth + JWT validado en el backend
**Decisión:** el frontend usa el cliente JS de Supabase para auth. El backend valida el JWT en cada request llamando a `supabase.auth.getUser(token)`.
**Razón:** Supabase Auth ofrece email/password, magic links y OAuth sin infraestructura adicional. Validar el JWT en el backend (en lugar de solo decodificarlo) garantiza que la sesión siga activa en Supabase.
**Trade-off:** cada request al backend hace una llamada a Supabase para validar el token. Se puede mitigar cacheando la validación en el middleware con TTL de 60s.

---

### ADR-04 · Prisma como único ORM, apuntando a Supabase PostgreSQL
**Decisión:** todos los accesos a la DB pasan por Prisma. No se usa el cliente de Supabase para queries de datos.
**Razón:** Prisma ofrece tipado fuerte, migraciones versionadas y un modelo de datos que se puede generar directamente desde `domain-model.md`. El cliente de Supabase para datos (PostgREST) no da el mismo nivel de control en queries complejas.
**Trade-off:** se usan dos SDKs de Supabase (Auth client en frontend, Prisma para datos en backend). El connection string de Prisma apunta al pooler de Supabase en modo `transaction` para evitar saturar las conexiones.

---

### ADR-05 · Claude API como proveedor de IA
**Decisión:** el skill `ai-plan-generator` usa la API de Anthropic (modelo `claude-sonnet-4-6`).
**Razón:** el prompt del sistema tiene instrucciones de tono, empatía y formato JSON estricto que requieren un modelo con buena comprensión de instrucciones. Claude tiene excelente rendimiento en salida JSON estructurada en español.
**Trade-off:** costo por token en cada generación de plan. Se mitiga generando el plan una vez y almacenando el `aiOutput` completo en `DebtPlan`. No se regenera a menos que el usuario lo solicite explícitamente.

---

### ADR-06 · Deploy: Vercel (frontend) + Railway (backend)
**Decisión:** Nuxt en Vercel, Express en Railway.
**Razón:** Vercel tiene integración nativa con Nuxt/Next y ofrece preview deployments por PR. Railway es la opción más simple para un servidor Node/Express con variables de entorno y DB connection pool, sin necesidad de configurar Docker.
**Trade-off:** dos plataformas de deploy. El `VITE_API_URL` en el frontend debe apuntar al URL del backend de Railway.

---

## 6. Variables de entorno

### Frontend (`frontend/.env.local`)
```env
NUXT_PUBLIC_SUPABASE_URL=          # URL del proyecto Supabase
NUXT_PUBLIC_SUPABASE_ANON_KEY=     # Anon key pública de Supabase
NUXT_PUBLIC_API_URL=               # URL del backend Express (ej: https://api.deudometro.app)
```

### Backend (`backend/.env`)
```env
DATABASE_URL=                      # Supabase PostgreSQL pooler (transaction mode)
DIRECT_URL=                        # Supabase PostgreSQL direct (para migraciones)
SUPABASE_URL=                      # URL del proyecto Supabase
SUPABASE_SERVICE_ROLE_KEY=         # Service role key (validación de JWTs)
ANTHROPIC_API_KEY=                 # API key de Claude (Anthropic)
PORT=3001
NODE_ENV=development
```

---

## 7. Flujo completo de una request

**Ejemplo: usuario genera un plan de pagos**

```
1. Frontend (Pinia store)
   → POST /api/plan/generate
   → Headers: Authorization: Bearer <supabase-jwt>
   → Body: { strategy: 'avalanche', reservePercentage: 20 }

2. auth.middleware.ts
   → supabase.auth.getUser(token) → { userId }
   → Adjunta userId al request object

3. plan.router.ts
   → Extrae intent: GENERATE_PLAN
   → Valida que el body tenga strategy y reservePercentage
   → Llama: AnalysisManager.generatePlan({ userId, strategy, reservePercentage })

4. AnalysisManager
   → UserRepository.getWithDebtsAndExpenses(userId)
   → [critical-debt-detector skill] → identifica deudas críticas
   → [strategy-sorter skill] → ordena deudas según estrategia
   → [plan-calculator skill] → genera PlanActions mes a mes
   → Si availableBudget < Σ minimumPayments → retorna INSUFFICIENT_BUDGET
   → [prompt-builder skill] → construye el prompt de 5 secciones
   → [ai-plan-generator skill] → llama Claude API → aiOutput JSON
   → PlanRepository.createPlan({ ...planData, aiOutput })
   → PlanRepository.supersedeActivePlan(userId)

5. plan.router.ts
   → Responde: 201 { plan: { id, aiOutput, estimatedPayoffDate, ... } }

6. Frontend
   → Pinia actualiza plan store
   → Vue router navega a /plan
   → Renderiza PlanSummary con aiOutput
```

---

## 8. Endpoints de la API (overview)

| Método | Path | Manager | Descripción |
|--------|------|---------|-------------|
| `POST` | `/api/debts` | DebtManager | Registrar nueva deuda |
| `GET` | `/api/debts` | DebtManager | Listar deudas del usuario |
| `PATCH` | `/api/debts/:id` | DebtManager | Editar deuda |
| `DELETE` | `/api/debts/:id` | DebtManager | Archivar deuda |
| `GET` | `/api/profile` | — | Obtener UserProfile + fixedExpenses |
| `PATCH` | `/api/profile` | — | Actualizar ingreso y gastos fijos |
| `POST` | `/api/plan/generate` | AnalysisManager | Generar nuevo plan |
| `GET` | `/api/plan/active` | PlanManager | Obtener plan activo |
| `GET` | `/api/plan/history` | PlanManager | Historial de planes |
| `POST` | `/api/payments` | ProgressManager | Registrar pago |
| `GET` | `/api/payments` | ProgressManager | Historial de pagos |
| `GET` | `/api/milestones` | ProgressManager | Milestones pendientes y reconocidos |
| `PATCH` | `/api/milestones/:id/acknowledge` | ProgressManager | Reconocer milestone |

---

*Documento mantenido en: `docs/architecture.md`*
