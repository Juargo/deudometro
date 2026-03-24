# SKILL: payment-recorder

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Validar y persistir un pago registrado por el usuario contra una deuda específica, verificando que el pago sea válido según las reglas del dominio antes de guardarlo.

## Input
```typescript
{
  userId:        string
  debtId:        string
  amount:        number
  paidAt:        Date
  planActionId?: string   // opcional — asocia el pago a una acción del plan activo
  notes?:        string   // máx 255 chars
}
```

## Output
```typescript
// Éxito
{
  success: true
  payment: Payment   // entidad persistida
}

// Error
{
  success: false
  error:   'DEBT_NOT_FOUND' | 'DEBT_ALREADY_PAID' | 'PAYMENT_EXCEEDS_BALANCE' | 'INVALID_AMOUNT' | 'PLAN_ACTION_NOT_FOUND'
}
```

## Reglas
1. Verificar que `debtId` existe y pertenece a `userId` → si no: `DEBT_NOT_FOUND` (BR-16, seguridad)
2. Si `Debt.status === 'paid_off'` → `DEBT_ALREADY_PAID` (BR-16)
3. `amount` debe ser > 0 → `INVALID_AMOUNT`
4. `amount` no puede superar `Debt.remainingBalance` → `PAYMENT_EXCEEDS_BALANCE` (BR-18)
5. Si se provee `planActionId`: verificar que existe y pertenece al plan activo del usuario → si no: `PLAN_ACTION_NOT_FOUND`
6. Si `notes` supera 255 caracteres: truncar silenciosamente (no es un error de negocio)
7. `paidAt` no puede ser una fecha futura → `INVALID_PAYMENT_DATE`
8. Si todas las validaciones pasan: persistir el `Payment` y retornarlo

## Errores
- `DEBT_NOT_FOUND` — la deuda no existe o no pertenece al usuario
- `DEBT_ALREADY_PAID` — la deuda tiene status `paid_off`
- `INVALID_AMOUNT` — amount <= 0
- `PAYMENT_EXCEEDS_BALANCE` — amount > remainingBalance
- `PLAN_ACTION_NOT_FOUND` — planActionId inválido o de otro usuario/plan
- `INVALID_PAYMENT_DATE` — paidAt es fecha futura

## Dependencias
- `DebtRepository.getByIdAndUserId(debtId, userId)` → `Promise<Debt | null>`
- `PlanRepository.getActionById(planActionId)` → `Promise<PlanAction | null>` (si aplica)
- `PaymentRepository.save(paymentData)` → `Promise<Payment>`
