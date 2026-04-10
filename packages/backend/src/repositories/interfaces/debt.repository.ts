import type { Debt, DebtStatus, Prisma } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreateDebtInput {
  financialSpaceId: string;
  createdByUserId: string;
  label: string;
  debtType: 'credit_card' | 'consumer_loan' | 'mortgage' | 'informal_lender';
  lenderName: string;
  originalBalance: Prisma.Decimal;
  remainingBalance: Prisma.Decimal;
  monthlyInterestRate: Prisma.Decimal;
  minimumPayment: Prisma.Decimal;
  paymentDueDay: number;
  cutoffDay?: number;
  isShared?: boolean;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateDebtInput {
  label?: string;
  lenderName?: string;
  remainingBalance?: Prisma.Decimal;
  monthlyInterestRate?: Prisma.Decimal;
  minimumPayment?: Prisma.Decimal;
  paymentDueDay?: number;
  cutoffDay?: number | null;
  metadata?: Prisma.InputJsonValue;
}

export interface DebtQueryOptions {
  status?: DebtStatus;
}

export interface IDebtRepository {
  create(input: CreateDebtInput, tx?: TransactionContext): Promise<Debt>;
  findById(id: string, tx?: TransactionContext): Promise<Debt | null>;
  findByFinancialSpaceId(spaceId: string, options?: DebtQueryOptions, tx?: TransactionContext): Promise<Debt[]>;
  update(id: string, data: UpdateDebtInput, tx?: TransactionContext): Promise<Debt>;
  updateStatus(id: string, status: DebtStatus, tx?: TransactionContext): Promise<Debt>;
  updateShared(id: string, isShared: boolean, tx?: TransactionContext): Promise<Debt>;
}
