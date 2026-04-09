import type { PrismaClient, FinancialSpaceMember } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreateMemberInput, IFinancialSpaceMemberRepository } from '../interfaces/financial-space-member.repository';

export class PrismaFinancialSpaceMemberRepository implements IFinancialSpaceMemberRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreateMemberInput, tx?: TransactionContext): Promise<FinancialSpaceMember> {
    return this.db(tx).financialSpaceMember.create({ data: input });
  }

  async findBySpaceAndUser(
    financialSpaceId: string,
    userId: string,
    tx?: TransactionContext
  ): Promise<FinancialSpaceMember | null> {
    return this.db(tx).financialSpaceMember.findUnique({
      where: { financialSpaceId_userId: { financialSpaceId, userId } },
    });
  }

  async findAllBySpace(financialSpaceId: string, tx?: TransactionContext): Promise<FinancialSpaceMember[]> {
    return this.db(tx).financialSpaceMember.findMany({ where: { financialSpaceId } });
  }
}
