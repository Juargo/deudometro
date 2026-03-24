# SKILL: strategy-sorter

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Ordenar las deudas activas según la estrategia seleccionada y asignar un `debtOrder` (número de prioridad de pago) a cada una, respetando las reglas de prioridad absoluta del dominio.

## Input
```typescript
{
  debts: (Debt & {
    isCritical:          boolean
    monthlyInterestCost: number
  })[]   // solo deudas con status === 'active'
  strategy: StrategyType
}
```

## Output
```typescript
// Siempre exitoso — es una función pura de ordenamiento
{
  sortedDebts: (Debt & {
    isCritical:          boolean
    monthlyInterestCost: number
    debtOrder:           number   // 1 = máxima prioridad
    priorityScore:       number   // score numérico usado para ordenar (útil para el prompt)
  })[]
}
```

## Reglas de ordenamiento (se aplican en este orden estricto)

### Nivel 1 — Prioridad absoluta (aplica a todas las estrategias)
1. Las deudas `informal_lender` con `status === 'active'` siempre ocupan las primeras posiciones (BR-07)
2. Si hay múltiples `informal_lender`, se ordenan entre sí por `metadata.urgencyLevel`: `high` (1°) → `medium` (2°) → `low` (3°). En empate de urgencia: de mayor a menor `remainingBalance` (BR-27)

### Nivel 2 — Ordenamiento por estrategia (aplica al resto de deudas)

**`avalanche`** (BR-13):
3. Deudas críticas no-informal: de mayor a menor `monthlyInterestRate`
4. Deudas no críticas: de mayor a menor `monthlyInterestRate`
5. Empate en tasa: de menor a mayor `remainingBalance`
- `priorityScore = monthlyInterestRate × 1000 + (1 / remainingBalance)`

**`snowball`** (BR-14):
3. Deudas críticas no-informal: de menor a mayor `remainingBalance`
4. Deudas no críticas: de menor a mayor `remainingBalance`
5. Empate en saldo: de mayor a menor `monthlyInterestRate`
- `priorityScore = (1 / remainingBalance) × 1000 + monthlyInterestRate`

**`hybrid`** (BR-15):
3. Deudas críticas no-informal: de mayor a menor `monthlyInterestRate` (avalanche entre críticas)
4. Deudas no críticas: de mayor a menor `monthlyInterestRate` (avalanche entre no críticas)
- `priorityScore = isCritical ? monthlyInterestRate + 1000 : monthlyInterestRate`

**`crisis_first`** (BR-26):
3. Deudas críticas no-informal: de mayor a menor `monthlyInterestRate`
4. Deudas no críticas: de mayor a menor `monthlyInterestRate`
- Diferencia con hybrid: en `crisis_first`, las deudas críticas se agrupan explícitamente todas antes de cualquier deuda no crítica, sin importar la tasa
- `priorityScore = isCritical ? monthlyInterestRate + 10000 : monthlyInterestRate`

**`guided_consolidation`** (BR-28):
3. Score ponderado: `priorityScore = (monthlyInterestRate × 0.6) + ((maxBalance / remainingBalance) × 0.4 × 100)`
   donde `maxBalance = Math.max(...debts.map(d => d.remainingBalance))`
4. Ordenar de mayor a menor `priorityScore`
- Este orden es una sugerencia — puede ser reordenado por el usuario en la UI antes de confirmar

### Nivel 3 — Asignación de `debtOrder`
6. Después de aplicar las reglas anteriores, asignar `debtOrder` secuencialmente: 1, 2, 3, …
7. Los `informal_lender` del Nivel 1 reciben `debtOrder` 1, 2, … antes que cualquier deuda del Nivel 2

## Dependencias
Ninguna — skill puro, sin efectos secundarios ni acceso a DB.
