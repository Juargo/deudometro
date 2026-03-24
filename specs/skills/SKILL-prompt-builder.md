# SKILL: prompt-builder

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Construir el prompt completo de 5 secciones para enviar a la IA, inyectando todos los datos financieros del usuario y el resultado del cálculo del plan. Es una operación de solo construcción de texto — no llama a la IA.

## Input
```typescript
{
  // Datos del usuario (Pasos 2, 3, 4)
  monthlyNetIncome:    number
  totalFixedCosts:     number
  availableBudget:     number
  reservePercentage:   number

  // Deudas con flags calculados
  debts: (Debt & {
    isCritical:          boolean
    monthlyInterestCost: number
    debtOrder:           number
    priorityScore:       number
  })[]

  // Estrategia seleccionada
  strategy: StrategyType

  // Resumen del plan calculado
  planSummary: {
    totalDebt:               number
    totalMinimumPayments:    number
    surplusOverMinimums:     number     // availableBudget - totalMinimumPayments
    criticalDebtCount:       number
    totalInterestProjected:  number
    totalInterestNoPlan:     number
    totalSavings:            number
    estimatedPayoffDate:     Date
    totalMonths:             number
    planActions: {
      monthOffset:   number
      debtLabel:     string
      paymentAmount: number
      minimumPayment: number
      extraPayment:  number   // paymentAmount - minimumPayment
    }[]
  }
}
```

## Output
```typescript
// Siempre exitoso — es una función pura de construcción de texto
{
  systemPrompt: string   // Sección 1: rol del sistema (estático)
  userPrompt:   string   // Secciones 2, 3, 4 y 5 combinadas (dinámico)
}
```

## Reglas

### Sección 1 — Rol del sistema (estático, nunca cambia)
1. El `systemPrompt` es exactamente el siguiente texto, sin modificaciones:

```
Eres un asesor financiero empático y directo especializado en ayudar a personas a salir de deudas. Tu nombre es parte del Deudómetro.

Tu rol es generar planes de acción claros y motivadores basados en datos financieros reales. No eres un banco ni un producto financiero — eres una guía.

Principios que siempre respetas:
- Hablas en segunda persona, tono cercano pero profesional.
- Nunca minimizas la situación del usuario ni la dramatizas.
- Siempre explicas el "por qué" detrás de cada recomendación.
- Nunca inventas datos ni haces suposiciones fuera del contexto entregado.
- Si detectas una situación crítica, la nombras con claridad y calma.
- Tus respuestas son concretas: montos, fechas, plazos reales.
```

### Sección 2 — Contexto del usuario (dinámico)
2. Inyectar todos los valores del input sin redondear — la IA recibe los números exactos
3. Para cada deuda: formatear con el template de la sección 2 del `sdd-methodology.md`
4. Si `isCritical === true`: añadir `⚠️ CRÍTICA: el mínimo no cubre los intereses` en la línea de estado
5. Si `debtType === 'informal_lender'`: añadir `🔥 PRESTAMISTA INFORMAL` en la línea de estado

### Sección 3 — Análisis previo del algoritmo (dinámico)
6. Incluir la estrategia seleccionada con su nombre en español
7. Incluir el orden de prioridad: `[rank]. [label] — score: [priorityScore]`
8. Incluir el plan mes a mes con el template: `[Mes N]: pagar $[amount] a [debtLabel] (mínimo: $[min] + excedente: $[extra])`
9. Solo incluir los primeros 24 meses si el plan supera ese horizonte; indicar "... y N meses más"
10. Incluir las métricas de resumen: `totalInterestProjected`, `totalInterestNoPlan`, `totalSavings`, `estimatedPayoffDate`

### Sección 4 — Directiva de output
11. Incluir la instrucción de formato JSON exacta (ver sdd-methodology.md):
    - Responder ONLY en JSON válido
    - 1 deuda liquidada = 1 milestone en `key_milestones`
    - `free_date_message` siempre en lenguaje natural y motivador
    - Si hay `critical_alerts`, mencionar el problema y dar una acción concreta
    - Nunca inventar montos ni fechas fuera de los calculados

### Sección 5 — Ejemplo few-shot
12. Incluir siempre el ejemplo del `sdd-methodology.md` para calibrar el tono y formato

### Regla general
13. Todos los montos en el prompt se formatean como `$X.XXX` (separador de miles con punto, sin decimales) en pesos CLP

## Dependencias
Ninguna — skill puro de construcción de texto, sin efectos secundarios.
