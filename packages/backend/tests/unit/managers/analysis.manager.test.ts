import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisManager } from '../../../src/managers/analysis.manager';
import {
  NO_ACTIVE_DEBTS,
  NO_SURPLUS,
  PLAN_NOT_FOUND,
  PLAN_ALREADY_HAS_AI,
  NO_ACTIVE_PLAN,
} from '../../../src/shared/errors';
import { makeDebt, makeDebtPlan, makePlanAction, makeProfile } from '../skills/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import type { RequestContext } from '../../../src/shared/types';

const makeContext = (overrides: Partial<RequestContext> = {}): RequestContext => ({
  userId: 'user-1',
  profileId: 'profile-1',
  financialSpaceId: 'space-1',
  role: 'owner',
  ...overrides,
});

// ── skill mocks ────────────────────────────────────────────────────────────────

const mockStrategySorterSkill = { sort: vi.fn() };
const mockPlanCalculatorSkill = { calculate: vi.fn() };
const mockPromptBuilderSkill = { build: vi.fn() };
const mockClaudeClientSkill = { call: vi.fn() };
const mockPlanPersisterSkill = { persist: vi.fn() };

// ── repo mocks ─────────────────────────────────────────────────────────────────

const mockDebtPlanRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findActiveBySpaceId: vi.fn(),
  findAllBySpaceId: vi.fn(),
  supersedePreviousPlans: vi.fn(),
  updateAiAnalysis: vi.fn(),
};
const mockPlanActionRepo = {
  createMany: vi.fn(),
  findByPlanId: vi.fn(),
};
const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  updateShared: vi.fn(),
};
const mockUserProfileRepo = {
  findById: vi.fn(),
  update: vi.fn(),
};
const mockGetAvailableBudgetSkill = { calculate: vi.fn() };
const mockCriticalDebtDetectorSkill = { detect: vi.fn() };

// ── valid response objects ─────────────────────────────────────────────────────

const validAiAnalysis = {
  summary: 'Buen progreso.',
  strategy_rationale: 'Óptimo.',
  monthly_focus: 'Pagar BCI.',
  key_milestones: [{ month: 6, event: 'deuda_pagada', message: '¡Excelente!' }],
  critical_alerts: [],
  free_date_message: 'Libertad en junio 2027.',
};

function buildManager(): AnalysisManager {
  return new AnalysisManager(
    mockStrategySorterSkill as any,
    mockPlanCalculatorSkill as any,
    mockPromptBuilderSkill as any,
    mockClaudeClientSkill as any,
    mockPlanPersisterSkill as any,
    mockDebtPlanRepo as any,
    mockPlanActionRepo as any,
    mockDebtRepo as any,
    mockUserProfileRepo as any,
    mockGetAvailableBudgetSkill as any,
    mockCriticalDebtDetectorSkill as any
  );
}

function setupHappyPath() {
  const profile = makeProfile({
    monthlyIncome: new Decimal('2000000'),
    availableCapital: new Decimal('0'),
    monthlyAllocation: new Decimal('0'),
    reservePercentage: new Decimal('10'),
  });
  const debt = makeDebt({ remainingBalance: new Decimal('800000'), minimumPayment: new Decimal('25000') });
  const debtWithCritical = { ...debt, isCritical: false };
  const sortedDebt = { ...debtWithCritical, attackOrder: 1 };
  const plan = makeDebtPlan();
  const actions = [makePlanAction()];

  mockUserProfileRepo.findById.mockResolvedValue(profile);
  mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([debt]);
  mockGetAvailableBudgetSkill.calculate.mockReturnValue({
    availableBudget: new Decimal('300000'),
    totalFixedCosts: new Decimal('500000'),
  });
  mockCriticalDebtDetectorSkill.detect.mockReturnValue([debtWithCritical]);
  mockStrategySorterSkill.sort.mockReturnValue([sortedDebt]);
  mockPlanCalculatorSkill.calculate.mockReturnValue({
    actions: [],
    totalMonths: 12,
    totalInterestPaid: new Decimal('100000'),
    financialFreedomDate: new Date('2026-01-01'),
    exceededMaxMonths: false,
  });
  mockPromptBuilderSkill.build.mockReturnValue({ systemPrompt: 'sys', userPrompt: 'usr' });
  mockPlanPersisterSkill.persist.mockResolvedValue({ plan, actionsCount: 1 });
  mockPlanActionRepo.findByPlanId.mockResolvedValue(actions);

  return { profile, debt, plan, actions };
}

