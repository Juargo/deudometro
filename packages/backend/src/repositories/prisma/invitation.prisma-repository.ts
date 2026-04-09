import type { PrismaClient, Invitation, InvitationStatus } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreateInvitationInput, IInvitationRepository } from '../interfaces/invitation.repository';

export class PrismaInvitationRepository implements IInvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreateInvitationInput, tx?: TransactionContext): Promise<Invitation> {
    return this.db(tx).invitation.create({ data: input });
  }

  async findByTokenHash(tokenHash: string, tx?: TransactionContext): Promise<Invitation | null> {
    return this.db(tx).invitation.findUnique({ where: { tokenHash } });
  }

  async findAllBySpace(
    financialSpaceId: string,
    status?: InvitationStatus,
    tx?: TransactionContext
  ): Promise<Invitation[]> {
    return this.db(tx).invitation.findMany({
      where: { financialSpaceId, ...(status !== undefined ? { status } : {}) },
    });
  }

  async updateStatus(id: string, status: InvitationStatus, tx?: TransactionContext): Promise<Invitation> {
    return this.db(tx).invitation.update({ where: { id }, data: { status } });
  }
}
