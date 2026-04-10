import type { Debt } from '@prisma/client';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import {
  DomainError,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
  DEBT_ALREADY_ARCHIVED,
} from '../shared/errors';

export interface ArchiveDebtInput {
  debtId: string;
  financialSpaceId: string;
}

export class DebtArchiverSkill {
  constructor(private readonly debtRepo: IDebtRepository) {}

  async archive(input: ArchiveDebtInput): Promise<Debt> {
    const debt = await this.debtRepo.findById(input.debtId);
    if (!debt) {
      throw new DomainError(DEBT_NOT_FOUND, 404, 'Debt not found');
    }

    if (debt.financialSpaceId !== input.financialSpaceId) {
      throw new DomainError(DEBT_NOT_IN_SPACE, 403, 'Debt does not belong to this financial space');
    }

    if (debt.status !== 'active') {
      throw new DomainError(DEBT_ALREADY_ARCHIVED, 409, 'Debt is already archived');
    }

    return this.debtRepo.updateStatus(input.debtId, 'frozen');
  }
}
