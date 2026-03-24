# MANAGER: DebtManager

**Versión:** 0.1.0 | **Etapa:** 7 — Specs de Managers

## Propósito
Gestionar el ciclo de vida completo de las deudas de un usuario: creación, edición, listado y archivado. Es el manager más simple — sus operaciones son CRUD con validación de dominio.

---

## Operación 1 — `createDebt`

### Input
```typescript
{
  userId:   string
  debtType: DebtType
  formData: DebtFormData   // ver SKILL-debt-entry para la estructura completa
}
```

### Output
```typescript
{ success: true;  debt: Debt }
| { success: false; errors: ValidationError[] }
```

### Flujo de orquestación
1. Invocar **[debt-entry skill]** con `{ userId, debtType, formData }`
2. Si `debt-entry` retorna `success: false` → retornar los errores al router sin modificar
3. Si `debt-entry` retorna `success: true` → retornar `{ success: true, debt }`

### Errores
- Propagados desde `debt-entry`: `INVALID_LABEL`, `INVALID_BALANCE`, `MISSING_INTEREST_RATE`, `MINIMUM_EXCEEDS_BALANCE`, `INVALID_DUE_DAY`, `INVALID_METADATA`

---

## Operación 2 — `updateDebt`

### Input
```typescript
{
  userId: string
  debtId: string
  patch:  Partial<DebtFormData>   // solo los campos que cambian
}
```

### Output
```typescript
{ success: true;  debt: Debt }
| { success: false; error: 'DEBT_NOT_FOUND' | 'FORBIDDEN' | string; errors?: ValidationError[] }
```

### Flujo de orquestación
1. Cargar la deuda actual: `DebtRepository.getByIdAndUserId(debtId, userId)`
2. Si no existe → retornar `{ success: false, error: 'DEBT_NOT_FOUND' }`
3. Si `Debt.status === 'paid_off'` → retornar `{ success: false, error: 'DEBT_ALREADY_PAID' }` (no se edita una deuda saldada)
4. Fusionar los campos del `patch` con los datos actuales de la deuda
5. Invocar **[debt-validator skill]** con los datos fusionados
6. Si hay errores de validación → retornarlos
7. `DebtRepository.update(debtId, mergedData)`
8. Retornar `{ success: true, debt: updatedDebt }`

### Nota de diseño
`originalBalance` nunca se actualiza en un edit — es inmutable (BR-04). Si el usuario quiere corregir el saldo original, debe archivar la deuda y crear una nueva.

### Errores
- `DEBT_NOT_FOUND` — deuda no existe o no pertenece al usuario
- `DEBT_ALREADY_PAID` — no se puede editar una deuda con status paid_off
- Errores de validación desde `debt-validator`

---

## Operación 3 — `listDebts`

### Input
```typescript
{
  userId:  string
  filters?: {
    status?: DebtStatus | DebtStatus[]   // default: ['active']
  }
}
```

### Output
```typescript
{
  success: true
  debts: (Debt & {
    isCritical:          boolean
    monthlyInterestCost: number
  })[]
  summary: {
    totalRemainingBalance:    number
    totalMonthlyInterestCost: number
    totalMinimumPayments:     number
    criticalCount:            number
  }
}
```

### Flujo de orquestación
1. `DebtRepository.getAllByUserId(userId, filters)`
2. Invocar **[critical-debt-detector skill]** con las deudas obtenidas
3. Calcular el `summary` con los valores del resultado del skill
4. Retornar deudas enriquecidas con `isCritical` y `monthlyInterestCost` + summary

---

## Operación 4 — `archiveDebt`

### Input
```typescript
{
  userId: string
  debtId: string
}
```

### Output
```typescript
{ success: true }
| { success: false; error: 'DEBT_NOT_FOUND' }
```

### Flujo de orquestación
1. `DebtRepository.getByIdAndUserId(debtId, userId)`
2. Si no existe → `DEBT_NOT_FOUND`
3. `DebtRepository.updateStatus(debtId, 'frozen')`
4. Retornar `{ success: true }`

### Nota de diseño
Archivar cambia el status a `frozen`, no elimina el registro. Esto preserva el historial y los `PlanActions` asociados. Una deuda `frozen` se excluye de futuros planes.
