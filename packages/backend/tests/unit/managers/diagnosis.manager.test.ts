import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiagnosisManager } from '../../../src/managers/diagnosis.manager';
import {
  DIAGNOSIS_INTENTION_REQUIRED,
  DIAGNOSIS_INTENTION_TOO_LONG,
  DIAGNOSIS_GENERATION_FAILED,
  PROFILE_NOT_FOUND,
} from '../../../src/shared/errors';
import { makeDebt, makeDebtPlan, makeProfile } from '../skills/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import type { RequestContext } from '../../../src/shared/types';

const makeContext = (overrides: Partial<RequestContext> = {}): RequestContext => ({
  userId: 'user-1',
  profileId: 'profile-1',
  financialSpaceId: 'space-1',
  role: 'owner',
  ...overrides,
});

// ── repo mocks ─────────────────────────────────────────────────────────────────

const mockUserProfileRepo = {
  findById: vi.fn(),
  update: vi.fn(),
};

const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  updateShared: vi.fn(),
};

const mockDebtPlanRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findActiveBySpaceId: vi.fn(),
  findAllBySpaceId: vi.fn(),
  supersedePreviousPlans: vi.fn(),
  updateAiAnalysis: vi.fn(),
};

// ── skill mocks ────────────────────────────────────────────────────────────────

const mockGetAvailableBudgetSkill = { calculate: vi.fn() };
const mockCriticalDebtDetectorSkill = { detect: vi.fn() };
const mockDiagnosisPromptBuilderSkill = { build: vi.fn() };
const mockClaudeClientSkill = { callWithSchema: vi.fn() };

// ── valid AI response ──────────────────────────────────────────────────────────

const validDiagnosisOutput = {
  diagnosis: 'Tu situación financiera requiere atención inmediata.',
  approaches: [
    {
      title: 'Enfoque Avalanche',
      rationale: 'Reduce la carga de intereses más rápido.',
      description: 'Paga primero la deuda con mayor tasa de interés.',
      first_steps: ['Identifica la deuda más costosa', 'Destina el máximo posible a esa deuda'],
    },
    {
      title: 'Enfoque Snowball',
      rationale: 'Genera motivación al eliminar deudas pequeñas.',
      description: 'Paga primero la deuda con menor saldo.',
      first_steps: ['Identifica la deuda más pequeña', 'Elimínala lo antes posible'],
    },
    {
      title: 'Enfoque Mixto',
      rationale: 'Combina beneficios psicológicos y financieros.',
      description: 'Alterna entre deudas críticas y pequeñas.',
      first_steps: ['Clasifica tus deudas', 'Distribuye el presupuesto estratégicamente'],
    },
  ],
};

function buildManager(): DiagnosisManager {
  return new DiagnosisManager(
    mockUserProfileRepo as any,
    mockDebtRepo as any,
    mockDebtPlanRepo as any,
    mockGetAvailableBudgetSkill as any,
    mockCriticalDebtDetectorSkill as any,
    mockDiagnosisPromptBuilderSkill as any,
    mockClaudeClientSkill as any
  );
}

function setupHappyPath() {
  const profile = makeProfile({
    monthlyIncome: new Decimal('2000000'),
    availableCapital: new Decimal('500000'),
    monthlyAllocation: new Decimal('0'),
    reservePercentage: new Decimal('10'),
    employmentStatus: 'Empleado' as any,
    investmentKnowledge: 'Medio' as any,
  });
  const debt = makeDebt({
    remainingBalance: new Decimal('800000'),
    monthlyInterestRate: new Decimal('3.5'),
    minimumPayment: new Decimal('25000'),
  });
  const debtWithCritical = { ...debt, isCritical: false };
  const plan = makeDebtPlan({ strategyType: 'avalanche', financialFreedomDate: new Date('2028-06-01') } as any);

  mockUserProfileRepo.update.mockResolvedValue(undefined);
  mockUserProfileRepo.findById.mockResolvedValue(profile);
  mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([debt]);
  mockDebtPlanRepo.findActiveBySpaceId.mockResolvedValue(plan);
  mockGetAvailableBudgetSkill.calculate.mockReturnValue({
    availableBudget: new Decimal('300000'),
    totalFixedCosts: new Decimal('500000'),
  });
  mockCriticalDebtDetectorSkill.detect.mockReturnValue([debtWithCritical]);
  mockDiagnosisPromptBuilderSkill.build.mockReturnValue({
    systemPrompt: 'Eres un asesor financiero...',
    userPrompt: 'Contexto financiero...',
  });
  mockClaudeClientSkill.callWithSchema.mockResolvedValue(validDiagnosisOutput);

  return { profile, debt, plan };
}

