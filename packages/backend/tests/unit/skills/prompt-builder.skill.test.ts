import { describe, it, expect, beforeEach } from 'vitest';
import { PromptBuilderSkill } from '../../../src/skills/prompt-builder.skill';
import type { PromptBuilderInput } from '../../../src/skills/prompt-builder.skill';
import type { SortedDebt } from '../../../src/skills/strategy-sorter.skill';
import type { CreatePlanActionInput } from '../../../src/repositories/interfaces/plan-action.repository';
import { Decimal } from '@prisma/client/runtime/library';

function makeSortedDebt(overrides: Partial<SortedDebt> = {}): SortedDebt {
  return {
    id: 'debt-1',
    label: 'Tarjeta BCI',
    debtType: 'credit_card',
    remainingBalance: new Decimal('800000'),
    monthlyInterestRate: new Decimal('3.5'),
    minimumPayment: new Decimal('25000'),
    isCritical: false,
    attackOrder: 1,
    ...overrides,
  };
}

function makeAction(overrides: Partial<CreatePlanActionInput> = {}): CreatePlanActionInput {
  return {
    debtPlanId: 'plan-1',
    debtId: 'debt-1',
    debtLabel: 'Tarjeta BCI',
    debtType: 'credit_card',
    month: 1,
    paymentAmount: new Decimal('50000'),
    principalAmount: new Decimal('22000'),
    interestAmount: new Decimal('28000'),
    runningBalance: new Decimal('750000'),
    ...overrides,
  };
}

function makeInput(overrides: Partial<PromptBuilderInput> = {}): PromptBuilderInput {
  return {
    monthlyIncome: new Decimal('2000000'),
    availableCapital: new Decimal('0'),
    totalFixedCosts: new Decimal('500000'),
    reservePercentage: new Decimal('10'),
    monthlyBudget: new Decimal('300000'),
    strategy: 'avalanche',
    sortedDebts: [makeSortedDebt()],
    actions: [makeAction()],
    totalInterestPaid: new Decimal('1500000'),
    financialFreedomDate: new Date('2027-06-01'),
    ...overrides,
  };
}

describe('PromptBuilderSkill', () => {
  let skill: PromptBuilderSkill;

  beforeEach(() => {
    skill = new PromptBuilderSkill();
  });

  it('output contains all 5 section headers (ROL, CONTEXTO, ANÁLISIS, DIRECTIVA, EJEMPLO)', () => {
    const { userPrompt } = skill.build(makeInput());

    expect(userPrompt).toContain('## ROL');
    expect(userPrompt).toContain('## CONTEXTO');
    expect(userPrompt).toContain('## ANÁLISIS');
    expect(userPrompt).toContain('## DIRECTIVA');
    expect(userPrompt).toContain('## EJEMPLO');
  });

  it('system prompt contains JSON-only instruction', () => {
    const { systemPrompt } = skill.build(makeInput());

    expect(systemPrompt).toContain('JSON');
    // Must instruct to not include extra text/markdown
    expect(systemPrompt.toLowerCase()).toMatch(/sin texto adicional|únicamente|only/i);
  });

  it('monetary values include formatted amounts (Intl.NumberFormat es-CL)', () => {
    const { userPrompt } = skill.build(makeInput());

    // es-CL locale formats CLP with $ symbol and dots as thousands separator
    expect(userPrompt).toContain('$');
    // Income value 2.000.000 should appear formatted
    expect(userPrompt).toMatch(/\$\s*[\d.]+/);
  });

  it('EJEMPLO section contains valid JSON (JSON.parse does not throw)', () => {
    const { userPrompt } = skill.build(makeInput());

    const ejemploIdx = userPrompt.indexOf('## EJEMPLO');
    expect(ejemploIdx).toBeGreaterThan(-1);

    const ejemploContent = userPrompt.slice(ejemploIdx + '## EJEMPLO'.length).trim();

    // Should not throw
    expect(() => JSON.parse(ejemploContent)).not.toThrow();
  });

  it('no identifying info in output (no email, no userId patterns)', () => {
    const { userPrompt, systemPrompt } = skill.build(makeInput());
    const combined = userPrompt + systemPrompt;

    // No email patterns
    expect(combined).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    // No userId patterns (e.g. user-1, profile-1, space-1)
    expect(combined).not.toContain('user-1');
    expect(combined).not.toContain('profile-1');
    expect(combined).not.toContain('space-1');
  });
});
