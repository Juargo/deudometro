import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtCreatorSkill } from '../../../src/skills/debt-creator.skill';
import { DomainError, INVALID_INTEREST_RATE } from '../../../src/shared/errors';
import { makeDebt } from './helpers';
import { Decimal } from '@prisma/client/runtime/library';

const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  updateShared: vi.fn(),
};

describe('DebtCreatorSkill', () => {
  let skill: DebtCreatorSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new DebtCreatorSkill(mockDebtRepo);
  });

  it('creates credit_card debt with rate > 0', async () => {
    const debt = makeDebt({ debtType: 'credit_card' });
    mockDebtRepo.create.mockResolvedValue(debt);

    const result = await skill.create({
      financialSpaceId: 'space-1',
      createdByUserId: 'user-1',
      label: 'Tarjeta BCI',
      debtType: 'credit_card',
      lenderName: 'BCI',
      balance: new Decimal('1000000'),
      monthlyInterestRate: new Decimal('3.5'),
      minimumPayment: new Decimal('25000'),
      paymentDueDay: 15,
      cutoffDay: 5,
      isShared: false,
    });

    expect(result).toEqual(debt);
    expect(mockDebtRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        originalBalance: new Decimal('1000000'),
        remainingBalance: new Decimal('1000000'),
        cutoffDay: 5,
      })
    );
  });

  it('creates informal_lender with rate=0 (valid)', async () => {
    const debt = makeDebt({ debtType: 'informal_lender', monthlyInterestRate: new Decimal('0'), cutoffDay: null });
    mockDebtRepo.create.mockResolvedValue(debt);

    const result = await skill.create({
      financialSpaceId: 'space-1',
      createdByUserId: 'user-1',
      label: 'Prestamo familiar',
      debtType: 'informal_lender',
      lenderName: 'Familiar',
      balance: new Decimal('500000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('50000'),
      paymentDueDay: 1,
      isShared: false,
    });

    expect(result).toEqual(debt);
  });

  it('rejects informal_lender with rate > 0 (INVALID_INTEREST_RATE)', async () => {
    await expect(
      skill.create({
        financialSpaceId: 'space-1',
        createdByUserId: 'user-1',
        label: 'Prestamo',
        debtType: 'informal_lender',
        lenderName: 'Alguien',
        balance: new Decimal('100000'),
        monthlyInterestRate: new Decimal('2'),
        minimumPayment: new Decimal('10000'),
        paymentDueDay: 1,
        isShared: false,
      })
    ).rejects.toMatchObject({ code: INVALID_INTEREST_RATE, httpStatus: 422 });
  });

  it('rejects credit_card with rate=0 (INVALID_INTEREST_RATE)', async () => {
    await expect(
      skill.create({
        financialSpaceId: 'space-1',
        createdByUserId: 'user-1',
        label: 'Tarjeta',
        debtType: 'credit_card',
        lenderName: 'Banco',
        balance: new Decimal('500000'),
        monthlyInterestRate: new Decimal('0'),
        minimumPayment: new Decimal('20000'),
        paymentDueDay: 15,
        isShared: false,
      })
    ).rejects.toMatchObject({ code: INVALID_INTEREST_RATE, httpStatus: 422 });
  });

  it('sets originalBalance = remainingBalance = balance', async () => {
    const balance = new Decimal('750000');
    const debt = makeDebt({ originalBalance: balance, remainingBalance: balance });
    mockDebtRepo.create.mockResolvedValue(debt);

    await skill.create({
      financialSpaceId: 'space-1',
      createdByUserId: 'user-1',
      label: 'Credito',
      debtType: 'consumer_loan',
      lenderName: 'Banco Estado',
      balance,
      monthlyInterestRate: new Decimal('1.5'),
      minimumPayment: new Decimal('30000'),
      paymentDueDay: 10,
      isShared: false,
    });

    expect(mockDebtRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        originalBalance: balance,
        remainingBalance: balance,
      })
    );
  });

  it('nullifies cutoffDay for non-credit_card debt types', async () => {
    const debt = makeDebt({ debtType: 'consumer_loan', cutoffDay: null });
    mockDebtRepo.create.mockResolvedValue(debt);

    await skill.create({
      financialSpaceId: 'space-1',
      createdByUserId: 'user-1',
      label: 'Credito consumo',
      debtType: 'consumer_loan',
      lenderName: 'CMR',
      balance: new Decimal('200000'),
      monthlyInterestRate: new Decimal('2.0'),
      minimumPayment: new Decimal('15000'),
      paymentDueDay: 5,
      cutoffDay: 1,
      isShared: false,
    });

    expect(mockDebtRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ cutoffDay: undefined })
    );
  });
});
