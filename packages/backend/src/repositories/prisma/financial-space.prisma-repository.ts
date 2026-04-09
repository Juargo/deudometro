import type { PrismaClient, FinancialSpace } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreateFinancialSpaceInput, IFinancialSpaceRepository } from '../interfaces/financial-space.repository';

export class PrismaFinancialSpaceRepository implements IFinancialSpaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreateFinancialSpaceInput, tx?: TransactionContext): Promise<FinancialSpace> {
    return this.db(tx).financialSpace.create({ data: input });
  }

  async findById(id: string, tx?: TransactionContext): Promise<FinancialSpace | null> {
    return this.db(tx).financialSpace.findUnique({ where: { id } });
  }
}
