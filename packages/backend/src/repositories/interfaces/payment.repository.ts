import type { Payment, Prisma } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreatePaymentInput {
  debtId: string;
  financialSpaceId: string;
  recordedByUserId: string;
  amount: Prisma.Decimal;
  principalAmount: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  paidAt: Date;
  idempotencyKey: string;
}

export interface PaymentQueryOptions {
  debtId?: string;
}

export interface IPaymentRepository {
  create(input: CreatePaymentInput, tx?: TransactionContext): Promise<Payment>;
  findByIdempotencyKey(key: string, tx?: TransactionContext): Promise<Payment | null>;
  findByFinancialSpaceId(spaceId: string, options?: PaymentQueryOptions): Promise<Payment[]>;
  findByDebtId(debtId: string, tx?: TransactionContext): Promise<Payment[]>;
  countByFinancialSpaceId(spaceId: string, tx?: TransactionContext): Promise<number>;
}
