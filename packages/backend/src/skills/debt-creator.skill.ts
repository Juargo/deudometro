import type { Debt, Prisma } from '@prisma/client';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import { DomainError, INVALID_INTEREST_RATE } from '../shared/errors';

export interface CreateDebtSkillInput {
  financialSpaceId: string;
  createdByUserId: string;
  label: string;
  debtType: 'credit_card' | 'consumer_loan' | 'mortgage' | 'informal_lender';
  lenderName: string;
  balance: Prisma.Decimal;
  monthlyInterestRate: Prisma.Decimal;
  minimumPayment: Prisma.Decimal;
  paymentDueDay: number;
  cutoffDay?: number;
  isShared: boolean;
  metadata?: Prisma.InputJsonValue;
}

export class DebtCreatorSkill {
  constructor(private readonly debtRepo: IDebtRepository) {}

  async create(input: CreateDebtSkillInput): Promise<Debt> {
    const zero = new (input.monthlyInterestRate.constructor as { new(v: number): Prisma.Decimal })(0);

    if (input.debtType === 'informal_lender') {
      // informal_lender: rate must be 0 (zero-interest)
      if (!input.monthlyInterestRate.equals(zero)) {
        throw new DomainError(
          INVALID_INTEREST_RATE,
          422,
          'Informal lender debts must have a zero interest rate'
        );
      }
    } else {
      // All other types must have a rate > 0
      if (!input.monthlyInterestRate.greaterThan(zero)) {
        throw new DomainError(
          INVALID_INTEREST_RATE,
          422,
          'Interest rate must be greater than zero for this debt type'
        );
      }
    }

    // cutoffDay only applies to credit cards
    const cutoffDay = input.debtType === 'credit_card' ? input.cutoffDay : undefined;

    return this.debtRepo.create({
      financialSpaceId: input.financialSpaceId,
      createdByUserId: input.createdByUserId,
      label: input.label,
      debtType: input.debtType,
      lenderName: input.lenderName,
      originalBalance: input.balance,
      remainingBalance: input.balance,
      monthlyInterestRate: input.monthlyInterestRate,
      minimumPayment: input.minimumPayment,
      paymentDueDay: input.paymentDueDay,
      cutoffDay,
      isShared: input.isShared,
      metadata: input.metadata,
    });
  }
}
