# SKILL: plan-calculator

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Calcular el plan de pagos completo mes a mes: determinar cuánto pagar a cada deuda en cada mes hasta liquidar todas, generando los `PlanAction` del plan y las métricas de resumen (fecha de libertad financiera, intereses proyectados, ahorro vs. solo mínimos).

## Input
```typescript
{
  sortedDebts: (Debt & { debtOrder: number })[]   // deudas activas, ya ordenadas por strategy-sorter
  monthlyBudget: number                            // presupuesto disponible (calculado por BR-25)
  planStartDate: Date                              // para calcular estimatedPayoffDate
}
```

## Output
```typescript
// Éxito
{
  success: true
  planActions:              PlanActionData[]
  estimatedPayoffDate:      Date
  totalInterestProjected:   number   // total intereses pagando con este plan
  totalInterestNoPlan:      number   // total intereses pagando solo mínimos (base comparación)
  totalSavings:             number   // totalInterestNoPlan - totalInterestProjected
  totalMonths:              number   // meses hasta liquidar todo
}

// Error
{
  success: false
  error:   'INSUFFICIENT_BUDGET'
  deficit: number   // cuánto falta: (Σ minimumPayments) - monthlyBudget
}

// PlanActionData (antes de persistir — sin id ni planId)
{
  debtId:                string
  monthOffset:           number   // 1 = primer mes
  paymentAmount:         number
  principalAmount:       number
  interestAmount:        number
  remainingBalanceAfter: number
  debtOrder:             number
}
```

## Reglas

### Validación previa
1. Si `monthlyBudget < Σ(minimumPayment de todas las deudas del input)` → retornar `INSUFFICIENT_BUDGET` con el déficit exacto (BR-10)

### Algoritmo de simulación mes a mes
2. Inicializar `workingBalances`: Map de `debtId → remainingBalance` (copia de trabajo, no modifica las entidades)
3. En cada mes `m` (comenzando en 1), hasta que `Σ workingBalances === 0`:

   a. **Calcular intereses del mes** para cada deuda activa:
      `interestAmount = workingBalances[debtId] × (monthlyInterestRate / 100)`
      Para `informal_lender` con `monthlyInterestRate === null`: `interestAmount = 0`

   b. **Asignar pago mínimo** a cada deuda:
      `minimumPrincipal = minimumPayment - interestAmount`
      Si `minimumPrincipal < 0`: significa que el mínimo no cubre los intereses (deuda crítica).
      En ese caso: `minimumPrincipal = 0`, `interestAmount = minimumPayment` (el mínimo se va todo a interés)

   c. **Calcular excedente del mes**:
      `surplus = monthlyBudget - Σ(minimumPayment de deudas aún activas)`

   d. **Aplicar excedente** a la deuda de `debtOrder = 1` (la de mayor prioridad aún activa):
      `extraPayment = min(surplus, workingBalances[debtId] - minimumPrincipal)`

   e. **Generar `PlanActionData`** para cada deuda con saldo > 0 en este mes:
      ```
      paymentAmount  = minimumPayment + (extraPayment si debtOrder === 1, sino 0)
      principalAmount = paymentAmount - interestAmount
      remainingBalanceAfter = workingBalances[debtId] - principalAmount
      ```
      Si `remainingBalanceAfter < 0`: ajustar a 0 y reducir `paymentAmount` en consecuencia

   f. **Actualizar `workingBalances`** con los nuevos saldos
   g. Si `workingBalances[debtId] === 0`: esa deuda está saldada. En meses siguientes, su `minimumPayment` se suma al excedente disponible para la siguiente deuda prioritaria (efecto snowball/avalanche del presupuesto liberado)

4. `estimatedPayoffDate = planStartDate + totalMonths meses`
5. `totalInterestProjected = Σ(interestAmount de todos los PlanActionData)`

### Cálculo de `totalInterestNoPlan` (solo mínimos)
6. Simular por separado cada deuda pagando solo `minimumPayment` cada mes hasta saldo 0. Sumar todos los intereses. Este cálculo es independiente del plan y sirve como base de comparación.

### Invariante de integridad
7. Para cada `PlanActionData`: `principalAmount + interestAmount = paymentAmount` (con tolerancia ±1 por redondeo) (BR-23)
8. Ningún `remainingBalanceAfter` puede ser negativo

## Dependencias
Ninguna — skill puro de cálculo financiero, sin acceso a DB.
