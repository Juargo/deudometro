import type { Invitation, InvitationStatus } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreateInvitationInput {
  financialSpaceId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  invitedByUserId: string;
}

export interface IInvitationRepository {
  create(input: CreateInvitationInput, tx?: TransactionContext): Promise<Invitation>;
  findByTokenHash(tokenHash: string, tx?: TransactionContext): Promise<Invitation | null>;
  findAllBySpace(financialSpaceId: string, status?: InvitationStatus, tx?: TransactionContext): Promise<Invitation[]>;
  updateStatus(id: string, status: InvitationStatus, tx?: TransactionContext): Promise<Invitation>;
}
