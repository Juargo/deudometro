export interface DiagnosisPromptInput {
  // Profile
  employmentStatus: string | null; // 'Empleado' | 'Independiente' | 'Cesante' | null
  investmentKnowledge: string | null; // 'Alto' | 'Medio' | 'Bajo' | null
  monthlyIncome: number;
  availableCapital: number;
  totalFixedExpenses: number;
  availableBudget: number;

  // Debts
  totalActiveDebt: number;
  criticalDebtsCount: number;
  monthlyInterestLoad: number;
  highestMonthlyRate: number;

  // Plan
  activeStrategy: string | null; // e.g. 'avalanche', 'snowball', or null
  projectedFreedomDate: string | null; // ISO date string or null

  // User input
  financialIntention: string;
}

const MAX_INTENTION_LENGTH = 1000;

function formatCLP(value: number): string {
  return (
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value) + ' CLP'
  );
}

function orUnspecified(value: string | null): string {
  return value ?? 'No especificado';
}

export class DiagnosisPromptBuilderSkill {
  build(input: DiagnosisPromptInput): { systemPrompt: string; userPrompt: string } {
    const {
      employmentStatus,
      investmentKnowledge,
      monthlyIncome,
      availableCapital,
      totalFixedExpenses,
      availableBudget,
      totalActiveDebt,
      criticalDebtsCount,
      monthlyInterestLoad,
      highestMonthlyRate,
      activeStrategy,
      projectedFreedomDate,
      financialIntention,
    } = input;

    const systemPrompt =
      'Eres un asesor financiero experto en el mercado chileno. ' +
      'Tu tarea es generar un diagnóstico financiero personalizado en español, claro y sin tecnicismos. ' +
      'Debes devolver EXACTAMENTE 3 enfoques genuinamente distintos entre sí. ' +
      'Usa lenguaje simple y accesible, evita jerga técnica. ' +
      'Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código. ' +
      'El JSON debe tener exactamente esta estructura: ' +
      '{ "diagnosis": string, "approaches": [{ "title": string, "rationale": string, "description": string, "first_steps": string[] }] } ' +
      'donde "approaches" contiene exactamente 3 elementos.';

    const strategyLabel = activeStrategy ?? 'Sin plan activo';
    const freedomDateLabel = projectedFreedomDate ?? 'No disponible';
    const truncatedIntention = financialIntention.slice(0, MAX_INTENTION_LENGTH);

    const userPrompt =
      `## Contexto financiero\n` +
      `- Situación laboral: ${orUnspecified(employmentStatus)}\n` +
      `- Conocimiento de inversiones: ${orUnspecified(investmentKnowledge)}\n` +
      `- Ingreso mensual: ${formatCLP(monthlyIncome)}\n` +
      `- Capital disponible: ${formatCLP(availableCapital)}\n` +
      `- Gastos fijos mensuales: ${formatCLP(totalFixedExpenses)}\n` +
      `- Presupuesto disponible para deudas: ${formatCLP(availableBudget)}\n` +
      `- Deuda total activa: ${formatCLP(totalActiveDebt)}\n` +
      `- Número de deudas críticas: ${criticalDebtsCount}\n` +
      `- Carga de intereses mensual: ${formatCLP(monthlyInterestLoad)}\n` +
      `- Tasa mensual más alta: ${highestMonthlyRate.toFixed(4)}%\n` +
      `- Estrategia de pago activa: ${strategyLabel}\n` +
      `- Fecha proyectada de libertad financiera: ${freedomDateLabel}\n` +
      `\n## Intención del usuario\n` +
      `${truncatedIntention}\n` +
      `\n## Instrucción\n` +
      `Con base en el contexto financiero y en lo que la persona tiene pensado hacer, genera un diagnóstico claro ` +
      `de su situación actual y 3 enfoques distintos que podría seguir para mejorarla. ` +
      `Cada enfoque debe tener un título descriptivo, el fundamento de por qué tiene sentido para esta persona, ` +
      `una descripción de cómo funciona, y los primeros pasos concretos para comenzar.`;

    return { systemPrompt, userPrompt };
  }
}
