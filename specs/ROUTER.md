# ROUTER: DeudometroRouter

**Versión:** 0.1.0 | **Etapa:** 8 — Spec del Router

## Propósito
Punto de entrada único del backend. Recibe todas las peticiones HTTP, valida la autenticación, verifica condiciones previas y delega al manager correspondiente. El Router no tiene lógica de negocio propia.

---

## 1. Middleware global

### Auth middleware (`auth.middleware.ts`)
Se aplica a **todas las rutas** excepto `GET /health`.

```
1. Extraer token: Authorization: Bearer <token>
2. Si no hay header Authorization → 401 AUTH_REQUIRED
3. supabase.auth.getUser(token) → { user, error }
4. Si error o user === null → 401 INVALID_TOKEN
5. Si token válido → adjuntar userId al request: req.userId = user.id
6. Continuar al handler de la ruta
```

**Cache de validación:** para reducir latencia, el resultado de `getUser` se cachea en memoria con `key = token` durante 60 segundos. Tokens inválidos no se cachean.

---

## 2. Tabla de rutas (Intents)

| Método | Path | Intent | Manager → Operación | Auth |
|--------|------|--------|---------------------|------|
| `GET` | `/health` | HEALTH_CHECK | — (respuesta directa) | ✗ |
| `POST` | `/api/profile` | CREATE_PROFILE | UserRepository.create | ✓ |
| `GET` | `/api/profile` | GET_PROFILE | UserRepository.getWithExpenses | ✓ |
| `PATCH` | `/api/profile` | UPDATE_PROFILE | UserRepository.update | ✓ |
| `POST` | `/api/debts` | REGISTER_DEBT | DebtManager.createDebt | ✓ |
| `GET` | `/api/debts` | LIST_DEBTS | DebtManager.listDebts | ✓ |
| `PATCH` | `/api/debts/:id` | UPDATE_DEBT | DebtManager.updateDebt | ✓ |
| `DELETE` | `/api/debts/:id` | ARCHIVE_DEBT | DebtManager.archiveDebt | ✓ |
| `POST` | `/api/plan/generate` | GENERATE_PLAN | AnalysisManager.generatePlan | ✓ |
| `GET` | `/api/plan/active` | GET_ACTIVE_PLAN | PlanManager.getActivePlan | ✓ |
| `GET` | `/api/plan/history` | GET_PLAN_HISTORY | PlanManager.getPlanHistory | ✓ |
| `POST` | `/api/plan/:id/retry-ai` | RETRY_AI_PLAN | PlanManager.retryAiGeneration | ✓ |
| `POST` | `/api/payments` | RECORD_PAYMENT | ProgressManager.recordPayment | ✓ |
| `GET` | `/api/payments` | GET_PAYMENTS | ProgressManager.getPaymentHistory | ✓ |
| `GET` | `/api/milestones` | GET_MILESTONES | ProgressManager.getMilestones | ✓ |
| `PATCH` | `/api/milestones/:id/acknowledge` | ACKNOWLEDGE_MILESTONE | ProgressManager.acknowledgeMilestone | ✓ |

---

## 3. Reglas del Router

### Reglas de autenticación
1. Todo intent con Auth ✓ requiere `userId` autenticado. Si el token falta o es inválido → `401` antes de llegar al manager.
2. El `userId` del token **nunca** se toma del body ni de query params — siempre de `req.userId` (adjuntado por el middleware).

### Reglas de pre-condición
3. `GENERATE_PLAN` requiere que el usuario tenga un `UserProfile` creado con `monthlyIncome` y `fixedExpenses`. Si no existe → `422 PROFILE_INCOMPLETE` antes de llamar al manager.
4. `CREATE_PROFILE` no se puede llamar si ya existe un `UserProfile` para ese `userId` → `409 PROFILE_ALREADY_EXISTS`.
5. `RETRY_AI_PLAN`: el `:id` del path debe pertenecer al `userId` autenticado. Si no → `403 FORBIDDEN`. Esta verificación ocurre dentro del manager, pero el Router valida que `:id` sea un UUID válido antes de llamar.

### Reglas de parseo
6. El `userId` de un path param (ej: `/api/debts/:id`) se refiere al ID del recurso, no al usuario. El usuario se identifica siempre por `req.userId`.
7. Query params opcionales se normalizan: strings vacíos se tratan como `undefined`.
8. Rutas desconocidas (no listadas en la tabla) retornan `404 UNKNOWN_ROUTE`.

---

## 4. Especificación de cada ruta

### `GET /health`
```
Response 200:
{ "status": "ok", "timestamp": "<ISO date>" }
```

---

### `POST /api/profile`
**Precondición:** no debe existir un UserProfile para `req.userId`.
```
Body:
{
  displayName:    string
  monthlyIncome:  number
  fixedExpenses: {
    rent:       number
    utilities:  number
    food:       number
    transport:  number
    other:      number
  }
}

Response 201: { profile: UserProfile }
Response 409: PROFILE_ALREADY_EXISTS
Response 400: VALIDATION_ERROR (campos requeridos faltantes)
```

---

### `GET /api/profile`
```
Response 200: { profile: UserProfile & { fixedExpenses, totalFixedCosts: number } }
Response 404: PROFILE_NOT_FOUND
```

