# SKILL: debt-entry

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Validar y persistir una nueva deuda ingresada por el usuario, aplicando todas las reglas de registro del dominio.

## Input
```typescript
{
  userId:   string
  debtType: DebtType   // 'credit_card' | 'consumer_loan' | 'mortgage' | 'informal_lender'
  formData: {
    label:               string
    lenderName?:         string
    remainingBalance:    number
    monthlyInterestRate?: number   // null/undefined para informal_lender sin interés
    minimumPayment:      number
    paymentDueDay:       number    // 1–31
    cutoffDay?:          number    // solo credit_card, 1–31
    metadata:            DebtMetadata   // estructura específica por tipo, ver domain-model.md §4
  }
}
```

## Output
```typescript
// Éxito
{
  success: true
  debt: Debt   // entidad persistida con id, originalBalance = remainingBalance, status: 'active'
}

// Error de validación
{
  success: false
  errors: ValidationError[]   // [{ field: string, code: ErrorCode, message: string }]
}
```

## Reglas
1. `label` no puede estar vacío ni superar 60 caracteres → `INVALID_LABEL` (BR-01)
2. `remainingBalance` debe ser > 0 → `INVALID_BALANCE` (BR-02)
3. `monthlyInterestRate` es obligatorio para `credit_card`, `consumer_loan` y `mortgage`. Para `informal_lender` es opcional → `MISSING_INTEREST_RATE` (BR-03)
4. Si `debtType === 'informal_lender'` y `monthlyInterestRate` es null/undefined: persistir `monthlyInterestRate: null` y `metadata.hasInterest: false` (BR-03)
5. `originalBalance` se establece igual a `remainingBalance` al crear. Nunca se recibe como input → (BR-04)
6. `minimumPayment` no puede ser mayor que `remainingBalance` → `MINIMUM_EXCEEDS_BALANCE` (BR-05)
7. `paymentDueDay` debe estar entre 1 y 31 → `INVALID_DUE_DAY`
8. `cutoffDay` solo se acepta si `debtType === 'credit_card'`. Si se envía para otro tipo, se ignora silenciosamente
9. El campo `metadata` debe respetar la estructura del tipo correspondiente (ver domain-model.md §4) → `INVALID_METADATA`
10. Si hay múltiples errores de validación, se devuelven todos juntos (no fail-fast)

## Errores
- `INVALID_LABEL` — label vacío o más de 60 caracteres
- `INVALID_BALANCE` — remainingBalance <= 0
- `MISSING_INTEREST_RATE` — tasa requerida para el tipo y no fue entregada
- `MINIMUM_EXCEEDS_BALANCE` — minimumPayment > remainingBalance
- `INVALID_DUE_DAY` — paymentDueDay fuera del rango 1–31
- `INVALID_METADATA` — estructura del metadata no corresponde al debtType

## Dependencias
- `DebtRepository.save(debtData)` → `Promise<Debt>`
- `debt-validator` skill (invocado internamente antes de persistir)
