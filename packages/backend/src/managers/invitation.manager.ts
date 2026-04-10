import type { Invitation, FinancialSpaceMember } from '@prisma/client';
import type { InvitationCreatorSkill } from '../skills/invitation-creator.skill';
import type { InvitationValidatorSkill } from '../skills/invitation-validator.skill';
import type { InvitationAcceptorSkill } from '../skills/invitation-acceptor.skill';
import type { IInvitationRepository } from '../repositories/interfaces/invitation.repository';
import type { RequestContext } from '../shared/types';
import { DomainError, FORBIDDEN } from '../shared/errors';
import { logger } from '../config/logger';

export class InvitationManager {
  constructor(
    private readonly invitationCreatorSkill: InvitationCreatorSkill,
    private readonly invitationValidatorSkill: InvitationValidatorSkill,
    private readonly invitationAcceptorSkill: InvitationAcceptorSkill,
    private readonly invitationRepo: IInvitationRepository
  ) {}

  async createInvitation(context: RequestContext, email: string): Promise<{ invitation: Invitation; rawToken: string }> {
    this.assertOwner(context);

    const result = await this.invitationCreatorSkill.create({
      spaceId: context.financialSpaceId!,
      email,
      invitedByUserId: context.userId,
    });

    logger.info({ operation: 'invitation.create', spaceId: context.financialSpaceId, email }, 'Invitation created');
    return result;
  }

  async listInvitations(context: RequestContext): Promise<Invitation[]> {
    this.assertOwner(context);
    return this.invitationRepo.findAllBySpace(context.financialSpaceId!, 'pending');
  }

  async revokeInvitation(context: RequestContext, invitationId: string): Promise<void> {
    this.assertOwner(context);
    await this.invitationRepo.updateStatus(invitationId, 'revoked');
    logger.info({ operation: 'invitation.revoke', invitationId }, 'Invitation revoked');
  }

  async acceptInvitation(context: RequestContext, token: string): Promise<FinancialSpaceMember> {
    const invitation = await this.invitationValidatorSkill.validate(token);

    const result = await this.invitationAcceptorSkill.accept({
      invitationId: invitation.id,
      acceptingUserId: context.userId,
      financialSpaceId: invitation.financialSpaceId,
    });

    logger.info({ operation: 'invitation.accept', userId: context.userId, spaceId: invitation.financialSpaceId }, 'Invitation accepted');
    return result.member;
  }

  private assertOwner(context: RequestContext): void {
    if (context.role !== 'owner') {
      throw new DomainError(FORBIDDEN, 403, 'Only the owner can manage invitations');
    }
  }
}
