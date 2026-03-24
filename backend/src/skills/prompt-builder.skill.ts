// SKILL: prompt-builder
// Spec: specs/skills/SKILL-prompt-builder.md
// Pure text construction — no side effects, no DB access.

import type { StrategyType, DebtType } from '../types/domain'

export interface DebtForPrompt {
  id: string
  label: string
  debtType: DebtType
  lenderName: string | null
  remainingBalance: number
  monthlyInterestRate: number | null
  minimumPayment: number
  paymentDueDay: number
  isCritical: boolean
  monthlyInterestCost: number
  debtOrder: number
  priorityScore: number
}

export interface PlanSummaryForPrompt {
  totalDebt: number
  totalMinimumPayments: number
  surplusOverMinimums: number
  criticalDebtCount: number
  totalInterestProjected: number
  totalInterestNoPlan: number
  totalSavings: number
  estimatedPayoffDate: Date
  totalMonths: number
  planActions: {
    monthOffset: number
    debtLabel: string
    paymentAmount: number
    minimumPayment: number
    extraPayment: number
  }[]
}

export interface PromptBuilderInput {
  monthlyNetIncome: number
  totalFixedCosts: number
  availableBudget: number
  reservePercentage: number
  debts: DebtForPrompt[]
  strategy: StrategyType
  planSummary: PlanSummaryForPrompt
}

export interface PromptBuilderOutput {
  systemPrompt: string
  userPrompt: string
}

// Rule 1: static system prompt (never changes)
const SYSTEM_PROMPT = `Eres un asesor financiero empático y directo especializado en ayudar a personas a salir de deudas. Tu nombre es parte del Deudómetro.

Tu rol es generar planes de acción claros y motivadores basados en datos financieros reales. No eres un banco ni un producto financiero — eres una guía.

Principios que siempre respetas:
- Hablas en segunda persona, tono cercano pero profesional.
- Nunca minimizas la situación del usuario ni la dramatizas.
- Siempre explicas el "por qué" detrás de cada recomendación.
- Nunca inventas datos ni haces suposiciones fuera del contexto entregado.
- Si detectas una situación crítica, la nombras con claridad y calma.
- Tus respuestas son concretas: montos, fechas, plazos reales.`

const STRATEGY_NAMES: Record<StrategyType, string> = {
  avalanche: 'Avalancha (mayor tasa primero)',
  snowball: 'Bola de nieve (menor saldo primero)',
  hybrid: 'Híbrida (equilibrio entre tasa y saldo)',
  crisis_first: 'Primero el fuego (deudas críticas al frente)',
  guided_consolidation: 'Consolidación guiada (score ponderado)',
}

const DEBT_TYPE_NAMES: Record<DebtType, string> = {
  credit_card: 'Tarjeta de crédito',
  consumer_loan: 'Crédito de consumo',
  mortgage: 'Crédito hipotecario',
  informal_lender: 'Deuda informal',
}

export function buildPrompt(input: PromptBuilderInput): PromptBuilderOutput {
  const { debts, strategy, planSummary } = input

  const userPrompt = [
    buildSection2(input),
    buildSection3(debts, strategy, planSummary),
    buildSection4(),
    buildSection5(),
  ].join('\n\n')

  return { systemPrompt: SYSTEM_PROMPT, userPrompt }
}

// Section 2: user context
function buildSection2(input: PromptBuilderInput): string {
  const { monthlyNetIncome, totalFixedCosts, availableBudget, reservePercentage, debts } = input
  const lines: string[] = [
    '## Contexto del usuario',
    '',
    '**Situación financiera:**',
    `- Ingreso mensual neto: ${clp(monthlyNetIncome)}`,
    `- Gastos fijos totales: ${clp(totalFixedCosts)}`,
    `- Reserva de emergencia: ${reservePercentage}%`,
    `- Presupuesto disponible para deudas: ${clp(availableBudget)}`,
    '',
    '**Deudas activas:**',
  ]

  const sorted = [...debts].sort((a, b) => a.debtOrder - b.debtOrder)
  for (const debt of sorted) {
    const statusFlags: string[] = []
    if (debt.isCritical) statusFlags.push('⚠️ CRÍTICA: el mínimo no cubre los intereses')
    if (debt.debtType === 'informal_lender') statusFlags.push('🔥 PRESTAMISTA INFORMAL')

    lines.push(``)
    lines.push(`${debt.debtOrder}. **${debt.label}** (${DEBT_TYPE_NAMES[debt.debtType]})`)
    if (debt.lenderName) lines.push(`   Acreedor: ${debt.lenderName}`)
    lines.push(`   Saldo restante: ${clp(debt.remainingBalance)}`)
    if (debt.monthlyInterestRate != null) {
      lines.push(`   Tasa mensual: ${debt.monthlyInterestRate}%`)
    } else {
      lines.push(`   Tasa mensual: sin interés`)
    }
    lines.push(`   Pago mínimo: ${clp(debt.minimumPayment)}`)
    lines.push(`   Interés mensual: ${clp(debt.monthlyInterestCost)}`)
    lines.push(`   Vencimiento: día ${debt.paymentDueDay}`)
    if (statusFlags.length > 0) lines.push(`   Estado: ${statusFlags.join(' | ')}`)
  }

  return lines.join('\n')
}

