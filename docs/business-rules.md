# Business Rules — Deudometro

**Versión:** 0.2.0
**Fecha:** 2026-03-23
**Estado:** Draft

**Changelog v0.2:** fórmula de interés mensual corregida (era anual/12); BR-09 reescrita — `availableBudget` se calcula automáticamente desde gastos fijos y reserva; BR-13–15 actualizadas con los 5 tipos de estrategia; añadidas BR-25 (fórmula de presupuesto), BR-26 (crisis_first), BR-27 (urgencia informal), BR-28 (guided_consolidation).

Todas las reglas son declarativas y verificables. Formato: **nombre**, condición, consecuencia, ejemplo concreto.

---

## Módulo 1 — Registro de deudas

### BR-01 · Label obligatorio y acotado
**Condición:** El usuario intenta registrar o editar una deuda.
**Regla:** `label` no puede estar vacío y no puede superar los 60 caracteres.
**Consecuencia:** Si se viola → error `INVALID_LABEL`.
**Ejemplo:** `""` → rechazado. `"Tarjeta Visa BCI cuotas 2024"` → aceptado.

---

### BR-02 · Saldo restante positivo
**Condición:** Registro o edición de una deuda.
**Regla:** `remainingBalance` debe ser estrictamente mayor a `0`.
**Consecuencia:** Si `remainingBalance <= 0` → error `INVALID_BALANCE`. Un saldo 0 significa deuda saldada — el usuario debe marcarla `paid_off`.

---

### BR-03 · Tasa de interés requerida según tipo
**Condición:** Registro de una deuda.
**Regla:** `monthlyInterestRate` es obligatorio para `credit_card`, `consumer_loan` y `mortgage`. Para `informal_lender` es opcional.
**Consecuencia:** Si falta en un tipo que lo requiere → error `MISSING_INTEREST_RATE`.
**Excepción:** Para `informal_lender` sin interés: `monthlyInterestRate = null` y `metadata.hasInterest = false`.

---

### BR-04 · Saldo original como referencia inmutable
**Condición:** Primera vez que se registra una deuda.
**Regla:** `originalBalance` se establece igual a `remainingBalance` al registrar y **nunca se modifica** posteriormente.
**Consecuencia:** Es el denominador para calcular el porcentaje de avance. Solo `remainingBalance` muta con el tiempo.

---

### BR-05 · Pago mínimo no puede superar el saldo restante
**Condición:** Registro o edición de una deuda.
**Regla:** `minimumPayment` no puede ser mayor que `remainingBalance`.
**Consecuencia:** Si se viola → error `MINIMUM_EXCEEDS_BALANCE`.
**Ejemplo:** Saldo $50.000 con mínimo $60.000 → rechazado.

---

## Módulo 2 — Clasificación y detección de deudas críticas

### BR-06 · Deuda crítica: mínimo no cubre los intereses
**Condición:** En cualquier cálculo de análisis de las deudas de un usuario.
**Regla:** Una deuda es **crítica** (`isCritical = true`) si el interés mensual generado es **mayor o igual** al `minimumPayment`.
**Fórmula:** `interésMensual = remainingBalance × (monthlyInterestRate / 100)`
**Consecuencia:** Las deudas críticas se resaltan visualmente en el dashboard y se elevan en prioridad. El sistema sugiere `crisis_first` como estrategia (Paso 5).
**Ejemplo:** Deuda $500.000 al 3% mensual → interésMensual = $15.000. Si minimumPayment = $14.000 → crítica (el mínimo no cubre los intereses, la deuda crece aunque se pague).

---

### BR-07 · Prioridad absoluta del acreedor informal
**Condición:** Generación de cualquier plan de pagos, con cualquier estrategia.
**Regla:** Si existe al menos una deuda `informal_lender` con `status = 'active'`, esa deuda recibe **posición 1** en el plan antes que cualquier otra, independientemente de la estrategia seleccionada.
**Consecuencia:** El algoritmo de la estrategia se aplica sobre las deudas restantes, después de posicionar el/los `informal_lender`.
**Razón:** Las deudas con personas naturales tienen un costo social y relacional que ningún algoritmo financiero puede cuantificar.
**Si hay múltiples `informal_lender`:** se ordenan internamente por `metadata.urgencyLevel` (high → medium → low).

---

### BR-08 · Una deuda crítica no bloquea la generación del plan
**Condición:** Generación de un plan cuando existe al menos una deuda crítica.
**Regla:** La existencia de deudas críticas no impide generar el plan — el sistema genera el plan y advierte.
**Consecuencia:** `aiOutput.critical_alerts` debe contener al menos un mensaje por deuda crítica, recomendando aumentar el presupuesto o renegociar la tasa.

---

