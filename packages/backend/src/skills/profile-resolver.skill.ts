import type { UserProfile, FinancialSpace, MemberRole } from '@prisma/client';
import type { IUserProfileRepository } from '../repositories/interfaces/user-profile.repository';
import type { IFinancialSpaceRepository } from '../repositories/interfaces/financial-space.repository';
import type { IFinancialSpaceMemberRepository } from '../repositories/interfaces/financial-space-member.repository';
import { DomainError, PROFILE_NOT_FOUND } from '../shared/errors';

export interface ResolveProfileResult {
  profile: UserProfile;
  financialSpace: FinancialSpace;
  role: MemberRole;
}

export class ProfileResolverSkill {
  constructor(
    private readonly userProfileRepo: IUserProfileRepository,
    private readonly financialSpaceRepo: IFinancialSpaceRepository,
    private readonly memberRepo: IFinancialSpaceMemberRepository
  ) {}

  async resolve(userId: string): Promise<ResolveProfileResult> {
    const profile = await this.userProfileRepo.findBySupabaseUserId(userId);
    if (!profile) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'User profile not found');
    }

    const financialSpace = await this.financialSpaceRepo.findById(profile.financialSpaceId);
    if (!financialSpace) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Financial space not found for profile');
    }

    const member = await this.memberRepo.findBySpaceAndUser(financialSpace.id, userId);
    if (!member) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Member record not found');
    }

    return { profile, financialSpace, role: member.role };
  }
}
