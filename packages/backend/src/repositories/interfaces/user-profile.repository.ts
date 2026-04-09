import type { UserProfile, Prisma } from '@prisma/client';
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
  fixedExpenses?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
  reservePercentage?: UserProfile['reservePercentage'];
}

export interface IUserProfileRepository {
  create(input: CreateUserProfileInput, tx?: TransactionContext): Promise<UserProfile>;
  findBySupabaseUserId(supabaseUserId: string, tx?: TransactionContext): Promise<UserProfile | null>;
  findById(id: string, tx?: TransactionContext): Promise<UserProfile | null>;
  update(id: string, data: UpdateUserProfileInput, tx?: TransactionContext): Promise<UserProfile>;
}
