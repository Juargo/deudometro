# SKILL: balance-updater

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Actualizar el `remainingBalance` de una deuda después de registrar un pago y, si el saldo llega a cero, cambiar automáticamente el `status` a `paid_off`.

## Input
```typescript
{
  debtId:        string
  paymentAmount: number   // monto del pago ya validado por payment-recorder
}
```

## Output
```typescript
{
  success:         true   // este skill no falla si el input viene validado de payment-recorder
  debtId:          string
  previousBalance: number
  newBalance:      number   // max(0, previousBalance - paymentAmount)
  isPaidOff:       boolean  // true si newBalance === 0
}
```

## Reglas
1. Leer el `remainingBalance` actual desde la DB (fuente de verdad, no confiar en el valor del input)
2. `newBalance = Math.max(0, previousBalance - paymentAmount)` — nunca puede ser negativo (BR-17)
3. Si `newBalance === 0`: actualizar `Debt.status` a `'paid_off'` en la misma operación atómica que el balance
4. Si `newBalance > 0`: solo actualizar `remainingBalance`, no tocar `status`
5. La actualización debe ser atómica: balance y status en una sola transacción de DB
6. `isPaidOff = newBalance === 0`

## Nota de diseño
Este skill se ejecuta **siempre** después de `payment-recorder`. El `ProgressManager` los llama en secuencia:
1. `payment-recorder` → valida y guarda el Payment
2. `balance-updater` → actualiza Debt con el nuevo balance
3. `milestone-detector` → evalúa si se generaron hitos

## Dependencias
- `DebtRepository.getById(debtId)` → `Promise<Debt>`
- `DebtRepository.updateBalance(debtId, newBalance, newStatus?)` → `Promise<Debt>`
