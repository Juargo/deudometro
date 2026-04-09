import type { FinancialSpace } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreateFinancialSpaceInput {
  name: string;
  currency?: string;
}

export interface IFinancialSpaceRepository {
  create(input: CreateFinancialSpaceInput, tx?: TransactionContext): Promise<FinancialSpace>;
  findById(id: string, tx?: TransactionContext): Promise<FinancialSpace | null>;
}
