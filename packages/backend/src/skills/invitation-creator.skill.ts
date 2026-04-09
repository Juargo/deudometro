import crypto from 'crypto';
import type { Invitation } from '@prisma/client';
import type { IInvitationRepository } from '../repositories/interfaces/invitation.repository';

export interface CreateInvitationSkillInput {
  spaceId: string;
  email: string;
  invitedByUserId: string;
}

export interface CreateInvitationResult {
  invitation: Invitation;
  rawToken: string;
}

export class InvitationCreatorSkill {
  constructor(private readonly invitationRepo: IInvitationRepository) {}

  async create(input: CreateInvitationSkillInput): Promise<CreateInvitationResult> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await this.invitationRepo.create({
      financialSpaceId: input.spaceId,
      email: input.email,
      tokenHash,
      expiresAt,
      invitedByUserId: input.invitedByUserId,
    });

    return { invitation, rawToken };
  }
}