describe('DiagnosisManager', () => {
  let manager: DiagnosisManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = buildManager();
  });

  describe('generateDiagnosis', () => {
    it('happy path: valid intention → saves to profile → fetches data → builds prompt → calls AI → returns DiagnosisOutput', async () => {
      setupHappyPath();
      const intention = 'Quiero pagar mis deudas lo más rápido posible.';

      const result = await manager.generateDiagnosis(makeContext(), intention);

      expect(result).toEqual(validDiagnosisOutput);
      expect(result.diagnosis).toBeDefined();
      expect(result.approaches).toHaveLength(3);
    });

    it('throws DIAGNOSIS_INTENTION_REQUIRED for empty string intention', async () => {
      await expect(manager.generateDiagnosis(makeContext(), '')).rejects.toMatchObject({
        code: DIAGNOSIS_INTENTION_REQUIRED,
        httpStatus: 422,
      });
    });

    it('throws DIAGNOSIS_INTENTION_REQUIRED for whitespace-only intention', async () => {
      await expect(manager.generateDiagnosis(makeContext(), '   ')).rejects.toMatchObject({
        code: DIAGNOSIS_INTENTION_REQUIRED,
        httpStatus: 422,
      });
    });

    it('throws DIAGNOSIS_INTENTION_TOO_LONG for intention > 5000 chars', async () => {
      const longIntention = 'A'.repeat(5001);

      await expect(manager.generateDiagnosis(makeContext(), longIntention)).rejects.toMatchObject({
        code: DIAGNOSIS_INTENTION_TOO_LONG,
        httpStatus: 422,
      });
    });

    it('throws DIAGNOSIS_GENERATION_FAILED when claudeClientSkill.callWithSchema returns null', async () => {
      setupHappyPath();
      mockClaudeClientSkill.callWithSchema.mockResolvedValue(null);

      await expect(
        manager.generateDiagnosis(makeContext(), 'Una intención válida.')
      ).rejects.toMatchObject({
        code: DIAGNOSIS_GENERATION_FAILED,
        httpStatus: 502,
      });
    });

    it('save before AI: userProfileRepo.update is called BEFORE claudeClientSkill.callWithSchema (RF-31 BR-03)', async () => {
      setupHappyPath();
      const callOrder: string[] = [];

      mockUserProfileRepo.update.mockImplementation(async () => {
        callOrder.push('update');
      });
      mockClaudeClientSkill.callWithSchema.mockImplementation(async () => {
        callOrder.push('callWithSchema');
        return validDiagnosisOutput;
      });

      await manager.generateDiagnosis(makeContext(), 'Una intención válida.');

      expect(callOrder.indexOf('update')).toBeLessThan(callOrder.indexOf('callWithSchema'));
    });

    it('Promise.all parallelism: profile, debts, and plan repos are all called', async () => {
      setupHappyPath();

      await manager.generateDiagnosis(makeContext(), 'Una intención válida.');

      expect(mockUserProfileRepo.findById).toHaveBeenCalledOnce();
      expect(mockDebtRepo.findByFinancialSpaceId).toHaveBeenCalledOnce();
      expect(mockDebtPlanRepo.findActiveBySpaceId).toHaveBeenCalledOnce();
    });

    it('throws PROFILE_NOT_FOUND when profile repo returns null', async () => {
      setupHappyPath();
      mockUserProfileRepo.findById.mockResolvedValue(null);

      await expect(
        manager.generateDiagnosis(makeContext(), 'Una intención válida.')
      ).rejects.toMatchObject({
        code: PROFILE_NOT_FOUND,
        httpStatus: 404,
      });
    });
  });

  describe('circuit breaker', () => {
    it('opens after 3 consecutive failures and blocks 4th call without calling AI', async () => {
      setupHappyPath();
      mockClaudeClientSkill.callWithSchema.mockResolvedValue(null);

      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        await expect(
          manager.generateDiagnosis(makeContext(), 'Una intención válida.')
        ).rejects.toMatchObject({ code: DIAGNOSIS_GENERATION_FAILED });
      }

      // 4th call should be blocked by circuit breaker (no AI call)
      await expect(
        manager.generateDiagnosis(makeContext(), 'Una intención válida.')
      ).rejects.toMatchObject({ code: DIAGNOSIS_GENERATION_FAILED, httpStatus: 503 });

      // AI should have been called exactly 3 times (not 4)
      expect(mockClaudeClientSkill.callWithSchema).toHaveBeenCalledTimes(3);
    });

    it('resets after 60s cooldown and allows AI call again', async () => {
      setupHappyPath();
      mockClaudeClientSkill.callWithSchema.mockResolvedValue(null);

      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        await expect(
          manager.generateDiagnosis(makeContext(), 'Una intención válida.')
        ).rejects.toMatchObject({ code: DIAGNOSIS_GENERATION_FAILED });
      }

      // Simulate 60s passing
      const realNow = Date.now;
      vi.spyOn(Date, 'now').mockReturnValue(realNow() + 61_000);

      // Set up success for the reset attempt
      mockClaudeClientSkill.callWithSchema.mockResolvedValue(validDiagnosisOutput);

      const result = await manager.generateDiagnosis(makeContext(), 'Una intención válida.');
      expect(result).toEqual(validDiagnosisOutput);
      // AI was called (3 failures + 1 success after reset)
      expect(mockClaudeClientSkill.callWithSchema).toHaveBeenCalledTimes(4);

      vi.restoreAllMocks();
    });

    it('resets counter after a success following 2 failures', async () => {
      setupHappyPath();

      // Fail twice
      mockClaudeClientSkill.callWithSchema.mockResolvedValueOnce(null);
      mockClaudeClientSkill.callWithSchema.mockResolvedValueOnce(null);
      for (let i = 0; i < 2; i++) {
        await expect(
          manager.generateDiagnosis(makeContext(), 'Una intención válida.')
        ).rejects.toMatchObject({ code: DIAGNOSIS_GENERATION_FAILED });
      }

      // Succeed on 3rd call — circuit should remain closed and counter reset
      mockClaudeClientSkill.callWithSchema.mockResolvedValue(validDiagnosisOutput);
      const result = await manager.generateDiagnosis(makeContext(), 'Una intención válida.');
      expect(result).toEqual(validDiagnosisOutput);

      // After success + reset, fail 3 more times to confirm the counter was truly reset
      // (i.e., it needs 3 new failures, not just 1 more)
      mockClaudeClientSkill.callWithSchema.mockResolvedValue(null);
      for (let i = 0; i < 2; i++) {
        await expect(
          manager.generateDiagnosis(makeContext(), 'Una intención válida.')
        ).rejects.toMatchObject({ code: DIAGNOSIS_GENERATION_FAILED, httpStatus: 502 });
      }

      // 3rd failure after success triggers open
      await expect(
        manager.generateDiagnosis(makeContext(), 'Una intención válida.')
      ).rejects.toMatchObject({ code: DIAGNOSIS_GENERATION_FAILED });

      // 4th should be circuit open (503)
      await expect(
        manager.generateDiagnosis(makeContext(), 'Una intención válida.')
      ).rejects.toMatchObject({ code: DIAGNOSIS_GENERATION_FAILED, httpStatus: 503 });
    });
  });
});
