import type { UserProfile } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { UpdateFinancialProfileSkill } from '../skills/update-financial-profile.skill';
import type { GetAvailableBudgetSkill, BudgetBreakdown } from '../skills/get-available-budget.skill';
import type { IUserProfileRepository } from '../repositories/interfaces/user-profile.repository';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import type { RequestContext } from '../shared/types';
import { DomainError, PROFILE_NOT_FOUND } from '../shared/errors';
import { logger } from '../config/logger';

export interface UpdateFinancialProfileManagerInput {
  displayName?: string;
  monthlyIncome?: number;
  availableCapital?: number;
  monthlyAllocation?: number;
  fixedExpenses?: {
    rent: number;
    utilities: number;
    food: number;
    transport: number;
    other: number;
  };
  reservePercentage?: number;
}

export interface FinancialSummary {
  profile: UserProfile;
  budget: BudgetBreakdown;
}

export class ProfileManager {
  constructor(
    private readonly updateProfileSkill: UpdateFinancialProfileSkill,
    private readonly budgetSkill: GetAvailableBudgetSkill,
    private readonly userProfileRepo: IUserProfileRepository,
    private readonly debtRepo: IDebtRepository
  ) {}

  async getFinancialSummary(context: RequestContext): Promise<FinancialSummary> {
    const profile = await this.userProfileRepo.findById(context.profileId!);
    if (!profile) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Profile not found');
    }

    const allDebts = await this.debtRepo.findByFinancialSpaceId(
      context.financialSpaceId!,
      { status: 'active' }
    );

    const visibleDebts = allDebts.filter(
      (debt) => debt.isShared || debt.createdByUserId === context.userId
    );

    const activeDebtMinimums = visibleDebts.map((debt) => debt.minimumPayment);

    const budget = this.budgetSkill.calculate({
      monthlyIncome: profile.monthlyIncome,
      availableCapital: profile.availableCapital,
      monthlyAllocation: profile.monthlyAllocation,
      fixedExpenses: profile.fixedExpenses as Parameters<GetAvailableBudgetSkill['calculate']>[0]['fixedExpenses'],
      reservePercentage: profile.reservePercentage,
      activeDebtMinimums,
    });

    logger.info({ operation: 'profile.getFinancialSummary', profileId: context.profileId }, 'Financial summary fetched');

    return { profile, budget };
  }

  async updateFinancialProfile(
    context: RequestContext,
    input: UpdateFinancialProfileManagerInput
  ): Promise<UserProfile> {
    const skillInput: Parameters<UpdateFinancialProfileSkill['update']>[0] = {
      profileId: context.profileId!,
    };

    if (input.displayName !== undefined) {
      skillInput.displayName = input.displayName;
    }
    if (input.monthlyIncome !== undefined) {
      skillInput.monthlyIncome = new Prisma.Decimal(input.monthlyIncome);
    }
    if (input.availableCapital !== undefined) {
      skillInput.availableCapital = new Prisma.Decimal(input.availableCapital);
    }
    if (input.monthlyAllocation !== undefined) {
      skillInput.monthlyAllocation = new Prisma.Decimal(input.monthlyAllocation);
    }
    if (input.fixedExpenses !== undefined) {
      skillInput.fixedExpenses = input.fixedExpenses;
    }
    if (input.reservePercentage !== undefined) {
      skillInput.reservePercentage = new Prisma.Decimal(input.reservePercentage);
    }

    const profile = await this.updateProfileSkill.update(skillInput);
    logger.info({ operation: 'profile.updateFinancialProfile', profileId: context.profileId }, 'Financial profile updated');
    return profile;
  }
}
