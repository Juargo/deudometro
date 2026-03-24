# SKILL: critical-debt-detector

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Evaluar un conjunto de deudas activas y marcar cuáles son críticas: aquellas donde el interés mensual generado es mayor o igual al pago mínimo declarado (la deuda crece aunque se pague el mínimo).

## Input
```typescript
{
  debts: Debt[]   // solo se evalúan las deudas con status === 'active'
}
```

## Output
```typescript
// Siempre exitoso — es una función pura de cálculo
{
  debts: (Debt & {
    isCritical:          boolean
    monthlyInterestCost: number   // calculado: remainingBalance × (monthlyInterestRate / 100)
  })[]
  criticalCount:    number
  hasCriticalDebts: boolean
}
```

## Reglas
1. Solo se evalúan deudas con `status === 'active'`. Las `paid_off` y `frozen` se incluyen en el output con `isCritical: false` y `monthlyInterestCost: 0`
2. Fórmula del interés mensual: `monthlyInterestCost = remainingBalance × (monthlyInterestRate / 100)` (BR-06)
3. Una deuda es crítica (`isCritical = true`) si `monthlyInterestCost >= minimumPayment`
4. Si `monthlyInterestRate === null` (deuda informal sin interés): `monthlyInterestCost = 0`, `isCritical = false`
5. El resultado preserva el orden del array de entrada — no reordena
6. `criticalCount` es el número de deudas con `isCritical === true`
7. `hasCriticalDebts` es `criticalCount > 0`

## Ejemplo
```
Deuda: remainingBalance = $500.000, monthlyInterestRate = 3%, minimumPayment = $14.000
→ monthlyInterestCost = $500.000 × 0.03 = $15.000
→ $15.000 >= $14.000 → isCritical = true ✓

Deuda: remainingBalance = $200.000, monthlyInterestRate = 1.5%, minimumPayment = $5.000
→ monthlyInterestCost = $200.000 × 0.015 = $3.000
→ $3.000 < $5.000 → isCritical = false
```

## Dependencias
Ninguna — skill puro, sin efectos secundarios ni acceso a DB.
