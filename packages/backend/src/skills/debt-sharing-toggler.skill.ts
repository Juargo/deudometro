import type { Debt } from '@prisma/client';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import {
  DomainError,
  SHARING_OWNER_ONLY,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
} from '../shared/errors';

export interface ToggleDebtSharingInput {
  debtId: string;
  financialSpaceId: string;
  isShared: boolean;
  callerRole: string;
}

export class DebtSharingTogglerSkill {
  constructor(private readonly debtRepo: IDebtRepository) {}

  async toggle(input: ToggleDebtSharingInput): Promise<Debt> {
    if (input.callerRole !== 'owner') {
      throw new DomainError(SHARING_OWNER_ONLY, 403, 'Only owners can change debt sharing settings');
    }

    const debt = await this.debtRepo.findById(input.debtId);
    if (!debt) {
      throw new DomainError(DEBT_NOT_FOUND, 404, 'Debt not found');
    }

    if (debt.financialSpaceId !== input.financialSpaceId) {
      throw new DomainError(DEBT_NOT_IN_SPACE, 403, 'Debt does not belong to this financial space');
    }

    return this.debtRepo.updateShared(input.debtId, input.isShared);
  }
}
