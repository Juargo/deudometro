import type { PrismaClient, UserProfile } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreateUserProfileInput, UpdateUserProfileInput, IUserProfileRepository } from '../interfaces/user-profile.repository';

export class PrismaUserProfileRepository implements IUserProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreateUserProfileInput, tx?: TransactionContext): Promise<UserProfile> {
    return this.db(tx).userProfile.create({ data: input });
  }

  async findBySupabaseUserId(supabaseUserId: string, tx?: TransactionContext): Promise<UserProfile | null> {
    return this.db(tx).userProfile.findUnique({ where: { supabaseUserId } });
  }

  async findById(id: string, tx?: TransactionContext): Promise<UserProfile | null> {
    return this.db(tx).userProfile.findUnique({ where: { id } });
  }

  async update(id: string, data: UpdateUserProfileInput, tx?: TransactionContext): Promise<UserProfile> {
    return this.db(tx).userProfile.update({ where: { id }, data });
  }
}
