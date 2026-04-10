import { Decimal } from '@prisma/client/runtime/library';
import type { SortedDebt } from './strategy-sorter.skill';
import type { CreatePlanActionInput } from '../repositories/interfaces/plan-action.repository';

export type PromptStrategy = 'avalanche' | 'snowball' | 'hybrid' | 'crisis_first' | 'guided_consolidation';

export interface PromptBuilderInput {
  monthlyIncome: Decimal;
  availableCapital: Decimal;
  totalFixedCosts: Decimal;
  reservePercentage: Decimal;
  monthlyBudget: Decimal;
  strategy: PromptStrategy;
  sortedDebts: SortedDebt[];
  actions: CreatePlanActionInput[];
  totalInterestPaid: Decimal;
  financialFreedomDate: Date;
}

const STRATEGY_NAMES: Record<PromptStrategy, string> = {
  avalanche: 'Avalancha (mayor tasa primero)',
  snowball: 'Bola de nieve (menor saldo primero)',
  hybrid: 'Híbrida (tasa + saldo ponderados)',
  crisis_first: 'Crisis primero (deudas críticas primero)',
  guided_consolidation: 'Consolidación guiada',
};

function formatCLP(value: Decimal): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(
    value.toNumber()
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', { year: 'numeric', month: 'long' }).format(date);
}

export class PromptBuilderSkill {
  build(input: PromptBuilderInput): { systemPrompt: string; userPrompt: string } {
    const {
      monthlyIncome,
      availableCapital,
      totalFixedCosts,
      reservePercentage,
      monthlyBudget,
      strategy,
      sortedDebts,
      actions,
      totalInterestPaid,
      financialFreedomDate,
    } = input;

    const systemPrompt =
      'Eres un asesor financiero experto en deudas del mercado latinoamericano, especializado en Chile. ' +
      'Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código.';

    // Build debt table rows
    const debtTableRows = sortedDebts
      .map(
        (d, i) =>
          `${i + 1}. ${d.label} | ${d.debtType} | ${formatCLP(d.remainingBalance)} | ` +
          `${d.monthlyInterestRate.toFixed(4)}% | ${formatCLP(d.minimumPayment)} | ${d.isCritical ? 'Sí' : 'No'}`
      )
      .join('\n');

    // Build first 24 months projection table (one row per debt per month, up to month 24)
    const first24Actions = actions.filter((a) => a.month <= 24);
    const projectionRows = first24Actions
      .map(
        (a) =>
          `Mes ${a.month} | ${a.debtLabel} | ${formatCLP(a.paymentAmount)} | ${formatCLP(a.runningBalance)}`
      )
      .join('\n');

    const exampleJson = JSON.stringify(
      {
        summary: 'Resumen ejecutivo de 2-3 oraciones sobre la situación financiera.',
        strategy_rationale: 'Por qué esta estrategia es la mejor para esta situación.',
        monthly_focus: 'Qué hacer este mes específicamente.',
        key_milestones: [
          { month: 6, event: 'deuda_pagada', message: 'Mensaje motivacional sobre el hito.' },
        ],
        critical_alerts: ['Alerta sobre deuda crítica si aplica.'],
        free_date_message: 'Mensaje motivacional sobre la fecha de libertad financiera.',
      },
      null,
      2
    );

    const userPrompt = `## ROL
Analiza la situación financiera y genera un plan de acción personalizado en español chileno coloquial pero profesional.

## CONTEXTO
- Ingreso mensual: ${formatCLP(monthlyIncome)}
- Capital disponible: ${formatCLP(availableCapital)}
- Gastos fijos mensuales: ${formatCLP(totalFixedCosts)}
- Porcentaje de reserva: ${reservePercentage.toFixed(2)}%
- Presupuesto disponible para deudas: ${formatCLP(monthlyBudget)}
- Estrategia seleccionada: ${STRATEGY_NAMES[strategy]}

## ANÁLISIS
Deudas (orden de ataque):
# | Nombre | Tipo | Saldo | Tasa Mensual | Pago Mínimo | ¿Crítica?
${debtTableRows}

Proyección primeros 24 meses:
Mes | Deuda | Pago | Saldo Restante
${projectionRows}

Total de intereses proyectados: ${formatCLP(totalInterestPaid)}
Fecha estimada de libertad financiera: ${formatDate(financialFreedomDate)}

## DIRECTIVA
Genera un JSON con exactamente estos campos:
- "summary": Resumen ejecutivo (2-3 oraciones)
- "strategy_rationale": Por qué esta estrategia es la mejor para esta situación
- "monthly_focus": Qué hacer este mes específicamente
- "key_milestones": Array de hitos [{month, event, message}]
- "critical_alerts": Array de alertas sobre deudas críticas (puede estar vacío)
- "free_date_message": Mensaje motivacional sobre la fecha de libertad financiera

## EJEMPLO
${exampleJson}`;

    return { systemPrompt, userPrompt };
  }
}
