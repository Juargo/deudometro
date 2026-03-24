# SKILL: milestone-detector

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Evaluar si el pago recién registrado ha generado uno o más hitos (milestones) y devolver la lista de los que deben crearse. No persiste — solo detecta y retorna. El `ProgressManager` es responsable de persistirlos.

## Input
```typescript
{
  userId:             string
  affectedDebtId:     string
  isDebtPaidOff:      boolean   // resultado de balance-updater.isPaidOff
  isFirstPaymentEver: boolean   // true si este es el primer Payment del usuario en el sistema
  allUserDebts:       Debt[]    // todas las deudas del usuario (activas + paid_off), con balances ya actualizados
}
```

## Output
```typescript
// Siempre exitoso — es una función pura de detección
{
  newMilestones: MilestoneData[]   // vacío si no se generaron hitos
}

// MilestoneData (antes de persistir)
{
  userId:    string
  debtId?:   string         // presente solo para debt_paid_off
  type:      MilestoneType
  context:   Record<string, unknown>   // datos para renderizar en UI
}
```

## Reglas

### BR-21 — Primer pago global
1. Si `isFirstPaymentEver === true`: generar milestone `first_payment`
   ```json
   { "type": "first_payment", "context": {} }
   ```

### BR-19 — Deuda saldada
2. Si `isDebtPaidOff === true`: generar milestone `debt_paid_off` para `affectedDebtId`
   ```json
   {
     "type": "debt_paid_off",
     "debtId": "<affectedDebtId>",
     "context": {
       "debtLabel": "<label de la deuda>",
       "originalBalance": <originalBalance>
     }
   }
   ```

### BR-20 — Reducción porcentual del total
3. Calcular el porcentaje reducido:
   ```
   totalOriginal = Σ(originalBalance de TODAS las deudas del usuario)
   totalRemaining = Σ(remainingBalance de TODAS las deudas del usuario)
   porcentajeReducido = (totalOriginal - totalRemaining) / totalOriginal
   ```
4. Verificar si se cruzó un umbral **por primera vez** (25%, 50%, 75%):
   - Consultar los milestones existentes del usuario para saber qué umbrales ya fueron disparados
   - Si `porcentajeReducido >= 0.25` y no existe `total_reduced_25pct` previo → generar milestone
   - Si `porcentajeReducido >= 0.50` y no existe `total_reduced_50pct` previo → generar milestone
   - Si `porcentajeReducido >= 0.75` y no existe `total_reduced_75pct` previo → generar milestone
   ```json
   {
     "type": "total_reduced_25pct",  // o 50pct, 75pct
     "context": {
       "percentageReduced": 25,
       "amountReduced": <totalOriginal - totalRemaining>,
       "totalOriginal": <totalOriginal>
     }
   }
   ```

### Orden de milestones en el output
5. Si se generan múltiples milestones en el mismo pago, el orden en el array es:
   `first_payment` (si aplica) → `debt_paid_off` (si aplica) → milestones de porcentaje (25 → 50 → 75)

### Regla de unicidad
6. Nunca generar un milestone de tipo que ya existe en el historial del usuario, excepto `debt_paid_off` (que puede repetirse para distintas deudas)

## Dependencias
- `MilestoneRepository.getByUserId(userId)` → `Promise<Milestone[]>` (para verificar umbrales ya disparados)

> **Nota:** `allUserDebts` se pasa como input (ya cargado por el `ProgressManager`) para evitar una query adicional en este skill.
