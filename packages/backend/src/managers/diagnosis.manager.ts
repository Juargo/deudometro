import { Prisma } from '@prisma/client';
import { z } from 'zod';
import type { IUserProfileRepository } from '../repositories/interfaces/user-profile.repository';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import type { IDebtPlanRepository } from '../repositories/interfaces/debt-plan.repository';
import type { GetAvailableBudgetSkill } from '../skills/get-available-budget.skill';
import type { CriticalDebtDetectorSkill } from '../skills/critical-debt-detector.skill';
import type { DiagnosisPromptBuilderSkill } from '../skills/diagnosis-prompt-builder.skill';
import type { ClaudeClientSkill } from '../skills/claude-client.skill';
import type { FixedExpenses } from '../skills/update-financial-profile.skill';
import type { RequestContext } from '../shared/types';
import {
  DomainError,
  DIAGNOSIS_INTENTION_REQUIRED,
  DIAGNOSIS_INTENTION_TOO_LONG,
  DIAGNOSIS_GENERATION_FAILED,
  PROFILE_NOT_FOUND,
} from '../shared/errors';
import { logger } from '../config/logger';

// ─── Output schema & type ───────────────────────────────────────────────────

export const DiagnosisOutputSchema = z.object({
  diagnosis: z.string(),
  approaches: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string(),
        description: z.string(),
        first_steps: z.array(z.string()),
      })
    )
    .length(3),
});

export type DiagnosisOutput = z.infer<typeof DiagnosisOutputSchema>;

// ─── Manager ────────────────────────────────────────────────────────────────

const MAX_INTENTION_LENGTH = 5000;

export class DiagnosisManager {
  // Circuit breaker state (independent from AnalysisManager)
  private circuitState: 'closed' | 'open' = 'closed';
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private readonly FAILURE_THRESHOLD = 3;
  private readonly COOLDOWN_MS = 60 * 1000; // 60 seconds

  constructor(
    private readonly userProfileRepo: IUserProfileRepository,
    private readonly debtRepo: IDebtRepository,
    private readonly planRepo: IDebtPlanRepository,
    private readonly getAvailableBudgetSkill: GetAvailableBudgetSkill,
    private readonly criticalDebtDetectorSkill: CriticalDebtDetectorSkill,
    private readonly diagnosisPromptBuilderSkill: DiagnosisPromptBuilderSkill,
    private readonly claudeClientSkill: ClaudeClientSkill
  ) {}

  async generateDiagnosis(
    context: RequestContext,
    financialIntention: string
  ): Promise<DiagnosisOutput> {
    // 1. Validate intention
    if (!financialIntention || financialIntention.trim().length === 0) {
      throw new DomainError(DIAGNOSIS_INTENTION_REQUIRED, 422, 'Financial intention is required');
    }

    if (financialIntention.length > MAX_INTENTION_LENGTH) {
      throw new DomainError(
        DIAGNOSIS_INTENTION_TOO_LONG,
        422,
        `Financial intention must not exceed ${MAX_INTENTION_LENGTH} characters`
      );
    }

    // 2. Save financialIntention to profile BEFORE calling AI (RF-31 BR-03)
    await this.userProfileRepo.update(context.profileId!, { financialIntention });

    // 3. Fetch data in parallel
    const [profile, activeDebts, activePlan] = await Promise.all([
      this.userProfileRepo.findById(context.profileId!),
      this.debtRepo.findByFinancialSpaceId(context.financialSpaceId!, { status: 'active' }),
      this.planRepo.findActiveBySpaceId(context.financialSpaceId!),
    ]);

    // 4. Guard: profile must exist
    if (!profile) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Perfil no encontrado');
    }

    // 5. Calculate derived values
    const zero = new Prisma.Decimal(0);

    const totalActiveDebt = activeDebts.reduce(
      (sum, d) => sum.add(d.remainingBalance),
      zero
    );

    const monthlyInterestLoad = activeDebts.reduce(
      (sum, d) => sum.add(d.remainingBalance.mul(d.monthlyInterestRate).div(100)),
      zero
    );

    const highestMonthlyRate = activeDebts.reduce(
      (max, d) => (d.monthlyInterestRate.greaterThan(max) ? d.monthlyInterestRate : max),
      zero
    );

