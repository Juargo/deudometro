import type { FinancialSpace, UserProfile, FinancialSpaceMember, Invitation, Debt, DebtPlan, PlanAction, Payment, Milestone, MilestoneType } from '@prisma/client';
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
    monthlyAllocation: new Decimal(0),
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

export function makeDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    financialSpaceId: 'space-1',
    createdByUserId: 'user-1',
    label: 'Tarjeta BCI',
    debtType: 'credit_card',
    lenderName: 'BCI',
    originalBalance: new Decimal('1000000'),
    remainingBalance: new Decimal('800000'),
    monthlyInterestRate: new Decimal('3.5'),
    minimumPayment: new Decimal('25000'),
    paymentDueDay: 15,
    cutoffDay: 5,
    isShared: false,
    status: 'active',
    metadata: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  } as Debt;
}

export function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'payment-1',
    debtId: 'debt-1',
    financialSpaceId: 'space-1',
    recordedByUserId: 'user-1',
    amount: new Decimal('50000'),
    principalAmount: new Decimal('22000'),
    interestAmount: new Decimal('28000'),
    paidAt: new Date('2025-02-01'),
    idempotencyKey: 'idem-key-1',
    createdAt: new Date('2025-02-01'),
    ...overrides,
  } as Payment;
}

export function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'milestone-1',
    financialSpaceId: 'space-1',
    milestoneType: 'first_payment' as MilestoneType,
    debtId: null,
    message: 'You made your first payment! Keep it up.',
    acknowledgedAt: null,
    createdAt: new Date('2025-02-01'),
    ...overrides,
  } as Milestone;
}

export function makeDebtPlan(overrides: Partial<DebtPlan> = {}): DebtPlan {
  return {
    id: 'plan-1',
    financialSpaceId: 'space-1',
    createdByUserId: 'user-1',
    strategyType: 'avalanche',
    status: 'active',
    monthlyIncomeSnapshot: new Decimal('2000000'),
    availableCapitalSnapshot: new Decimal('0'),
    totalFixedCostsSnapshot: new Decimal('500000'),
    reservePercentage: new Decimal('10'),
    monthlyBudget: new Decimal('300000'),
    aiAnalysis: null,
    aiPrompt: { systemPrompt: 'sys', userPrompt: 'usr' },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  } as unknown as DebtPlan;
}

export function makePlanAction(overrides: Partial<PlanAction> = {}): PlanAction {
  return {
    id: 'action-1',
    debtPlanId: 'plan-1',
    debtId: 'debt-1',
    debtLabel: 'Tarjeta BCI',
    debtType: 'credit_card',
    month: 1,
    paymentAmount: new Decimal('50000'),
    principalAmount: new Decimal('22000'),
    interestAmount: new Decimal('28000'),
    runningBalance: new Decimal('750000'),
    createdAt: new Date('2025-01-01'),
    ...overrides,
  } as PlanAction;
}
