import crypto from 'crypto';
import type { Invitation } from '@prisma/client';
import type { IInvitationRepository } from '../repositories/interfaces/invitation.repository';
import { DomainError, INVITATION_NOT_FOUND, INVITATION_EXPIRED, INVITATION_USED } from '../shared/errors';

export class InvitationValidatorSkill {
  constructor(private readonly invitationRepo: IInvitationRepository) {}

  async validate(token: string): Promise<Invitation> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await this.invitationRepo.findByTokenHash(tokenHash);
    if (!invitation) {
      throw new DomainError(INVITATION_NOT_FOUND, 404, 'Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new DomainError(INVITATION_EXPIRED, 410, 'Invitation has expired');
    }

    if (invitation.status !== 'pending') {
      throw new DomainError(INVITATION_USED, 409, 'Invitation has already been used');
    }

    return invitation;
  }
}
