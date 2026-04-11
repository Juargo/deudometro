import type { UserProfile } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { IUserProfileRepository } from '../repositories/interfaces/user-profile.repository';
import {
  DomainError,
  PROFILE_NOT_FOUND,
  INSUFFICIENT_INCOME_OR_CAPITAL,
  INVALID_MONTHLY_ALLOCATION,
} from '../shared/errors';

export interface FixedExpenses {
  rent: number;
  utilities: number;
  food: number;
  transport: number;
  other: number;
}

export interface UpdateFinancialProfileInput {
  profileId: string;
  displayName?: string;
  monthlyIncome?: Prisma.Decimal;
  availableCapital?: Prisma.Decimal;
  monthlyAllocation?: Prisma.Decimal;
  fixedExpenses?: FixedExpenses | null;
  reservePercentage?: Prisma.Decimal;
}

export class UpdateFinancialProfileSkill {
  constructor(private readonly userProfileRepo: IUserProfileRepository) {}

  async update(input: UpdateFinancialProfileInput): Promise<UserProfile> {
    const profile = await this.userProfileRepo.findById(input.profileId);
    if (!profile) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Profile not found');
    }

    const effectiveIncome = input.monthlyIncome ?? profile.monthlyIncome;
    const effectiveCapital = input.availableCapital ?? profile.availableCapital;
    const effectiveAllocation = input.monthlyAllocation ?? profile.monthlyAllocation;

    const zero = new (effectiveIncome.constructor as typeof Prisma.Decimal)(0);

    if (effectiveIncome.equals(zero) && effectiveCapital.equals(zero)) {
      throw new DomainError(
        INSUFFICIENT_INCOME_OR_CAPITAL,
        422,
        'Monthly income or available capital must be greater than zero'
      );
    }

    if (effectiveIncome.equals(zero) && effectiveAllocation.greaterThan(effectiveCapital)) {
      throw new DomainError(
        INVALID_MONTHLY_ALLOCATION,
        422,
        'Monthly allocation cannot exceed available capital when income is zero'
      );
    }

    const updateData: Parameters<IUserProfileRepository['update']>[1] = {};

    if (input.displayName !== undefined) updateData.displayName = input.displayName;
    if (input.monthlyIncome !== undefined) updateData.monthlyIncome = input.monthlyIncome;
    if (input.availableCapital !== undefined) updateData.availableCapital = input.availableCapital;
    if (input.monthlyAllocation !== undefined) updateData.monthlyAllocation = input.monthlyAllocation;
    if (input.reservePercentage !== undefined) updateData.reservePercentage = input.reservePercentage;
    if ('fixedExpenses' in input) {
      updateData.fixedExpenses =
        input.fixedExpenses === null
          ? Prisma.JsonNull
          : (input.fixedExpenses as unknown as Prisma.InputJsonValue);
    }

    return this.userProfileRepo.update(input.profileId, updateData);
  }
}
