# MANAGER: AnalysisManager

**Versión:** 0.1.0 | **Etapa:** 7 — Specs de Managers

## Propósito
Orquestar la generación completa de un plan de pagos personalizado: desde cargar el estado financiero del usuario, calcular el plan mes a mes con la estrategia elegida, construir y enviar el prompt a la IA, hasta persistir el plan y sus acciones.

Es el manager más complejo del sistema. Su output es el artefacto central del producto.

---

## Operación 1 — `generatePlan`

### Input
```typescript
{
  userId:            string
  strategy:          StrategyType
  reservePercentage: number   // 10 | 20 | 30 | personalizado (0–50)
}
```

### Output
```typescript
// Éxito
{
  success: true
  plan: DebtPlan & {
    planActions: PlanAction[]
  }
  aiGenerated: boolean   // false si la IA falló (plan válido pero sin aiOutput)
}

// Error
{
  success: false
  error:   'NO_ACTIVE_DEBTS' | 'INSUFFICIENT_BUDGET' | 'NO_SURPLUS'
  details?: {
    deficit?:           number   // si INSUFFICIENT_BUDGET
    availableBudget?:   number
    totalMinimumPayments?: number
  }
}
```

### Flujo de orquestación

```
1. Cargar datos del usuario
   └── UserRepository.getWithDebtsAndExpenses(userId)
       → { userProfile, debts: Debt[], fixedExpenses }

2. Filtrar solo deudas activas
   → activeDebts = debts.filter(d => d.status === 'active')
   → Si activeDebts.length === 0 → retornar NO_ACTIVE_DEBTS

3. Calcular presupuesto disponible (BR-25)
   → totalFixedCosts = Σ(fixedExpenses values)
   → grossSurplus = userProfile.monthlyIncome - totalFixedCosts
   → Si grossSurplus <= 0 → retornar NO_SURPLUS
   → availableBudget = grossSurplus × (1 - reservePercentage / 100)

4. Verificar presupuesto mínimo (BR-10)
   → totalMinimumPayments = Σ(activeDebts.minimumPayment)
   → Si availableBudget < totalMinimumPayments
     → retornar INSUFFICIENT_BUDGET con deficit y detalles

5. Detectar deudas críticas
   └── [critical-debt-detector skill]({ debts: activeDebts })
       → debtsWithCritical: (Debt & { isCritical, monthlyInterestCost })[]

6. Ordenar deudas según estrategia
   └── [strategy-sorter skill]({ debts: debtsWithCritical, strategy })
       → sortedDebts: (Debt & { isCritical, monthlyInterestCost, debtOrder, priorityScore })[]

7. Calcular plan mes a mes
   └── [plan-calculator skill]({
         sortedDebts,
         monthlyBudget: availableBudget,
         planStartDate: new Date()
       })
       → Si error INSUFFICIENT_BUDGET → retornarlo (no debería ocurrir si paso 4 pasó — safety check)
       → planActions, estimatedPayoffDate, totalInterestProjected, totalInterestNoPlan, totalSavings

8. Construir prompt para la IA
   └── [prompt-builder skill]({
         monthlyNetIncome: userProfile.monthlyIncome,
         totalFixedCosts,
         availableBudget,
         reservePercentage,
         debts: debtsWithCritical (con debtOrder y priorityScore),
         strategy,
         planSummary: { ...métricas del paso 7, planActions resumidos }
       })
       → { systemPrompt, userPrompt }

9. Llamar a la IA
   └── [ai-plan-generator skill]({ systemPrompt, userPrompt })
       → Si success: true → aiOutput guardado
       → Si success: false → aiOutput = null, aiGenerated = false (no bloquea)

10. Superseder el plan activo anterior (si existe)
    └── PlanRepository.supersedeActivePlan(userId)
        → Cambia status de 'active' → 'superseded' en el plan anterior (BR-11)

11. Persistir el nuevo plan y sus acciones (transacción atómica)
    └── PlanRepository.createPlanWithActions({
          userId,
          strategy,
          monthlyIncomeSnapshot:   userProfile.monthlyIncome,
          totalFixedCostsSnapshot: totalFixedCosts,
          reservePercentage,
          monthlyBudget:           availableBudget,
          totalDebtAtCreation:     Σ(activeDebts.remainingBalance),
          totalInterestProjected,
          totalInterestNoPlan,
          estimatedPayoffDate,
          aiOutput,                // null si IA falló
          status:                  'active',
          planActions              // array completo de PlanActionData
        })

12. Retornar
    → { success: true, plan: planConAcciones, aiGenerated: aiOutput !== null }
```

### Errores
- `NO_ACTIVE_DEBTS` — el usuario no tiene deudas con status active (BR-12)
- `INSUFFICIENT_BUDGET` — availableBudget < Σ minimumPayments (BR-10). Incluye `deficit` y montos para que el frontend pueda mostrar exactamente cuánto falta
- `NO_SURPLUS` — monthlyIncome <= totalFixedCosts. El usuario no tiene excedente alguno (BR-25)

### Nota sobre `aiGenerated: false`
El plan es válido y completo sin el `aiOutput`. El frontend debe mostrar el plan con sus `PlanActions` y métricas incluso si `aiGenerated === false`, y ofrecer un botón "Generar resumen IA" para reintentarlo.
