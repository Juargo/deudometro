import type { FinancialSpaceMember, MemberRole } from '@prisma/client';
import type { IFinancialSpaceMemberRepository } from '../repositories/interfaces/financial-space-member.repository';
import type { TransactionContext } from '../shared/types';
import { DomainError, MEMBER_ALREADY_EXISTS } from '../shared/errors';

export interface CreateMemberSkillInput {
  userId: string;
  spaceId: string;
  role: MemberRole;
  invitedByUserId?: string;
}

export class MemberCreatorSkill {
  constructor(private readonly memberRepo: IFinancialSpaceMemberRepository) {}

  async create(
    input: CreateMemberSkillInput,
    tx?: TransactionContext
  ): Promise<FinancialSpaceMember> {
    const existing = await this.memberRepo.findBySpaceAndUser(input.spaceId, input.userId, tx);
    if (existing) {
      throw new DomainError(MEMBER_ALREADY_EXISTS, 409, 'Member already exists in this space');
    }

    return this.memberRepo.create(
      {
        financialSpaceId: input.spaceId,
        userId: input.userId,
        role: input.role,
        invitedByUserId: input.invitedByUserId,
      },
      tx
    );
  }
}
