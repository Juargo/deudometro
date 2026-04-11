import type { PrismaClient, Debt, DebtStatus, Prisma } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreateDebtInput, UpdateDebtInput, DebtQueryOptions, IDebtRepository } from '../interfaces/debt.repository';

export class PrismaDebtRepository implements IDebtRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreateDebtInput, tx?: TransactionContext): Promise<Debt> {
    return this.db(tx).debt.create({ data: input });
  }

  async findById(id: string, tx?: TransactionContext): Promise<Debt | null> {
    return this.db(tx).debt.findUnique({ where: { id } });
  }

  async findByFinancialSpaceId(
    spaceId: string,
    options?: DebtQueryOptions,
    tx?: TransactionContext
  ): Promise<Debt[]> {
    return this.db(tx).debt.findMany({
      where: {
        financialSpaceId: spaceId,
        ...(options?.status !== undefined ? { status: options.status } : {}),
      },
    });
  }

  async update(id: string, data: UpdateDebtInput, tx?: TransactionContext): Promise<Debt> {
    return this.db(tx).debt.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: DebtStatus, tx?: TransactionContext): Promise<Debt> {
    return this.db(tx).debt.update({ where: { id }, data: { status } });
  }

  async updateShared(id: string, isShared: boolean, tx?: TransactionContext): Promise<Debt> {
    return this.db(tx).debt.update({ where: { id }, data: { isShared } });
  }

  async updateBalance(id: string, remainingBalance: Prisma.Decimal, status: DebtStatus, tx?: TransactionContext): Promise<Debt> {
    return this.db(tx).debt.update({ where: { id }, data: { remainingBalance, status } });
  }
}
