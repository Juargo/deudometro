import { Prisma } from '@prisma/client';
import type { DebtCreatorSkill } from '../skills/debt-creator.skill';
import type { DebtUpdaterSkill } from '../skills/debt-updater.skill';
import type { DebtArchiverSkill } from '../skills/debt-archiver.skill';
import type { DebtSharingTogglerSkill } from '../skills/debt-sharing-toggler.skill';
import type { CriticalDebtDetectorSkill, DebtWithCritical } from '../skills/critical-debt-detector.skill';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import type { RequestContext } from '../shared/types';
import { DomainError, DEBT_NOT_FOUND, DEBT_NOT_IN_SPACE, DEBT_NOT_VISIBLE } from '../shared/errors';
import { logger } from '../config/logger';

export interface CreateDebtManagerInput {
  label: string;
  debtType: 'credit_card' | 'consumer_loan' | 'mortgage' | 'informal_lender';
  lenderName: string;
  balance: number;
  monthlyInterestRate: number;
  minimumPayment: number;
  paymentDueDay: number;
  cutoffDay?: number;
  isShared?: boolean;
  metadata?: {
    hasInterest?: boolean;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface UpdateDebtManagerInput {
  label?: string;
  lenderName?: string;
  remainingBalance?: number;
  monthlyInterestRate?: number;
  minimumPayment?: number;
  paymentDueDay?: number;
  cutoffDay?: number | null;
  metadata?: {
    hasInterest?: boolean;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface ListDebtsOptions {
  status?: 'active' | 'frozen' | 'paid_off';
}

export class DebtManager {
  constructor(
    private readonly debtCreatorSkill: DebtCreatorSkill,
    private readonly debtUpdaterSkill: DebtUpdaterSkill,
    private readonly debtArchiverSkill: DebtArchiverSkill,
    private readonly debtSharingTogglerSkill: DebtSharingTogglerSkill,
    private readonly criticalDetectorSkill: CriticalDebtDetectorSkill,
    private readonly debtRepo: IDebtRepository
  ) {}

  async createDebt(context: RequestContext, input: CreateDebtManagerInput): Promise<DebtWithCritical> {
    const debt = await this.debtCreatorSkill.create({
      financialSpaceId: context.financialSpaceId!,
      createdByUserId: context.userId,
      label: input.label,
      debtType: input.debtType,
      lenderName: input.lenderName,
      balance: new Prisma.Decimal(input.balance),
      monthlyInterestRate: new Prisma.Decimal(input.monthlyInterestRate),
      minimumPayment: new Prisma.Decimal(input.minimumPayment),
      paymentDueDay: input.paymentDueDay,
      cutoffDay: input.cutoffDay,
      isShared: input.isShared ?? false,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    });

    logger.info({ operation: 'debt.create', debtId: debt.id, spaceId: context.financialSpaceId }, 'Debt created');

    const [annotated] = this.criticalDetectorSkill.detect([debt]);
    return annotated;
  }

  async listDebts(context: RequestContext, options?: ListDebtsOptions): Promise<DebtWithCritical[]> {
    const status = options?.status ?? 'active';
    const debts = await this.debtRepo.findByFinancialSpaceId(
      context.financialSpaceId!,
      { status: status as import('@prisma/client').DebtStatus }
    );

    const visibleDebts = debts.filter(
      (debt) => debt.isShared || debt.createdByUserId === context.userId
    );

    return this.criticalDetectorSkill.detect(visibleDebts);
  }

  async getDebt(context: RequestContext, debtId: string): Promise<DebtWithCritical> {
    const debt = await this.debtRepo.findById(debtId);
    if (!debt) {
      throw new DomainError(DEBT_NOT_FOUND, 404, 'Debt not found');
    }

    if (debt.financialSpaceId !== context.financialSpaceId) {
      throw new DomainError(DEBT_NOT_IN_SPACE, 403, 'Debt does not belong to this financial space');
    }

    if (!debt.isShared && debt.createdByUserId !== context.userId) {
      throw new DomainError(DEBT_NOT_VISIBLE, 403, 'Debt is not visible to this user');
    }

    const [annotated] = this.criticalDetectorSkill.detect([debt]);
    return annotated;
  }

  async updateDebt(
    context: RequestContext,
    debtId: string,
    input: UpdateDebtManagerInput
  ): Promise<DebtWithCritical> {
    const updates: import('../repositories/interfaces/debt.repository').UpdateDebtInput = {};

    if (input.label !== undefined) updates.label = input.label;
    if (input.lenderName !== undefined) updates.lenderName = input.lenderName;
    if (input.remainingBalance !== undefined) updates.remainingBalance = new Prisma.Decimal(input.remainingBalance);
    if (input.monthlyInterestRate !== undefined) updates.monthlyInterestRate = new Prisma.Decimal(input.monthlyInterestRate);
    if (input.minimumPayment !== undefined) updates.minimumPayment = new Prisma.Decimal(input.minimumPayment);
    if (input.paymentDueDay !== undefined) updates.paymentDueDay = input.paymentDueDay;
    if ('cutoffDay' in input) updates.cutoffDay = input.cutoffDay ?? null;
    if (input.metadata !== undefined) updates.metadata = input.metadata as Prisma.InputJsonValue;

    const debt = await this.debtUpdaterSkill.update({
      debtId,
      financialSpaceId: context.financialSpaceId!,
      updates,
    });

    logger.info({ operation: 'debt.update', debtId, spaceId: context.financialSpaceId }, 'Debt updated');

    const [annotated] = this.criticalDetectorSkill.detect([debt]);
    return annotated;
  }

  async archiveDebt(context: RequestContext, debtId: string): Promise<DebtWithCritical> {
    const debt = await this.debtArchiverSkill.archive({
      debtId,
      financialSpaceId: context.financialSpaceId!,
    });

    logger.info({ operation: 'debt.archive', debtId, spaceId: context.financialSpaceId }, 'Debt archived');

    const [annotated] = this.criticalDetectorSkill.detect([debt]);
    return annotated;
  }

  async toggleShared(
    context: RequestContext,
    debtId: string,
    isShared: boolean
  ): Promise<DebtWithCritical> {
    const debt = await this.debtSharingTogglerSkill.toggle({
      debtId,
      financialSpaceId: context.financialSpaceId!,
      isShared,
      callerRole: context.role ?? '',
    });

    logger.info({ operation: 'debt.toggleShared', debtId, isShared, spaceId: context.financialSpaceId }, 'Debt sharing toggled');

    const [annotated] = this.criticalDetectorSkill.detect([debt]);
    return annotated;
  }
}
