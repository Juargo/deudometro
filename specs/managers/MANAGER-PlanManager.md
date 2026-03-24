# MANAGER: PlanManager

**Versión:** 0.1.0 | **Etapa:** 7 — Specs de Managers

## Propósito
Consultar y gestionar los planes de pago de un usuario: obtener el plan activo con todas sus acciones, ver el historial de planes anteriores, y reintentar la generación del resumen IA cuando falló.

---

## Operación 1 — `getActivePlan`

### Input
```typescript
{
  userId: string
}
```

### Output
```typescript
// Plan encontrado
{
  success: true
  plan: DebtPlan & {
    planActions: (PlanAction & {
      debtLabel:    string   // enriquecido con el label de la deuda
      debtType:     DebtType
    })[]
    currentMonthActions: (PlanAction & { debtLabel: string })[]   // acciones del mes actual
  }
  hasPlan: true
}

// Sin plan activo
{
  success: true
  hasPlan: false
  plan:    null
}
```

### Flujo de orquestación
1. `PlanRepository.getActivePlan(userId)` — incluye join con `PlanActions` y los labels de las deudas
2. Si no existe ningún plan `active` → retornar `{ success: true, hasPlan: false, plan: null }`
3. Calcular `currentMonthOffset`:
   - `monthsSincePlanCreation = diff en meses entre plan.createdAt y hoy`
   - `currentMonthOffset = monthsSincePlanCreation + 1`
4. Filtrar `currentMonthActions = planActions.filter(a => a.monthOffset === currentMonthOffset)`
5. Retornar plan enriquecido con `currentMonthActions`

---

## Operación 2 — `getPlanHistory`

### Input
```typescript
{
  userId: string
}
```

### Output
```typescript
{
  success: true
  plans: {
    id:                    string
    strategy:              StrategyType
    status:                PlanStatus
    monthlyBudget:         number
    totalDebtAtCreation:   number
    totalInterestProjected: number
    totalInterestNoPlan:   number
    estimatedPayoffDate:   Date
    createdAt:             Date
    debtCount:             number   // número de deudas que incluía el plan
  }[]
}
```

### Flujo de orquestación
1. `PlanRepository.getAllByUserId(userId)` — ordenados por `createdAt DESC`
2. Para cada plan: agregar `debtCount = count de debtIds únicos en sus PlanActions`
3. Retornar la lista (sin incluir los `PlanActions` completos — son demasiados datos para un listado)

---

## Operación 3 — `retryAiGeneration`

Reintenta generar el resumen IA para un plan que tiene `aiOutput === null`.

### Input
```typescript
{
  userId: string
  planId: string
}
```

### Output
```typescript
{ success: true;  aiOutput: AiOutput }
| { success: false; error: 'PLAN_NOT_FOUND' | 'AI_ALREADY_GENERATED' | 'AI_GENERATION_FAILED' }
```

### Flujo de orquestación
1. `PlanRepository.getByIdAndUserId(planId, userId)`
2. Si no existe → `PLAN_NOT_FOUND`
3. Si `plan.aiOutput !== null` → `AI_ALREADY_GENERATED` (no tiene sentido reintentar)
4. Cargar las deudas y datos necesarios para reconstruir el prompt:
   - `DebtRepository.getDebtsByPlanId(planId)` — las deudas que aparecen en ese plan
   - Usar los snapshots del plan: `monthlyIncomeSnapshot`, `totalFixedCostsSnapshot`, `reservePercentage`, `monthlyBudget`
5. Invocar **[prompt-builder skill]** con los datos del plan (usando snapshots, no datos actuales del usuario)
6. Invocar **[ai-plan-generator skill]**
7. Si IA falla → retornar `AI_GENERATION_FAILED`
8. `PlanRepository.updateAiOutput(planId, aiOutput)`
9. Retornar `{ success: true, aiOutput }`

### Nota de diseño
Se usan los **snapshots del plan** (no los datos financieros actuales del usuario) para que el resumen IA sea coherente con el plan que fue calculado originalmente. Un cambio de ingresos o gastos del usuario no afecta el resumen de un plan antiguo.
