import type { FinancialSpace, FinancialSpaceMember } from '@prisma/client';
import type { IFinancialSpaceRepository } from '../repositories/interfaces/financial-space.repository';
import type { IFinancialSpaceMemberRepository } from '../repositories/interfaces/financial-space-member.repository';
import type { IUserProfileRepository } from '../repositories/interfaces/user-profile.repository';
import type { RequestContext } from '../shared/types';
import { DomainError, PROFILE_NOT_FOUND } from '../shared/errors';

export interface EnrichedMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: FinancialSpaceMember['role'];
  joinedAt: Date;
}

export class FinancialSpaceManager {
  constructor(
    private readonly financialSpaceRepo: IFinancialSpaceRepository,
    private readonly memberRepo: IFinancialSpaceMemberRepository,
    private readonly userProfileRepo: IUserProfileRepository
  ) {}

  async getSpace(context: RequestContext): Promise<{ space: FinancialSpace; members: EnrichedMember[] }> {
    const space = await this.financialSpaceRepo.findById(context.financialSpaceId!);
    if (!space) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Financial space not found');
    }

    const members = await this.memberRepo.findAllBySpace(space.id);

    const enriched: EnrichedMember[] = await Promise.all(
      members.map(async (m) => {
        const profile = await this.userProfileRepo.findBySupabaseUserId(m.userId);
        return {
          id: m.id,
          userId: m.userId,
          displayName: profile?.displayName ?? 'Usuario',
          email: profile?.email ?? '',
          role: m.role,
          joinedAt: m.joinedAt,
        };
      })
    );

    return { space, members: enriched };
  }
}