    // Calculate total fixed expenses from profile JSON
    const fixedExpensesObj = profile?.fixedExpenses as FixedExpenses | null | undefined;
    let totalFixedExpenses = zero;
    if (fixedExpensesObj) {
      for (const value of Object.values(fixedExpensesObj)) {
        totalFixedExpenses = totalFixedExpenses.add(new Prisma.Decimal(value));
      }
    }

    // Available budget
    const budgetBreakdown = this.getAvailableBudgetSkill.calculate({
      monthlyIncome: profile?.monthlyIncome ?? zero,
      availableCapital: profile?.availableCapital ?? zero,
      monthlyAllocation: profile?.monthlyAllocation ?? zero,
      fixedExpenses: fixedExpensesObj ?? null,
      reservePercentage: profile?.reservePercentage ?? zero,
      activeDebtMinimums: activeDebts.map((d) => d.minimumPayment),
    });

    // Critical debts count
    const debtsWithCritical = this.criticalDebtDetectorSkill.detect(activeDebts);
    const criticalDebtsCount = debtsWithCritical.filter((d) => d.isCritical).length;

    // 5. Build prompt
    const debtTypeLabels: Record<string, string> = {
      credit_card: 'Tarjeta de Crédito',
      consumer_loan: 'Crédito de Consumo',
      mortgage: 'Hipotecario',
      informal_lender: 'Deuda Informal',
    };

    const prompt = this.diagnosisPromptBuilderSkill.build({
      employmentStatus: profile?.employmentStatus ?? null,
      investmentKnowledge: profile?.investmentKnowledge ?? null,
      monthlyIncome: profile?.monthlyIncome.toNumber() ?? 0,
      availableCapital: profile?.availableCapital.toNumber() ?? 0,
      totalFixedExpenses: totalFixedExpenses.toNumber(),
      availableBudget: budgetBreakdown.availableBudget.toNumber(),
      totalActiveDebt: totalActiveDebt.toNumber(),
      criticalDebtsCount,
      monthlyInterestLoad: monthlyInterestLoad.toNumber(),
      highestMonthlyRate: highestMonthlyRate.toNumber(),
      debts: activeDebts.map((d) => ({
        label: d.label,
        lenderName: d.lenderName,
        debtType: debtTypeLabels[d.debtType] ?? d.debtType,
        remainingBalance: d.remainingBalance.toNumber(),
        monthlyInterestRate: d.monthlyInterestRate.toNumber(),
        minimumPayment: d.minimumPayment.toNumber(),
      })),
      activeStrategy: activePlan?.strategyType ?? null,
      projectedFreedomDate: activePlan?.financialFreedomDate?.toISOString() ?? null,
      financialIntention,
    });

    // 6. Call Claude with schema validation — circuit breaker guards
    const now = Date.now();
    const pastCooldown =
      this.lastFailureTime !== null && now - this.lastFailureTime >= this.COOLDOWN_MS;

    if (this.circuitState === 'open' && !pastCooldown) {
      throw new DomainError(
        DIAGNOSIS_GENERATION_FAILED,
        503,
        'Servicio de diagnóstico temporalmente no disponible. Intenta de nuevo en unos minutos.'
      );
    }

    if (this.circuitState === 'open' && pastCooldown) {
      // Cooldown expired — reset and allow one attempt
      this.circuitState = 'closed';
      this.consecutiveFailures = 0;
    }

    logger.info({ operation: 'diagnosis.generate', profileId: context.profileId }, 'Generating diagnosis');

    const result = await this.claudeClientSkill.callWithSchema(prompt, DiagnosisOutputSchema, {
      maxTokens: 4096,
    });

    // 7. Handle null result
    if (result === null) {
      this.consecutiveFailures += 1;
      this.lastFailureTime = Date.now();
      if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
        this.circuitState = 'open';
      }
      throw new DomainError(
        DIAGNOSIS_GENERATION_FAILED,
        502,
        'Diagnosis generation failed — AI call returned no result'
      );
    }

    // Success — reset circuit breaker
    this.consecutiveFailures = 0;
    this.circuitState = 'closed';

    logger.info({ operation: 'diagnosis.generate', profileId: context.profileId }, 'Diagnosis generated');

    return result;
  }
}