## Módulo 3 — Presupuesto y generación de plan

### BR-09 · `availableBudget` se calcula automáticamente
**Condición:** El usuario llega al Paso 5 (Escoger modo de plan) o genera un plan.
**Regla:** El presupuesto disponible para deudas se calcula a partir de los datos de los Pasos 2, 3 y 4. No es ingresado manualmente.
**Fórmula (ver BR-25):** `availableBudget = (monthlyIncome − totalFixedCosts) × (1 − reservePercentage / 100)`
**Consecuencia:** El resultado se persiste en `DebtPlan.monthlyBudget`. `availableBudget` nunca existe como campo independiente en ninguna entidad.

---

### BR-25 · Fórmula completa del presupuesto disponible
**Condición:** Cálculo del presupuesto para generar un plan.
**Fórmula paso a paso:**
1. `totalFixedCosts = fixedExpenses.rent + fixedExpenses.utilities + fixedExpenses.food + fixedExpenses.transport + fixedExpenses.other`
2. `grossSurplus = monthlyIncome − totalFixedCosts`
3. `reservedAmount = grossSurplus × (reservePercentage / 100)`
4. `availableBudget = grossSurplus − reservedAmount`
   → equivalente a: `availableBudget = grossSurplus × (1 − reservePercentage / 100)`

**Valores de reserva del Paso 4:**
- 10% → plan agresivo
- 20% → plan equilibrado (recomendado)
- 30% → plan conservador
- Personalizado → cualquier valor entre 0% y 50%

**Consecuencia:** Si `grossSurplus <= 0` → el usuario no tiene excedente. No se puede generar un plan. Error `NO_SURPLUS`.
**Ejemplo:** Ingreso $1.200.000, gastos fijos $700.000, reserva 20%.
- `grossSurplus` = $500.000
- `reservedAmount` = $100.000
- `availableBudget` = $400.000

---

### BR-10 · Presupuesto mínimo requerido para generar plan
**Condición:** El usuario intenta generar un plan.
**Regla:** `availableBudget` debe ser mayor o igual a la suma de todos los `minimumPayment` de las deudas `active`.
**Consecuencia:** Si `availableBudget < Σ minimumPayments` → error `INSUFFICIENT_BUDGET`. El sistema muestra cuánto falta y sugiere reducir la reserva o aumentar el ingreso declarado.
**Ejemplo:** Tres deudas con mínimos $20.000 / $15.000 / $8.000 = $43.000. Si `availableBudget` = $40.000 → bloqueado.

---

### BR-11 · Solo un plan activo por usuario
**Condición:** El usuario genera un nuevo plan.
**Regla:** Al activar un nuevo `DebtPlan`, todos los planes anteriores con `status = 'active'` pasan automáticamente a `status = 'superseded'`.
**Consecuencia:** En todo momento existe máximo un plan `active` por usuario.

---

### BR-12 · El plan requiere al menos una deuda activa
**Condición:** El usuario intenta generar un plan.
**Regla:** El usuario debe tener al menos una deuda con `status = 'active'`.
**Consecuencia:** Si no hay deudas activas → error `NO_ACTIVE_DEBTS`.

---

## Módulo 4 — Estrategias de ordenamiento

El orden de aplicación de filtros es siempre: **BR-07 (informal_lender) → BR-06 (críticas) → estrategia**.

### BR-13 · Avalanche: mayor tasa mensual primero
**Condición:** Estrategia seleccionada = `avalanche`.
**Regla:** Las deudas se ordenan de **mayor a menor** `monthlyInterestRate`. En empate → de **menor a mayor** `remainingBalance`.
**Pre-filtro:** BR-07 aplica primero. Las deudas críticas se elevan al frente del grupo no-informal.
**Objetivo:** Minimizar el total de intereses pagados.

---

### BR-14 · Snowball: menor saldo primero
**Condición:** Estrategia seleccionada = `snowball`.
**Regla:** Las deudas se ordenan de **menor a mayor** `remainingBalance`. En empate → de **mayor a menor** `monthlyInterestRate`.
**Pre-filtro:** BR-07 aplica primero.
**Objetivo:** Maximizar la motivación psicológica mediante victorias rápidas.

---

### BR-15 · Hybrid: balance entre tasa y saldo
**Condición:** Estrategia seleccionada = `hybrid`.
**Regla:** Primero `informal_lender` (BR-07), luego deudas críticas por tasa (mayor tasa primero), luego el resto por Avalanche (BR-13).
**Objetivo:** Combinar la urgencia financiera con la motivación de eliminar deudas.

---

