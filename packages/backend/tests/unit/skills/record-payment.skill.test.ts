import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordPaymentSkill } from '../../../src/skills/record-payment.skill';
import {
  DomainError,
  DEBT_ALREADY_PAID,
  PAYMENT_EXCEEDS_BALANCE,
  INVALID_PAYMENT_AMOUNT,
} from '../../../src/shared/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { makeDebt, makePayment, makeMilestone } from './helpers';

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

const mockMilestoneRepo = {
  create: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  findByTypeAndScope: vi.fn(),
  acknowledgeById: vi.fn(),
};

const mockMilestoneDetector = {
  detect: vi.fn(),
};

// prisma.$transaction executes callback immediately with an empty tx object
const mockPrisma = {
  $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb({})),
};

describe('RecordPaymentSkill', () => {
  let skill: RecordPaymentSkill;

  const baseInput = {
    financialSpaceId: 'space-1',
    recordedByUserId: 'user-1',
    debtId: 'debt-1',
    amount: 50000,
    idempotencyKey: 'idem-key-1',
  };

  const activeDebt = makeDebt({
    id: 'debt-1',
    financialSpaceId: 'space-1',
    remainingBalance: new Decimal('800000'),
    originalBalance: new Decimal('1000000'),
    monthlyInterestRate: new Decimal('3.5'),
    status: 'active',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new RecordPaymentSkill(
      mockPrisma as any,
      mockPaymentRepo as any,
      mockDebtRepo as any,
      mockMilestoneRepo as any,
      mockMilestoneDetector as any
    );
  });

  it('creates payment and updates debt balance in transaction', async () => {
    const payment = makePayment({ amount: new Decimal('50000') });
    const updatedDebt = makeDebt({ remainingBalance: new Decimal('750000') });

    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(activeDebt);
    mockPaymentRepo.create.mockResolvedValue(payment);
    mockDebtRepo.updateBalance.mockResolvedValue(updatedDebt);
    mockMilestoneDetector.detect.mockResolvedValue([]);

    const result = await skill.record(baseInput);

    expect(result.payment).toEqual(payment);
    expect(result.debt).toEqual(updatedDebt);
    expect(result.milestones).toEqual([]);
    expect(mockPaymentRepo.create).toHaveBeenCalledOnce();
    expect(mockDebtRepo.updateBalance).toHaveBeenCalledOnce();
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });

  it('returns existing payment on duplicate idempotencyKey without new writes', async () => {
    const existingPayment = makePayment({ idempotencyKey: 'idem-key-1' });
    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(existingPayment);
    mockDebtRepo.findById.mockResolvedValue(activeDebt);

    const result = await skill.record(baseInput);

    expect(result.payment).toEqual(existingPayment);
    expect(result.milestones).toEqual([]);
    expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    expect(mockDebtRepo.updateBalance).not.toHaveBeenCalled();
  });

  it('throws DEBT_ALREADY_PAID for paid_off debt', async () => {
    const paidDebt = makeDebt({ id: 'debt-1', financialSpaceId: 'space-1', status: 'paid_off' });
    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(paidDebt);

    await expect(skill.record(baseInput)).rejects.toMatchObject({
      code: DEBT_ALREADY_PAID,
      httpStatus: 422,
    });
  });

  it('throws PAYMENT_EXCEEDS_BALANCE when amount > remainingBalance', async () => {
    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(activeDebt);

    await expect(
      skill.record({ ...baseInput, amount: 900000 }) // remainingBalance is 800000
    ).rejects.toMatchObject({
      code: PAYMENT_EXCEEDS_BALANCE,
      httpStatus: 422,
    });
  });

  it('throws INVALID_PAYMENT_AMOUNT when amount <= 0', async () => {
    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(activeDebt);

    await expect(
      skill.record({ ...baseInput, amount: 0 })
    ).rejects.toMatchObject({
      code: INVALID_PAYMENT_AMOUNT,
      httpStatus: 422,
    });

    await expect(
      skill.record({ ...baseInput, amount: -100 })
    ).rejects.toMatchObject({
      code: INVALID_PAYMENT_AMOUNT,
      httpStatus: 422,
    });
  });

  it('principalAmount + interestAmount equals total payment amount', async () => {
    const payment = makePayment({ amount: new Decimal('50000') });
    const updatedDebt = makeDebt({ remainingBalance: new Decimal('750000') });

    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(activeDebt);
    mockPaymentRepo.create.mockResolvedValue(payment);
    mockDebtRepo.updateBalance.mockResolvedValue(updatedDebt);
    mockMilestoneDetector.detect.mockResolvedValue([]);

    await skill.record(baseInput);

    const createCall = mockPaymentRepo.create.mock.calls[0][0];
    const principal: Decimal = createCall.principalAmount;
    const interest: Decimal = createCall.interestAmount;
    const total: Decimal = createCall.amount;

    expect(principal.add(interest).equals(total)).toBe(true);
  });

  it('sets debt status to paid_off when payment brings balance to 0', async () => {
    const almostPaidDebt = makeDebt({
      id: 'debt-1',
      financialSpaceId: 'space-1',
      remainingBalance: new Decimal('50000'),
      originalBalance: new Decimal('1000000'),
      monthlyInterestRate: new Decimal('0'), // zero interest for simplicity
      status: 'active',
    });

    const payment = makePayment({ amount: new Decimal('50000') });
    const paidOffDebt = makeDebt({ remainingBalance: new Decimal('0'), status: 'paid_off' });

    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(almostPaidDebt);
    mockPaymentRepo.create.mockResolvedValue(payment);
    mockDebtRepo.updateBalance.mockResolvedValue(paidOffDebt);
    mockMilestoneDetector.detect.mockResolvedValue([]);

    const result = await skill.record({ ...baseInput, amount: 50000 });

    expect(mockDebtRepo.updateBalance).toHaveBeenCalledWith(
      'debt-1',
      expect.objectContaining({ equals: expect.any(Function) }),
      'paid_off',
      expect.anything()
    );
    expect(result.debt.status).toBe('paid_off');
  });

  it('returns milestones from detector in result', async () => {
    const payment = makePayment();
    const updatedDebt = makeDebt({ remainingBalance: new Decimal('750000') });
    const milestone = makeMilestone({ milestoneType: 'first_payment' });

    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(activeDebt);
    mockPaymentRepo.create.mockResolvedValue(payment);
    mockDebtRepo.updateBalance.mockResolvedValue(updatedDebt);
    mockMilestoneDetector.detect.mockResolvedValue([
      { financialSpaceId: 'space-1', milestoneType: 'first_payment', message: 'First payment!' },
    ]);
    mockMilestoneRepo.create.mockResolvedValue(milestone);

    const result = await skill.record(baseInput);

    expect(result.milestones).toHaveLength(1);
    expect(result.milestones[0]).toEqual(milestone);
    expect(mockMilestoneRepo.create).toHaveBeenCalledOnce();
  });

  it('returns empty milestones array when none triggered', async () => {
    const payment = makePayment();
    const updatedDebt = makeDebt({ remainingBalance: new Decimal('750000') });

    mockPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockDebtRepo.findById.mockResolvedValue(activeDebt);
    mockPaymentRepo.create.mockResolvedValue(payment);
    mockDebtRepo.updateBalance.mockResolvedValue(updatedDebt);
    mockMilestoneDetector.detect.mockResolvedValue([]);

    const result = await skill.record(baseInput);

    expect(result.milestones).toEqual([]);
    expect(mockMilestoneRepo.create).not.toHaveBeenCalled();
  });
});