// Section 3: algorithm analysis
function buildSection3(
  debts: DebtForPrompt[],
  strategy: StrategyType,
  summary: PlanSummaryForPrompt
): string {
  const lines: string[] = [
    '## Análisis previo del algoritmo',
    '',
    `**Estrategia seleccionada:** ${STRATEGY_NAMES[strategy]}`,
    '',
    '**Orden de prioridad de pagos:**',
  ]

  const sorted = [...debts].sort((a, b) => a.debtOrder - b.debtOrder)
  for (const d of sorted) {
    lines.push(`${d.debtOrder}. ${d.label} — score: ${d.priorityScore.toFixed(2)}`)
  }

  lines.push('')
  lines.push('**Plan de pagos mes a mes:**')

  const HORIZON = 24
  const actions = summary.planActions
  const shown = actions.slice(0, HORIZON)
  for (const a of shown) {
    const extra = a.extraPayment > 0 ? ` + excedente: ${clp(a.extraPayment)}` : ''
    lines.push(
      `[Mes ${a.monthOffset}]: pagar ${clp(a.paymentAmount)} a ${a.debtLabel} (mínimo: ${clp(a.minimumPayment)}${extra})`
    )
  }
  if (actions.length > HORIZON) {
    lines.push(`... y ${actions.length - HORIZON} meses más`)
  }

  lines.push('')
  lines.push('**Métricas del plan:**')
  lines.push(`- Total de intereses con este plan: ${clp(summary.totalInterestProjected)}`)
  lines.push(`- Total de intereses pagando solo mínimos: ${clp(summary.totalInterestNoPlan)}`)
  lines.push(`- Ahorro total: ${clp(summary.totalSavings)}`)
  lines.push(`- Fecha estimada de libertad financiera: ${summary.estimatedPayoffDate.toLocaleDateString('es-CL')}`)
  lines.push(`- Duración del plan: ${summary.totalMonths} meses`)

  return lines.join('\n')
}

// Section 4: output directive
function buildSection4(): string {
  return `## Directiva de output

Responde ÚNICAMENTE con JSON válido. No escribas nada antes ni después del JSON.

La estructura debe ser exactamente:
{
  "summary": "Diagnóstico honesto de la situación en 1–3 oraciones",
  "strategy_rationale": "Por qué esta estrategia es correcta para este caso, 1–3 oraciones",
  "monthly_focus": "Qué debe hacer el usuario este mes, 1 oración concreta con montos reales",
  "key_milestones": [
    { "month": 3, "event": "Nombre de evento", "message": "Mensaje motivador" }
  ],
  "critical_alerts": ["Alerta si hay deuda crítica — describe el problema y da una acción concreta"],
  "free_date_message": "Fecha de libertad financiera en lenguaje natural y motivador"
}

Reglas:
- 1 deuda liquidada = 1 milestone en key_milestones (usa los meses exactos del plan)
- free_date_message en lenguaje natural y motivador
- Si hay critical_alerts, menciona el problema y da una acción concreta
- Nunca inventes montos ni fechas fuera de los calculados
- critical_alerts puede ser array vacío si no hay alertas`
}

// Section 5: few-shot example
function buildSection5(): string {
  return `## Ejemplo de output esperado

\`\`\`json
{
  "summary": "Tu situación es desafiante pero manejable. Tienes 3 deudas activas con un saldo total de $4.200.000 y pagas $67.000 en intereses cada mes. Con la estrategia Avalancha podrías ahorrar $312.000 en intereses totales.",
  "strategy_rationale": "Elegiste la estrategia Avalancha porque atacamos primero la deuda con mayor tasa de interés. Esto minimiza el total de intereses pagados a largo plazo.",
  "monthly_focus": "Este mes, prioriza pagar $250.000 a tu Tarjeta Visa BCI — es la deuda más cara y necesita toda la atención disponible.",
  "key_milestones": [
    { "month": 8, "event": "Tarjeta Visa BCI liquidada", "message": "¡Eliminaste tu deuda más costosa! El dinero que pagabas ahí ahora acelera las demás." },
    { "month": 18, "event": "Todas las deudas liquidadas", "message": "¡Libertad financiera! 18 meses de disciplina que cambian tu vida." }
  ],
  "critical_alerts": [],
  "free_date_message": "A este ritmo, estarás completamente libre de deudas en septiembre de 2027 — solo 18 meses desde hoy."
}
\`\`\``
}

// Rule 13: format amounts as $X.XXX (CLP, no decimals)
function clp(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-CL')}`
}
