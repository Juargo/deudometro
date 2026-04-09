import type { FinancialSpaceMember, MemberRole } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreateMemberInput {
  financialSpaceId: string;
  userId: string;
  role: MemberRole;
  invitedByUserId?: string;
}

export interface IFinancialSpaceMemberRepository {
  create(input: CreateMemberInput, tx?: TransactionContext): Promise<FinancialSpaceMember>;
  findBySpaceAndUser(financialSpaceId: string, userId: string, tx?: TransactionContext): Promise<FinancialSpaceMember | null>;
  findAllBySpace(financialSpaceId: string, tx?: TransactionContext): Promise<FinancialSpaceMember[]>;
}
