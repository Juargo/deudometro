import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanPersisterSkill } from '../../../src/skills/plan-persister.skill';
import { DomainError, PLAN_GENERATION_FAILED } from '../../../src/shared/errors';
import { makeDebtPlan } from './helpers';
import { Decimal } from '@prisma/client/runtime/library';
import type { PlanPersisterInput } from '../../../src/skills/plan-persister.skill';

// Mock Prisma namespace for DbNull
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>();
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      DbNull: 'DbNull',
    },
  };
});

const mockDebtPlanRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findActiveBySpaceId: vi.fn(),
  findAllBySpaceId: vi.fn(),
  supersedePreviousPlans: vi.fn(),
  updateAiAnalysis: vi.fn(),
};

const mockPlanActionRepo = {
  createMany: vi.fn(),
  findByPlanId: vi.fn(),
};

// Simulated prisma.$transaction that executes the callback with the same repos acting as tx
const mockPrisma = {
  $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
    return fn(mockPrisma as any);
  }),
};

function makePersisterInput(overrides: Partial<PlanPersisterInput> = {}): PlanPersisterInput {
  return {
    financialSpaceId: 'space-1',
    createdByUserId: 'user-1',
    strategyType: 'avalanche',
    monthlyIncomeSnapshot: new Decimal('2000000'),
    availableCapitalSnapshot: new Decimal('0'),
    totalFixedCostsSnapshot: new Decimal('500000'),
    reservePercentage: new Decimal('10'),
    monthlyBudget: new Decimal('300000'),
    aiAnalysis: null,
    aiPrompt: { systemPrompt: 'sys', userPrompt: 'usr' },
    actions: [
      {
        debtId: 'debt-1',
        debtLabel: 'Tarjeta BCI',
        debtType: 'credit_card',
        month: 1,
        paymentAmount: new Decimal('50000'),
        principalAmount: new Decimal('22000'),
        interestAmount: new Decimal('28000'),
        runningBalance: new Decimal('750000'),
      },
    ],
    ...overrides,
  };
}

describe('PlanPersisterSkill', () => {
  let skill: PlanPersisterSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new PlanPersisterSkill(
      mockPrisma as any,
      mockDebtPlanRepo as any,
      mockPlanActionRepo as any
    );
  });

  it('calls supersedePreviousPlans → create → createMany in transaction order', async () => {
    const plan = makeDebtPlan();
    mockDebtPlanRepo.create.mockResolvedValue(plan);
    mockPlanActionRepo.createMany.mockResolvedValue(undefined);

    const callOrder: string[] = [];
    mockDebtPlanRepo.supersedePreviousPlans.mockImplementation(async () => {
      callOrder.push('supersede');
    });
    mockDebtPlanRepo.create.mockImplementation(async () => {
      callOrder.push('create');
      return plan;
    });
    mockPlanActionRepo.createMany.mockImplementation(async () => {
      callOrder.push('createMany');
    });

    const result = await skill.persist(makePersisterInput());

    expect(callOrder).toEqual(['supersede', 'create', 'createMany']);
    expect(result.plan).toEqual(plan);
    expect(result.actionsCount).toBe(1);
  });

  it('supersedes plans for the correct financialSpaceId', async () => {
    const plan = makeDebtPlan();
    mockDebtPlanRepo.create.mockResolvedValue(plan);
    mockPlanActionRepo.createMany.mockResolvedValue(undefined);

    await skill.persist(makePersisterInput({ financialSpaceId: 'space-42' }));

    expect(mockDebtPlanRepo.supersedePreviousPlans).toHaveBeenCalledWith('space-42', expect.anything());
  });

  it('createMany receives actions mapped with plan.id', async () => {
    const plan = makeDebtPlan({ id: 'new-plan-id' });
    mockDebtPlanRepo.create.mockResolvedValue(plan);
    mockPlanActionRepo.createMany.mockResolvedValue(undefined);

    await skill.persist(makePersisterInput());

    expect(mockPlanActionRepo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ debtPlanId: 'new-plan-id', debtId: 'debt-1' }),
      ]),
      expect.anything()
    );
  });

  it('throws PLAN_GENERATION_FAILED when transaction throws a non-DomainError', async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error('DB connection failed'));

    await expect(skill.persist(makePersisterInput())).rejects.toMatchObject({
      code: PLAN_GENERATION_FAILED,
      httpStatus: 500,
    });
  });

  it('re-throws DomainError without wrapping', async () => {
    const domainErr = new DomainError('SOME_CODE', 422, 'Some error');
    mockPrisma.$transaction.mockRejectedValue(domainErr);

    await expect(skill.persist(makePersisterInput())).rejects.toThrow(domainErr);
  });
});
