import type { PrismaClient, UserProfile, FinancialSpace, FinancialSpaceMember } from '@prisma/client';
import type { IUserProfileRepository } from '../repositories/interfaces/user-profile.repository';
import type { IFinancialSpaceRepository } from '../repositories/interfaces/financial-space.repository';
import type { IFinancialSpaceMemberRepository } from '../repositories/interfaces/financial-space-member.repository';
import { DomainError, USER_ALREADY_EXISTS, REGISTRATION_FAILED } from '../shared/errors';

export interface RegisterInput {
  supabaseUserId: string;
  email: string;
  displayName: string;
}

export interface RegisterResult {
  profile: UserProfile;
  financialSpace: FinancialSpace;
  member: FinancialSpaceMember;
}

export class UserRegistrationSkill {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userProfileRepo: IUserProfileRepository,
    private readonly financialSpaceRepo: IFinancialSpaceRepository,
    private readonly memberRepo: IFinancialSpaceMemberRepository
  ) {}

  async register(input: RegisterInput): Promise<RegisterResult> {
    const existing = await this.userProfileRepo.findBySupabaseUserId(input.supabaseUserId);
    if (existing) {
      throw new DomainError(USER_ALREADY_EXISTS, 409, 'User already registered');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const financialSpace = await this.financialSpaceRepo.create(
          { name: `Espacio de ${input.displayName}`, currency: 'CLP' },
          tx
        );

        const profile = await this.userProfileRepo.create(
          {
            supabaseUserId: input.supabaseUserId,
            email: input.email,
            displayName: input.displayName,
            financialSpaceId: financialSpace.id,
          },
          tx
        );

        const member = await this.memberRepo.create(
          {
            financialSpaceId: financialSpace.id,
            userId: input.supabaseUserId,
            role: 'owner',
          },
          tx
        );

        return { profile, financialSpace, member };
      });
    } catch (err: unknown) {
      if (err instanceof DomainError) throw err;
      throw new DomainError(REGISTRATION_FAILED, 500, 'Registration transaction failed');
    }
  }
}
