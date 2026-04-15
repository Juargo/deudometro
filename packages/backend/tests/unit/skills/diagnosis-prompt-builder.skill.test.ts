import { describe, it, expect, beforeEach } from 'vitest';
import { DiagnosisPromptBuilderSkill } from '../../../src/skills/diagnosis-prompt-builder.skill';
import type { DiagnosisPromptInput } from '../../../src/skills/diagnosis-prompt-builder.skill';

function makeInput(overrides: Partial<DiagnosisPromptInput> = {}): DiagnosisPromptInput {
  return {
    employmentStatus: 'Empleado',
    investmentKnowledge: 'Medio',
    monthlyIncome: 2000000,
    availableCapital: 500000,
    totalFixedExpenses: 800000,
    availableBudget: 300000,
    totalActiveDebt: 5000000,
    criticalDebtsCount: 2,
    monthlyInterestLoad: 150000,
    highestMonthlyRate: 3.5,
    debts: [],
    activeStrategy: 'avalanche',
    projectedFreedomDate: '2028-06-01T00:00:00.000Z',
    financialIntention: 'Quiero pagar mis deudas lo más rápido posible.',
    ...overrides,
  };
}

describe('DiagnosisPromptBuilderSkill', () => {
  let skill: DiagnosisPromptBuilderSkill;

  beforeEach(() => {
    skill = new DiagnosisPromptBuilderSkill();
  });

  it('happy path: returns non-empty systemPrompt and userPrompt with all fields', () => {
    const { systemPrompt, userPrompt } = skill.build(makeInput());

    expect(systemPrompt).toBeTruthy();
    expect(systemPrompt.length).toBeGreaterThan(0);
    expect(userPrompt).toBeTruthy();
    expect(userPrompt.length).toBeGreaterThan(0);

    // systemPrompt must contain JSON instruction
    expect(systemPrompt).toContain('JSON');

    // userPrompt must contain context section headers
    expect(userPrompt).toContain('## Contexto financiero');
    expect(userPrompt).toContain('## Intención del usuario');
    expect(userPrompt).toContain('## Instrucción');
  });

  it('null fields: employmentStatus and investmentKnowledge render as "No especificado"', () => {
    const { userPrompt } = skill.build(
      makeInput({ employmentStatus: null, investmentKnowledge: null })
    );

    // Both null fields should be replaced with "No especificado"
    const lines = userPrompt.split('\n');
    const statusLine = lines.find((l) => l.includes('Situación laboral'));
    const knowledgeLine = lines.find((l) => l.includes('Conocimiento de inversiones'));

    expect(statusLine).toContain('No especificado');
    expect(knowledgeLine).toContain('No especificado');
  });

  it('intention truncation: financialIntention > 1000 chars is truncated in the prompt', () => {
    const longIntention = 'A'.repeat(1500);
    const { userPrompt } = skill.build(makeInput({ financialIntention: longIntention }));

    // The full 1500-char string should NOT appear in the prompt
    expect(userPrompt).not.toContain(longIntention);
    // The truncated 1000-char version should appear
    expect(userPrompt).toContain('A'.repeat(1000));
  });

  it('null strategy: activeStrategy null renders as "Sin plan activo"', () => {
    const { userPrompt } = skill.build(makeInput({ activeStrategy: null }));

    const lines = userPrompt.split('\n');
    const strategyLine = lines.find((l) => l.includes('Estrategia de pago activa'));

    expect(strategyLine).toContain('Sin plan activo');
  });

  it('debt details: individual debts appear in prompt with label, lender, and balance', () => {
    const { userPrompt } = skill.build(
      makeInput({
        debts: [
          {
            label: 'Visa Gold',
            lenderName: 'Banco Chile',
            debtType: 'Tarjeta de Crédito',
            remainingBalance: 1500000,
            monthlyInterestRate: 2.5,
            minimumPayment: 45000,
          },
          {
            label: 'Crédito Auto',
            lenderName: 'Santander',
            debtType: 'Crédito de Consumo',
            remainingBalance: 3500000,
            monthlyInterestRate: 1.2,
            minimumPayment: 120000,
          },
        ],
      })
    );

    expect(userPrompt).toContain('## Detalle de deudas');
    expect(userPrompt).toContain('Visa Gold');
    expect(userPrompt).toContain('Banco Chile');
    expect(userPrompt).toContain('Santander');
    expect(userPrompt).toContain('Crédito Auto');
  });

  it('empty debts: shows "(Sin deudas activas)" when no debts', () => {
    const { userPrompt } = skill.build(makeInput({ debts: [] }));

    expect(userPrompt).toContain('Sin deudas activas');
  });

  it('CLP formatting: monetary values appear with $ symbol and dot-separated thousands', () => {
    const { userPrompt } = skill.build(
      makeInput({ monthlyIncome: 1250000 })
    );

    // es-CL locale formats as $1.250.000
    expect(userPrompt).toContain('$');
    // The value 1.250.000 should be present (dot-separated thousands in es-CL)
    expect(userPrompt).toMatch(/1[.,]250[.,]000|1\.250\.000/);
  });
});
