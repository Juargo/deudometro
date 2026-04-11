import type { PrismaClient, Payment } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreatePaymentInput, PaymentQueryOptions, IPaymentRepository } from '../interfaces/payment.repository';

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreatePaymentInput, tx?: TransactionContext): Promise<Payment> {
    return this.db(tx).payment.create({ data: input });
  }

  async findByIdempotencyKey(key: string, tx?: TransactionContext): Promise<Payment | null> {
    return this.db(tx).payment.findUnique({ where: { idempotencyKey: key } });
  }

  async findByFinancialSpaceId(spaceId: string, options?: PaymentQueryOptions): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        financialSpaceId: spaceId,
        ...(options?.debtId !== undefined ? { debtId: options.debtId } : {}),
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findByDebtId(debtId: string, tx?: TransactionContext): Promise<Payment[]> {
    return this.db(tx).payment.findMany({
      where: { debtId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async countByFinancialSpaceId(spaceId: string, tx?: TransactionContext): Promise<number> {
    return this.db(tx).payment.count({ where: { financialSpaceId: spaceId } });
  }
}
