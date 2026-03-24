# Business Rules — Deudometro

**Versión:** 0.1.0
**Fecha:** 2026-03-23
**Estado:** Draft

Todas las reglas son declarativas y verificables. Formato: **nombre**, condición, consecuencia, ejemplo concreto.

---

## Módulo 1 — Registro de deudas

### BR-01 · Label obligatorio y acotado
**Condición:** El usuario intenta registrar o editar una deuda.
**Regla:** `label` no puede estar vacío y no puede superar los 60 caracteres.
**Consecuencia:** Si se viola, se rechaza el registro con error `INVALID_LABEL`.
**Ejemplo:** `""` → rechazado. `"Tarjeta Visa BCI - cuotas pendientes del 2024"` (47 chars) → aceptado.

---

### BR-02 · Saldo restante positivo
**Condición:** Registro o edición de una deuda.
**Regla:** `remainingBalance` debe ser estrictamente mayor a `0`.
**Consecuencia:** Si `remainingBalance <= 0`, se rechaza con error `INVALID_BALANCE`.
**Ejemplo:** Ingresar saldo `0` significa que la deuda está saldada — el usuario debe eliminarla o marcarla como `paid_off`, no registrarla.

---

### BR-03 · Tasa de interés requerida según tipo
**Condición:** Registro de una deuda.
**Regla:** `interestRate` es obligatorio para todos los `debtType` **excepto** `informal_lender`.
**Consecuencia:** Si falta `interestRate` en un tipo que lo requiere → error `MISSING_INTEREST_RATE`.
**Excepción:** Para `informal_lender`, si no hay interés acordado, `interestRate` se persiste como `null` y `metadata.hasInterest` se establece en `false`.

---

### BR-04 · Saldo original como referencia inmutable
**Condición:** Primera vez que se registra una deuda.
**Regla:** `originalBalance` se establece igual a `remainingBalance` en el momento del registro y **nunca se modifica** posteriormente.
**Consecuencia:** `originalBalance` sirve como punto de referencia para calcular el porcentaje de avance. Solo `remainingBalance` muta con el tiempo.

---

### BR-05 · Pago mínimo no puede superar el saldo restante
**Condición:** Registro o edición de una deuda.
**Regla:** `minimumPayment` no puede ser mayor que `remainingBalance`.
**Consecuencia:** Si se viola → error `MINIMUM_EXCEEDS_BALANCE`.
**Ejemplo:** Saldo $50,000 con mínimo $60,000 → rechazado.

---

## Módulo 2 — Clasificación y detección de deudas críticas

### BR-06 · Deuda crítica por interés que supera el mínimo
**Condición:** En cualquier momento de análisis de las deudas de un usuario.
**Regla:** Una deuda es **crítica** (`isCritical = true`) si el interés mensual generado es mayor o igual al pago mínimo declarado.
**Fórmula:** `interés mensual = remainingBalance × (interestRate / 100 / 12)`
**Consecuencia:** Las deudas críticas son resaltadas visualmente en el dashboard y se elevan en prioridad dentro de cualquier estrategia.
**Ejemplo:** Deuda $500,000 al 36% anual → interés mensual = $15,000. Si el mínimo es $14,000 → deuda crítica (el mínimo no cubre los intereses, la deuda crece).

---

### BR-07 · Prioridad absoluta del acreedor informal
**Condición:** Generación de cualquier plan de pagos.
**Regla:** Si existe al menos una deuda con `debtType = 'informal_lender'` y `status = 'active'`, esa deuda recibe **prioridad 1** en el plan, independientemente de la estrategia seleccionada (Avalanche, Snowball o Hybrid).
**Consecuencia:** El ordenamiento de la estrategia se aplica sobre el resto de las deudas, después de posicionar el `informal_lender`.
**Razón:** Las deudas con personas naturales implican un costo social y relacional que ningún algoritmo financiero puede cuantificar.

---

### BR-08 · Una sola deuda crítica no bloquea el plan
**Condición:** Generación de un plan cuando existe una deuda crítica.
**Regla:** La existencia de deudas críticas no impide generar el plan — el sistema genera el plan y advierte al usuario sobre las deudas críticas.
**Consecuencia:** El `aiSummary` del plan debe mencionar explícitamente las deudas críticas y recomendar aumentar el presupuesto o renegociar la tasa.

---

## Módulo 3 — Presupuesto y generación de plan

### BR-09 · `availableBudget` nunca se persiste
**Condición:** Siempre.
**Regla:** El presupuesto mensual disponible para deudas (`availableBudget`) es un valor que el usuario **ingresa explícitamente** al generar un plan. No se almacena en `UserProfile` ni en ninguna otra entidad.
**Consecuencia:** Cada generación de plan requiere que el usuario confirme cuánto puede destinar ese mes. Esto queda registrado en `DebtPlan.monthlyBudget`.

---

### BR-10 · Presupuesto mínimo requerido para generar plan
**Condición:** El usuario intenta generar un plan.
**Regla:** `monthlyBudget` debe ser mayor o igual a la suma de todos los `minimumPayment` de las deudas `active`.
**Consecuencia:** Si `monthlyBudget < Σ minimumPayments` → error `INSUFFICIENT_BUDGET`. No se genera el plan.
**Ejemplo:** Tres deudas con mínimos $20,000 / $15,000 / $8,000 = total $43,000. Si el usuario ingresa $40,000 → bloqueado.

