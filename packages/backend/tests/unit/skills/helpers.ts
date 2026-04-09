import type { FinancialSpace, UserProfile, FinancialSpaceMember, Invitation } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export function makeSpace(overrides: Partial<FinancialSpace> = {}): FinancialSpace {
  return {
    id: 'space-1',
    name: 'Test Space',
    currency: 'CLP',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'profile-1',
    supabaseUserId: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    monthlyIncome: new Decimal(0),
    availableCapital: new Decimal(0),
    fixedExpenses: null,
    reservePercentage: new Decimal(10),
    financialSpaceId: 'space-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeMember(overrides: Partial<FinancialSpaceMember> = {}): FinancialSpaceMember {
  return {
    id: 'member-1',
    userId: 'user-1',
    role: 'owner',
    joinedAt: new Date(),
    invitedByUserId: null,
    financialSpaceId: 'space-1',
    ...overrides,
  };
}

export function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 'inv-1',
    email: 'invited@example.com',
    tokenHash: 'hashed-token',
    status: 'pending',
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    invitedByUserId: 'user-1',
    financialSpaceId: 'space-1',
    createdAt: new Date(),
    ...overrides,
  };
}
