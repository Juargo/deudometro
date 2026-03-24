# MANAGER: ProgressManager

**Versión:** 0.1.0 | **Etapa:** 7 — Specs de Managers

## Propósito
Gestionar el seguimiento del progreso del usuario: registrar pagos, actualizar saldos, detectar y persistir milestones, y manejar el reconocimiento de logros. Es el manager que más events dispara en el sistema.

---

## Operación 1 — `recordPayment`

La operación más compleja: registrar un pago activa una cadena de 4 skills en secuencia.

### Input
```typescript
{
  userId:        string
  debtId:        string
  amount:        number
  paidAt:        Date
  planActionId?: string
  notes?:        string
}
```

### Output
```typescript
// Éxito
{
  success:          true
  payment:          Payment
  debtUpdate: {
    previousBalance:  number
    newBalance:       number
    isPaidOff:        boolean
  }
  newMilestones:    Milestone[]   // vacío si no se generaron hitos
}

// Error
{
  success: false
  error:   'DEBT_NOT_FOUND' | 'DEBT_ALREADY_PAID' | 'PAYMENT_EXCEEDS_BALANCE' | 'INVALID_AMOUNT' | 'INVALID_PAYMENT_DATE' | 'PLAN_ACTION_NOT_FOUND'
}
```

### Flujo de orquestación

```
1. Registrar el pago
   └── [payment-recorder skill]({
         userId, debtId, amount, paidAt, planActionId?, notes?
       })
       → Si error → retornar el error inmediatamente (sin continuar)
       → Si success → payment: Payment

2. Actualizar el saldo de la deuda
   └── [balance-updater skill]({ debtId, paymentAmount: amount })
       → { previousBalance, newBalance, isPaidOff }

3. Determinar si es el primer pago del usuario
   └── PaymentRepository.countByUserId(userId)
       → isFirstPaymentEver = (count === 1)
          (el pago ya fue guardado en paso 1, así que count >= 1)

4. Cargar todas las deudas del usuario con saldos actualizados
   └── DebtRepository.getAllByUserId(userId)
       → allUserDebts (incluye la deuda recién actualizada)

5. Detectar milestones generados por este pago
   └── [milestone-detector skill]({
         userId,
         affectedDebtId:     debtId,
         isDebtPaidOff:      isPaidOff,
         isFirstPaymentEver,
         allUserDebts
       })
       → { newMilestones: MilestoneData[] }

6. Persistir los milestones (si los hay)
   └── Si newMilestones.length > 0:
       MilestoneRepository.createMany(newMilestones)
       → persistedMilestones: Milestone[]

7. Retornar
   → {
       success: true,
       payment,
       debtUpdate: { previousBalance, newBalance, isPaidOff },
       newMilestones: persistedMilestones
     }
```

### Errores
Propagados desde `payment-recorder`: `DEBT_NOT_FOUND`, `DEBT_ALREADY_PAID`, `INVALID_AMOUNT`, `PAYMENT_EXCEEDS_BALANCE`, `PLAN_ACTION_NOT_FOUND`, `INVALID_PAYMENT_DATE`

---

## Operación 2 — `getMilestones`

### Input
```typescript
{
  userId: string
  filter?: 'pending' | 'acknowledged' | 'all'   // default: 'all'
}
```

### Output
```typescript
{
  success: true
  milestones: Milestone[]   // ordenados: pendientes primero, luego por createdAt DESC
  pendingCount: number
}
```

### Flujo de orquestación
1. `MilestoneRepository.getByUserId(userId, filter)`
2. Ordenar: milestones con `acknowledgedAt === null` primero, luego por `createdAt DESC`
3. `pendingCount = milestones.filter(m => m.acknowledgedAt === null).length`
4. Retornar

---

## Operación 3 — `acknowledgeMilestone`

### Input
```typescript
{
  userId:      string
  milestoneId: string
}
```

### Output
```typescript
{ success: true;  milestone: Milestone }
| { success: false; error: 'MILESTONE_NOT_FOUND' | 'ALREADY_ACKNOWLEDGED' }
```

### Flujo de orquestación
1. `MilestoneRepository.getByIdAndUserId(milestoneId, userId)`
2. Si no existe → `MILESTONE_NOT_FOUND`
3. Si `milestone.acknowledgedAt !== null` → `ALREADY_ACKNOWLEDGED` (BR-22, no se puede des-reconocer)
4. `MilestoneRepository.acknowledge(milestoneId, new Date())`
5. Retornar `{ success: true, milestone: updatedMilestone }`

---

## Operación 4 — `getPaymentHistory`

### Input
```typescript
{
  userId:  string
  debtId?: string   // opcional: historial de una deuda específica
  limit?:  number   // default: 50
  offset?: number   // default: 0 (para paginación)
}
```

### Output
```typescript
{
  success:  true
  payments: (Payment & {
    debtLabel:         string
    planActionDetails?: {
      monthOffset:    number
      suggestedAmount: number
    }
  })[]
  total:    number
}
```

### Flujo de orquestación
1. `PaymentRepository.getByUserId(userId, { debtId, limit, offset })` — con join a deuda y planAction
2. Enriquecer cada pago con el `debtLabel` y `planActionDetails` si aplica
3. `PaymentRepository.countByUserId(userId, { debtId })` para el total
4. Retornar