---

### BR-11 · Solo un plan activo por usuario
**Condición:** El usuario genera un nuevo plan.
**Regla:** Al activar un nuevo `DebtPlan`, todos los planes anteriores con `status = 'active'` pasan automáticamente a `status = 'superseded'`.
**Consecuencia:** En todo momento existe máximo un plan `active` por usuario.

---

### BR-12 · El plan requiere al menos una deuda activa
**Condición:** El usuario intenta generar un plan.
**Regla:** El usuario debe tener al menos una deuda con `status = 'active'` para generar un plan.
**Consecuencia:** Si no hay deudas activas → error `NO_ACTIVE_DEBTS`.

---

## Módulo 4 — Estrategias de ordenamiento

### BR-13 · Avalanche: mayor tasa primero
**Condición:** Estrategia seleccionada = `avalanche`.
**Regla:** Las deudas se ordenan de **mayor a menor** `interestRate`. En caso de empate, se ordena de **menor a mayor** `remainingBalance`.
**Excepción:** BR-07 aplica antes (informal_lender siempre primero). Las deudas críticas (BR-06) se elevan antes del ordenamiento.

---

### BR-14 · Snowball: menor saldo primero
**Condición:** Estrategia seleccionada = `snowball`.
**Regla:** Las deudas se ordenan de **menor a mayor** `remainingBalance`. En caso de empate, se ordena de **mayor a menor** `interestRate`.
**Excepción:** BR-07 y BR-06 aplican antes del ordenamiento snowball.

---

### BR-15 · Hybrid: críticas primero, luego avalanche
**Condición:** Estrategia seleccionada = `hybrid`.
**Regla:** Primero `informal_lender` (BR-07), luego deudas críticas ordenadas por tasa (BR-06), luego el resto por Avalanche (BR-13).

---

## Módulo 5 — Registro de pagos

### BR-16 · No se puede pagar una deuda saldada
**Condición:** El usuario intenta registrar un `Payment`.
**Regla:** No se puede registrar un pago contra una `Debt` con `status = 'paid_off'`.
**Consecuencia:** Error `DEBT_ALREADY_PAID`.

---

### BR-17 · Pago actualiza el saldo restante
**Condición:** Se registra un `Payment` exitosamente.
**Regla:** `Debt.remainingBalance` se reduce en el monto del pago. Si el resultado es `<= 0`, el saldo se establece en `0` y `Debt.status` cambia automáticamente a `'paid_off'`.
**Consecuencia:** El sistema no permite saldos negativos en una deuda.

---

### BR-18 · Pago puede superar el mínimo pero no el saldo
**Condición:** Registro de un pago.
**Regla:** `Payment.amount` puede ser mayor que `minimumPayment` (abono extra), pero no puede superar `Debt.remainingBalance`.
**Consecuencia:** Si `amount > remainingBalance` → error `PAYMENT_EXCEEDS_BALANCE`.

---

## Módulo 6 — Detección de milestones

### BR-19 · Milestone por deuda saldada
**Condición:** `Debt.status` cambia a `'paid_off'`.
**Regla:** El sistema genera automáticamente un `Milestone` de tipo `debt_paid_off` para esa deuda.

---

### BR-20 · Milestone por reducción porcentual del total
**Condición:** Después de registrar cualquier pago.
**Regla:** El sistema calcula `porcentajeReducido = 1 - (Σ remainingBalance actuales / Σ originalBalance de todas las deudas del usuario)`. Si ese valor cruza los umbrales del 25%, 50% o 75% **por primera vez**, se genera el milestone correspondiente (`total_reduced_25pct`, `total_reduced_50pct`, `total_reduced_75pct`).
**Consecuencia:** Cada umbral se dispara **una sola vez** en la vida del usuario. No se repite aunque el saldo suba y baje.

---

### BR-21 · Milestone por primer pago
**Condición:** El usuario registra su primer `Payment` en el sistema (conteo global, no por deuda).
**Regla:** Se genera un `Milestone` de tipo `first_payment`.

---

### BR-22 · Milestone no puede ser des-reconocido
**Condición:** El usuario reconoce (dismiss) un milestone.
**Regla:** `Milestone.acknowledgedAt` solo puede pasar de `null` a un timestamp. No puede volver a `null`.

---

## Módulo 7 — Integridad de datos

### BR-23 · `PlanAction` debe cuadrar financieramente
**Condición:** Creación de un `PlanAction`.
**Regla:** `principalAmount + interestAmount` debe ser igual a `paymentAmount` (con tolerancia de ±1 unidad por redondeo).
**Consecuencia:** Si no cuadra → error de consistencia interna `PLAN_ACTION_MISMATCH`.

---

### BR-24 · `remainingBalance` no puede superar `originalBalance`
**Condición:** Siempre, como invariante del dominio.
**Regla:** `Debt.remainingBalance` nunca puede ser mayor que `Debt.originalBalance`.
**Excepción única:** Deudas donde los intereses capitalizaron antes del registro en el sistema. En ese caso, `originalBalance` debe ingresarse con el saldo capitalizado actual.

---

*Documento mantenido en: `docs/business-rules.md`*