describe('AnalysisManager', () => {
  let manager: AnalysisManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = buildManager();
  });

  // ── generatePlan ──────────────────────────────────────────────────────────────

  describe('generatePlan', () => {
    it('happy path: returns plan, actions, aiAnalysis, and aiStatus=success', async () => {
      setupHappyPath();
      mockClaudeClientSkill.call.mockResolvedValue(validAiAnalysis);

      const result = await manager.generatePlan(makeContext(), 'avalanche');

      expect(result.plan).toBeDefined();
      expect(result.actions).toHaveLength(1);
      expect(result.aiAnalysis).toEqual(validAiAnalysis);
      expect(result.aiStatus).toBe('success');
      expect(result.totalMonths).toBe(12);
    });

    it('throws NO_ACTIVE_DEBTS when no active debts found', async () => {
      const profile = makeProfile({ monthlyIncome: new Decimal('2000000'), reservePercentage: new Decimal('10') });
      mockUserProfileRepo.findById.mockResolvedValue(profile);
      mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([]);

      await expect(manager.generatePlan(makeContext(), 'avalanche')).rejects.toMatchObject({
        code: NO_ACTIVE_DEBTS,
        httpStatus: 422,
      });
    });

    it('throws NO_SURPLUS when available budget is zero', async () => {
      const profile = makeProfile({ monthlyIncome: new Decimal('2000000'), reservePercentage: new Decimal('10') });
      const debt = makeDebt();
      mockUserProfileRepo.findById.mockResolvedValue(profile);
      mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([debt]);
      mockGetAvailableBudgetSkill.calculate.mockReturnValue({
        availableBudget: new Decimal('0'),
        totalFixedCosts: new Decimal('2000000'),
      });

      await expect(manager.generatePlan(makeContext(), 'avalanche')).rejects.toMatchObject({
        code: NO_SURPLUS,
        httpStatus: 422,
      });
    });

    it('AI timeout: plan still persisted, aiStatus=timeout', async () => {
      setupHappyPath();
      mockClaudeClientSkill.call.mockResolvedValue(null); // timeout → null

      const result = await manager.generatePlan(makeContext(), 'avalanche');

      expect(result.aiStatus).toBe('timeout');
      expect(result.aiAnalysis).toBeNull();
      expect(mockPlanPersisterSkill.persist).toHaveBeenCalledOnce();
    });

    it('circuit breaker opens after 3 consecutive AI failures (aiStatus=circuit_open)', async () => {
      // Run 3 plans with AI timeout to trigger circuit open
      for (let i = 0; i < 3; i++) {
        setupHappyPath();
        mockClaudeClientSkill.call.mockResolvedValue(null);
        await manager.generatePlan(makeContext(), 'avalanche');
      }

      // 4th plan: circuit should be open
      setupHappyPath();
      const result = await manager.generatePlan(makeContext(), 'avalanche');

      expect(result.aiStatus).toBe('circuit_open');
      // Claude was NOT called on the 4th attempt
      expect(mockClaudeClientSkill.call).toHaveBeenCalledTimes(3);
    });
  });

  // ── retryAi ──────────────────────────────────────────────────────────────────

  describe('retryAi', () => {
    it('throws PLAN_NOT_FOUND when plan does not exist', async () => {
      mockDebtPlanRepo.findById.mockResolvedValue(null);

      await expect(manager.retryAi(makeContext(), 'plan-unknown')).rejects.toMatchObject({
        code: PLAN_NOT_FOUND,
        httpStatus: 404,
      });
    });

    it('throws PLAN_NOT_FOUND when plan belongs to a different space', async () => {
      const plan = makeDebtPlan({ financialSpaceId: 'other-space' });
      mockDebtPlanRepo.findById.mockResolvedValue(plan);

      await expect(manager.retryAi(makeContext(), 'plan-1')).rejects.toMatchObject({
        code: PLAN_NOT_FOUND,
        httpStatus: 404,
      });
    });

    it('throws PLAN_ALREADY_HAS_AI when plan already has aiAnalysis', async () => {
      const plan = makeDebtPlan({ aiAnalysis: validAiAnalysis as any });
      mockDebtPlanRepo.findById.mockResolvedValue(plan);

      await expect(manager.retryAi(makeContext(), 'plan-1')).rejects.toMatchObject({
        code: PLAN_ALREADY_HAS_AI,
        httpStatus: 409,
      });
    });

    it('returns updated plan with aiAnalysis on success', async () => {
      const plan = makeDebtPlan({ aiAnalysis: null });
      const updatedPlan = makeDebtPlan({ aiAnalysis: validAiAnalysis as any });
      mockDebtPlanRepo.findById.mockResolvedValue(plan);
      mockClaudeClientSkill.call.mockResolvedValue(validAiAnalysis);
      mockDebtPlanRepo.updateAiAnalysis.mockResolvedValue(updatedPlan);

      const result = await manager.retryAi(makeContext(), 'plan-1');

      expect(result.aiAnalysis).toEqual(validAiAnalysis);
      expect(result.aiStatus).toBe('success');
      expect(result.plan).toEqual(updatedPlan);
    });

    it('returns aiStatus=timeout when AI returns null', async () => {
      const plan = makeDebtPlan({ aiAnalysis: null });
      mockDebtPlanRepo.findById.mockResolvedValue(plan);
      mockClaudeClientSkill.call.mockResolvedValue(null);

      const result = await manager.retryAi(makeContext(), 'plan-1');

      expect(result.aiStatus).toBe('timeout');
      expect(result.aiAnalysis).toBeNull();
    });
  });

  // ── getActivePlan ─────────────────────────────────────────────────────────────

  describe('getActivePlan', () => {
    it('returns null when no active plan exists', async () => {
      mockDebtPlanRepo.findActiveBySpaceId.mockResolvedValue(null);

      const result = await manager.getActivePlan(makeContext());
      expect(result).toBeNull();
    });

    it('returns plan and associated actions when active plan exists', async () => {
      const plan = makeDebtPlan();
      const actions = [makePlanAction()];
      mockDebtPlanRepo.findActiveBySpaceId.mockResolvedValue(plan);
      mockPlanActionRepo.findByPlanId.mockResolvedValue(actions);

      const result = await manager.getActivePlan(makeContext());

      expect(result.plan).toEqual(plan);
      expect(result.actions).toEqual(actions);
    });
  });
});
