import type { Debt, Prisma } from '@prisma/client';
import type { IDebtRepository, UpdateDebtInput } from '../repositories/interfaces/debt.repository';
import {
  DomainError,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
  DEBT_ALREADY_ARCHIVED,
  INVALID_INTEREST_RATE,
} from '../shared/errors';

export interface UpdateDebtSkillInput {
  debtId: string;
  financialSpaceId: string;
  updates: UpdateDebtInput;
}

export class DebtUpdaterSkill {
  constructor(private readonly debtRepo: IDebtRepository) {}

  async update(input: UpdateDebtSkillInput): Promise<Debt> {
    const debt = await this.debtRepo.findById(input.debtId);
    if (!debt) {
      throw new DomainError(DEBT_NOT_FOUND, 404, 'Debt not found');
    }

    if (debt.financialSpaceId !== input.financialSpaceId) {
      throw new DomainError(DEBT_NOT_IN_SPACE, 403, 'Debt does not belong to this financial space');
    }

    if (debt.status !== 'active') {
      throw new DomainError(DEBT_ALREADY_ARCHIVED, 409, 'Cannot update an archived debt');
    }

    if (input.updates.monthlyInterestRate !== undefined) {
      const rate = input.updates.monthlyInterestRate;
      const zero = new (rate.constructor as { new(v: number): Prisma.Decimal })(0);

      if (debt.debtType === 'informal_lender') {
        if (!rate.equals(zero)) {
          throw new DomainError(
            INVALID_INTEREST_RATE,
            422,
            'Informal lender debts must have a zero interest rate'
          );
        }
      } else {
        if (!rate.greaterThan(zero)) {
          throw new DomainError(
            INVALID_INTEREST_RATE,
            422,
            'Interest rate must be greater than zero for this debt type'
          );
        }
      }
    }

    return this.debtRepo.update(input.debtId, input.updates);
  }
}