### BR-26 · Crisis First: apagar todos los incendios primero
**Condición:** Estrategia seleccionada = `crisis_first`. Se sugiere automáticamente en el Paso 5 cuando hay al menos una deuda crítica.
**Regla:**
1. Primero: deudas `informal_lender` ordenadas por urgencia (BR-07).
2. Segundo: deudas críticas (`isCritical = true`) ordenadas de **mayor a menor** `monthlyInterestRate`.
3. Tercero: deudas no críticas ordenadas por Avalanche (BR-13).

**Objetivo:** Detener el sangrado — evitar que las deudas que "crecen solas" absorban todo el presupuesto.
**Diferencia con Hybrid:** `crisis_first` coloca **todas** las deudas críticas antes de las no críticas, mientras que `hybrid` usa la tasa como criterio principal para el grupo no-informal.

---

### BR-28 · Guided Consolidation: consolidación guiada
**Condición:** Estrategia seleccionada = `guided_consolidation`.
**Regla:** _Algoritmo pendiente de definición en Etapa 4 (Mapa de funcionalidades)._ Esta estrategia está reservada en el enum para desarrollo futuro.
**Nota:** En Paso 5 se presenta como opción cuando no hay deudas críticas y el usuario no personaliza.

---

### BR-27 · Urgencia del acreedor informal como criterio de desempate
**Condición:** Existen múltiples deudas `informal_lender` activas.
**Regla:** Se ordenan por `metadata.urgencyLevel`: `high` (1°) → `medium` (2°) → `low` (3°). En caso de igual urgencia → de mayor a menor `remainingBalance`.
**Consecuencia:** Esta regla aplica dentro de la posición 1 reservada por BR-07 para todos los `informal_lender`.

---

## Módulo 5 — Registro de pagos

### BR-16 · No se puede pagar una deuda saldada
**Condición:** El usuario intenta registrar un `Payment`.
**Regla:** No se puede registrar un pago contra una `Debt` con `status = 'paid_off'`.
**Consecuencia:** Error `DEBT_ALREADY_PAID`.

---

### BR-17 · Pago actualiza el saldo restante
**Condición:** Se registra un `Payment` exitosamente.
**Regla:** `Debt.remainingBalance -= Payment.amount`. Si el resultado es `<= 0`, el saldo se establece en `0` y `Debt.status` cambia automáticamente a `'paid_off'`.
**Consecuencia:** El sistema no permite saldos negativos.

---

### BR-18 · Pago puede superar el mínimo pero no el saldo
**Condición:** Registro de un pago.
**Regla:** `Payment.amount` puede ser mayor que `minimumPayment` (abono extra al capital), pero no puede superar `Debt.remainingBalance`.
**Consecuencia:** Si `amount > remainingBalance` → error `PAYMENT_EXCEEDS_BALANCE`.

---

## Módulo 6 — Detección de milestones

### BR-19 · Milestone por deuda saldada
**Condición:** `Debt.status` cambia a `'paid_off'`.
**Regla:** El sistema genera automáticamente un `Milestone` de tipo `debt_paid_off` con `context = { debtLabel, finalAmount }`.

---

### BR-20 · Milestone por reducción porcentual del total
**Condición:** Después de registrar cualquier pago.
**Fórmula:** `porcentajeReducido = 1 − (Σ remainingBalance / Σ originalBalance)` considerando todas las deudas del usuario.
**Regla:** Si el valor cruza los umbrales del **25%, 50% o 75%** por primera vez → se genera el milestone correspondiente.
**Consecuencia:** Cada umbral se dispara **exactamente una vez** en la vida del usuario. No se repite si el saldo sube y baja.

---

### BR-21 · Milestone por primer pago
**Condición:** El usuario registra su primer `Payment` global (no por deuda).
**Regla:** Se genera un `Milestone` de tipo `first_payment`.

---

### BR-22 · Milestone no puede ser des-reconocido
**Condición:** El usuario hace dismiss de un milestone.
**Regla:** `Milestone.acknowledgedAt` solo puede transicionar de `null` a timestamp. Nunca al revés.

---

## Módulo 7 — Integridad de datos

### BR-23 · `PlanAction` debe cuadrar financieramente
**Condición:** Creación de un `PlanAction`.
**Regla:** `principalAmount + interestAmount = paymentAmount` (tolerancia ±1 unidad por redondeo de centavos).
**Consecuencia:** Si no cuadra → error interno `PLAN_ACTION_MISMATCH`.

---

### BR-24 · `remainingBalance` no puede superar `originalBalance`
**Condición:** Siempre, como invariante del dominio.
**Regla:** `Debt.remainingBalance` nunca puede ser mayor que `Debt.originalBalance`.
**Excepción única:** Deudas con capitalización de intereses previa al registro. En ese caso, `originalBalance` debe ingresarse ya con el saldo capitalizado.

---

*Documento mantenido en: `docs/business-rules.md`*
