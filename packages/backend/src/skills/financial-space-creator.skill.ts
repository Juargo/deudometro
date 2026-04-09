import type { FinancialSpace } from '@prisma/client';
import type { IFinancialSpaceRepository } from '../repositories/interfaces/financial-space.repository';
import type { TransactionContext } from '../shared/types';

export interface CreateFinancialSpaceSkillInput {
  name: string;
}

export class FinancialSpaceCreatorSkill {
  constructor(private readonly financialSpaceRepo: IFinancialSpaceRepository) {}

  async create(
    input: CreateFinancialSpaceSkillInput,
    tx?: TransactionContext
  ): Promise<FinancialSpace> {
    return this.financialSpaceRepo.create(
      { name: input.name, currency: 'CLP' },
      tx
    );
  }
}