---

### `PATCH /api/profile`
```
Body (todos opcionales):
{
  displayName?:    string
  monthlyIncome?:  number
  fixedExpenses?: { rent?, utilities?, food?, transport?, other? }
}

Response 200: { profile: UserProfile }
Response 400: VALIDATION_ERROR
```

---

### `POST /api/debts`
```
Body:
{
  debtType: DebtType
  formData: DebtFormData
}

Response 201: { debt: Debt }
Response 400: { error: "VALIDATION_ERROR", errors: ValidationError[] }
```

---

### `GET /api/debts`
```
Query params (opcionales):
  status: 'active' | 'paid_off' | 'frozen' | 'active,paid_off' (default: 'active')

Response 200: {
  debts: (Debt & { isCritical, monthlyInterestCost })[],
  summary: { totalRemainingBalance, totalMonthlyInterestCost, totalMinimumPayments, criticalCount }
}
```

---

### `PATCH /api/debts/:id`
```
Body: Partial<DebtFormData>

Response 200: { debt: Debt }
Response 404: DEBT_NOT_FOUND
Response 400: { error: "VALIDATION_ERROR", errors: ValidationError[] }
Response 422: DEBT_ALREADY_PAID
```

---

### `DELETE /api/debts/:id`
```
Response 200: { success: true }
Response 404: DEBT_NOT_FOUND
```

---

### `POST /api/plan/generate`
```
Body:
{
  strategy:          StrategyType
  reservePercentage: number   // 10 | 20 | 30 | personalizado
}

Response 201: {
  plan: DebtPlan & { planActions: PlanAction[] },
  aiGenerated: boolean
}
Response 422: NO_ACTIVE_DEBTS | INSUFFICIENT_BUDGET | NO_SURPLUS
  (con detalles: deficit, availableBudget, totalMinimumPayments según aplique)
Response 422: PROFILE_INCOMPLETE (si falta monthlyIncome o fixedExpenses)
```

---

### `GET /api/plan/active`
```
Response 200: {
  hasPlan: boolean,
  plan: (DebtPlan & { planActions, currentMonthActions }) | null
}
```

---

### `GET /api/plan/history`
```
Response 200: { plans: PlanSummary[] }
```

---

### `POST /api/plan/:id/retry-ai`
```
Response 200: { aiOutput: AiOutput }
Response 404: PLAN_NOT_FOUND
Response 409: AI_ALREADY_GENERATED
Response 422: AI_GENERATION_FAILED
Response 403: FORBIDDEN (el plan no pertenece al usuario)
```

---

### `POST /api/payments`
```
Body:
{
  debtId:        string
  amount:        number
  paidAt:        string   // ISO date string, el Router parsea a Date
  planActionId?: string
  notes?:        string
}

Response 201: {
  payment: Payment,
  debtUpdate: { previousBalance, newBalance, isPaidOff },
  newMilestones: Milestone[]
}
Response 404: DEBT_NOT_FOUND
Response 422: DEBT_ALREADY_PAID | PAYMENT_EXCEEDS_BALANCE | INVALID_AMOUNT | INVALID_PAYMENT_DATE
```

---

### `GET /api/payments`
```
Query params (opcionales):
  debtId?: string
  limit?:  number (default: 50, max: 100)
  offset?: number (default: 0)

Response 200: { payments: PaymentEnriched[], total: number }
```

---

### `GET /api/milestones`
```
Query params (opcionales):
  filter?: 'pending' | 'acknowledged' | 'all' (default: 'all')

Response 200: { milestones: Milestone[], pendingCount: number }
```

---

### `PATCH /api/milestones/:id/acknowledge`
```
Response 200: { milestone: Milestone }
Response 404: MILESTONE_NOT_FOUND
Response 409: ALREADY_ACKNOWLEDGED
```

---

## 5. Formato de respuesta de error (estándar)

Todos los errores siguen este shape:

```typescript
// Error simple
{
  "error":   "ERROR_CODE",
  "message": "Descripción legible para el desarrollador"
}

// Error de validación (múltiples campos)
{
  "error":  "VALIDATION_ERROR",
  "errors": [
    { "field": "label",   "code": "INVALID_LABEL",   "message": "..." },
    { "field": "balance", "code": "INVALID_BALANCE",  "message": "..." }
  ]
}

// Error de negocio con detalles adicionales
{
  "error":   "INSUFFICIENT_BUDGET",
  "message": "El presupuesto no alcanza para los pagos mínimos",
  "details": {
    "availableBudget":      340000,
    "totalMinimumPayments": 430000,
    "deficit":              90000
  }
}
```

---

## 6. Tabla de códigos HTTP

| Código | Cuándo se usa |
|--------|---------------|
| `200` | GET o PATCH exitoso |
| `201` | POST exitoso (recurso creado) |
| `400` | Errores de validación de formato/campos |
| `401` | Token ausente o inválido |
| `403` | Token válido pero sin acceso al recurso |
| `404` | Recurso no encontrado o ruta desconocida |
| `409` | Conflicto de estado (recurso ya existe, ya fue reconocido, etc.) |
| `422` | Regla de negocio violada (no es un error de formato) |
| `500` | Error inesperado del servidor |

---

*Documento mantenido en: `specs/ROUTER.md`*
