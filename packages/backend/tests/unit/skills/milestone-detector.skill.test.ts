import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MilestoneDetectorSkill } from '../../../src/skills/milestone-detector.skill';
import { Decimal } from '@prisma/client/runtime/library';
import { makeDebt, makeMilestone } from './helpers';

const mockMilestoneRepo = {
  create: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  findByTypeAndScope: vi.fn(),
  acknowledgeById: vi.fn(),
};

const mockPaymentRepo = {
  create: vi.fn(),
  findByIdempotencyKey: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  findByDebtId: vi.fn(),
  countByFinancialSpaceId: vi.fn(),
};

const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  updateBalance: vi.fn(),
  archive: vi.fn(),
  update: vi.fn(),
  toggleSharing: vi.fn(),
};

describe('MilestoneDetectorSkill', () => {
  let skill: MilestoneDetectorSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new MilestoneDetectorSkill(
      mockMilestoneRepo as any,
      mockPaymentRepo as any,
      mockDebtRepo as any
    );
  });

  const baseInput = {
    financialSpaceId: 'space-1',
    debtId: 'debt-1',
    newBalance: new Decimal('500000'),
  };

  it('returns [] when no milestones triggered', async () => {
    // paymentCount > 1 → no first_payment; newBalance > 0 → no debt_paid_off
    // ratio = 900000/1000000 = 0.9 → above all thresholds → no percentage milestones
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(5);
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ id: 'debt-1', remainingBalance: new Decimal('1000000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect({ ...baseInput, newBalance: new Decimal('900000') });

    expect(result).toEqual([]);
  });

  it('emits first_payment when paymentCount === 1 and no prior milestone', async () => {
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(1);
    mockMilestoneRepo.findByTypeAndScope.mockResolvedValue(null);
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ remainingBalance: new Decimal('800000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect(baseInput);

    const types = result.map((m) => m.milestoneType);
    expect(types).toContain('first_payment');
  });

  it('does NOT emit first_payment when paymentCount > 1', async () => {
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(2);
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ remainingBalance: new Decimal('800000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect(baseInput);

    const types = result.map((m) => m.milestoneType);
    expect(types).not.toContain('first_payment');
  });

  it('does NOT emit first_payment when milestone already exists', async () => {
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(1);
    mockMilestoneRepo.findByTypeAndScope.mockResolvedValue(makeMilestone({ milestoneType: 'first_payment' }));
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ remainingBalance: new Decimal('800000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect(baseInput);

    const types = result.map((m) => m.milestoneType);
    expect(types).not.toContain('first_payment');
  });

  it('emits debt_paid_off when newBalance === 0', async () => {
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(5);
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ id: 'debt-1', remainingBalance: new Decimal('100000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect({ ...baseInput, newBalance: new Decimal('0') });

    const types = result.map((m) => m.milestoneType);
    expect(types).toContain('debt_paid_off');
  });

  it('does NOT emit debt_paid_off when balance is not 0', async () => {
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(5);
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ remainingBalance: new Decimal('500000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect(baseInput);

    const types = result.map((m) => m.milestoneType);
    expect(types).not.toContain('debt_paid_off');
  });

  it('emits total_reduced_25pct when ratio <= 0.75', async () => {
    // debt-1 has originalBalance=1000000; newBalance=750000 → ratio = 750000/1000000 = 0.75 (exactly at threshold)
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(5);
    mockMilestoneRepo.findByTypeAndScope.mockResolvedValue(null);
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ id: 'debt-1', remainingBalance: new Decimal('800000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect({ ...baseInput, newBalance: new Decimal('750000') });

    const types = result.map((m) => m.milestoneType);
    expect(types).toContain('total_reduced_25pct');
  });

  it('does NOT emit percentage milestone when it already exists', async () => {
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(5);
    // Return existing milestone for total_reduced_25pct check
    mockMilestoneRepo.findByTypeAndScope.mockImplementation((_spaceId, type) => {
      if (type === 'total_reduced_25pct') return Promise.resolve(makeMilestone({ milestoneType: 'total_reduced_25pct' }));
      return Promise.resolve(null);
    });
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ id: 'debt-1', remainingBalance: new Decimal('800000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect({ ...baseInput, newBalance: new Decimal('750000') });

    const types = result.map((m) => m.milestoneType);
    expect(types).not.toContain('total_reduced_25pct');
  });

  it('emits total_reduced_50pct when ratio <= 0.50', async () => {
    mockPaymentRepo.countByFinancialSpaceId.mockResolvedValue(5);
    mockMilestoneRepo.findByTypeAndScope.mockResolvedValue(null);
    mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([
      makeDebt({ id: 'debt-1', remainingBalance: new Decimal('600000'), originalBalance: new Decimal('1000000') }),
    ]);

    const result = await skill.detect({ ...baseInput, newBalance: new Decimal('500000') });

    const types = result.map((m) => m.milestoneType);
    // ratio = 500000/1000000 = 0.5 → should emit 25pct and 50pct
    expect(types).toContain('total_reduced_50pct');
    expect(types).toContain('total_reduced_25pct');
  });
});
