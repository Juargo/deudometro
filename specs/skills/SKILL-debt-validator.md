# SKILL: debt-validator

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Validar los datos de una deuda contra las reglas del dominio y devolver todos los errores encontrados. Es una operación de solo lectura — no persiste ni modifica nada.

## Input
```typescript
{
  debtType: DebtType
  formData: {
    label:                string
    remainingBalance:     number
    monthlyInterestRate?: number
    minimumPayment:       number
    paymentDueDay:        number
    cutoffDay?:           number
    metadata:             Record<string, unknown>
  }
}
```

## Output
```typescript
// Siempre devuelve este shape (no usa success/failure — es una función pura de validación)
{
  isValid:  boolean
  errors:   ValidationError[]   // vacío si isValid === true
}

// ValidationError
{
  field:   string    // nombre del campo con error
  code:    string    // código de error (ver lista abajo)
  message: string    // descripción legible
}
```

## Reglas
1. `label` vacío → error en campo `label`, código `INVALID_LABEL`
2. `label` > 60 caracteres → error en campo `label`, código `INVALID_LABEL`
3. `remainingBalance <= 0` → error en campo `remainingBalance`, código `INVALID_BALANCE`
4. `monthlyInterestRate` requerido para `credit_card`, `consumer_loan`, `mortgage`; si falta → código `MISSING_INTEREST_RATE`
5. `monthlyInterestRate` fuera del rango 0–99.9999 (si está presente) → código `INVALID_INTEREST_RATE`
6. `minimumPayment > remainingBalance` → código `MINIMUM_EXCEEDS_BALANCE`
7. `paymentDueDay` fuera de 1–31 → código `INVALID_DUE_DAY`
8. `cutoffDay` presente y `debtType !== 'credit_card'` → ignorar (no es un error)
9. `cutoffDay` fuera de 1–31 (si está presente para credit_card) → código `INVALID_CUTOFF_DAY`
10. `metadata` no respeta la estructura esperada para el `debtType` → código `INVALID_METADATA`
11. Todos los errores se recopilan antes de retornar — no se detiene en el primer error

## Errores (códigos)
- `INVALID_LABEL`
- `INVALID_BALANCE`
- `MISSING_INTEREST_RATE`
- `INVALID_INTEREST_RATE`
- `MINIMUM_EXCEEDS_BALANCE`
- `INVALID_DUE_DAY`
- `INVALID_CUTOFF_DAY`
- `INVALID_METADATA`

## Dependencias
Ninguna — skill puro, sin efectos secundarios ni acceso a DB.
