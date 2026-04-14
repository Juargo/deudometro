import type { UserProfile, Prisma, EmploymentStatus, InvestmentKnowledge } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreateUserProfileInput {
  supabaseUserId: string;
  email: string;
  displayName: string;
  financialSpaceId: string;
}

export interface UpdateUserProfileInput {
  displayName?: string;
  monthlyIncome?: UserProfile['monthlyIncome'];
  availableCapital?: UserProfile['availableCapital'];
  monthlyAllocation?: UserProfile['monthlyAllocation'];
  fixedExpenses?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
  reservePercentage?: UserProfile['reservePercentage'];
  employmentStatus?: EmploymentStatus;
  investmentKnowledge?: InvestmentKnowledge;
  financialIntention?: string;
}

export interface IUserProfileRepository {
  create(input: CreateUserProfileInput, tx?: TransactionContext): Promise<UserProfile>;
  findBySupabaseUserId(supabaseUserId: string, tx?: TransactionContext): Promise<UserProfile | null>;
  findById(id: string, tx?: TransactionContext): Promise<UserProfile | null>;
  update(id: string, data: UpdateUserProfileInput, tx?: TransactionContext): Promise<UserProfile>;
}
