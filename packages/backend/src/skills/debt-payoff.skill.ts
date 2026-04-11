import type { Debt } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import {
  DomainError,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
  DEBT_ALREADY_PAID,
} from '../shared/errors';

export class DebtPayoffSkill {
  constructor(private readonly debtRepo: IDebtRepository) {}

  async markPaid(debtId: string, financialSpaceId: string): Promise<Debt> {
    const debt = await this.debtRepo.findById(debtId);
    if (!debt) {
      throw new DomainError(DEBT_NOT_FOUND, 404, 'Debt not found');
    }

    if (debt.financialSpaceId !== financialSpaceId) {
      throw new DomainError(DEBT_NOT_IN_SPACE, 403, 'Debt does not belong to this financial space');
    }

    if (debt.status === 'paid_off') {
      throw new DomainError(DEBT_ALREADY_PAID, 422, 'Debt is already paid off');
    }

    return this.debtRepo.updateBalance(debtId, new Prisma.Decimal(0), 'paid_off');
  }
}
