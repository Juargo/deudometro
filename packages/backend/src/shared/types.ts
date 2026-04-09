import type { Request } from 'express';
import type { PrismaClient } from '@prisma/client';

// TransactionContext — the Prisma interactive transaction client type
// Skills that need atomicity receive this, pass it through to repo calls
export type TransactionContext = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface RequestContext {
  userId: string;            // supabaseUserId from JWT
  email: string;             // from JWT
  profileId?: string;        // UserProfile.id (set by space-resolver)
  financialSpaceId?: string; // from UserProfile (set by space-resolver)
  role?: 'owner' | 'editor'; // from FinancialSpaceMember
}

export interface AuthenticatedRequest extends Request {
  context: RequestContext;
}
