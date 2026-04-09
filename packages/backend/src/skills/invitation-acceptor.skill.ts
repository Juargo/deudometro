import type { PrismaClient, Invitation, FinancialSpaceMember } from '@prisma/client';
import type { IInvitationRepository } from '../repositories/interfaces/invitation.repository';
import type { IFinancialSpaceMemberRepository } from '../repositories/interfaces/financial-space-member.repository';

export interface AcceptInvitationInput {
  invitationId: string;
  acceptingUserId: string;
  financialSpaceId: string;
}

export interface AcceptInvitationResult {
  invitation: Invitation;
  member: FinancialSpaceMember;
}

export class InvitationAcceptorSkill {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly invitationRepo: IInvitationRepository,
    private readonly memberRepo: IFinancialSpaceMemberRepository
  ) {}

  async accept(input: AcceptInvitationInput): Promise<AcceptInvitationResult> {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await this.invitationRepo.updateStatus(input.invitationId, 'accepted', tx);

      const member = await this.memberRepo.create(
        {
          financialSpaceId: input.financialSpaceId,
          userId: input.acceptingUserId,
          role: 'editor',
        },
        tx
      );

      return { invitation, member };
    });
  }
}
