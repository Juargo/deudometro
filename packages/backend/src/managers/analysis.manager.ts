import { Prisma } from '@prisma/client';
import type { DebtPlan, PlanAction } from '@prisma/client';
import type { StrategySorterSkill, SortStrategy } from '../skills/strategy-sorter.skill';
import type { PlanCalculatorSkill } from '../skills/plan-calculator.skill';
import type { PromptBuilderSkill } from '../skills/prompt-builder.skill';
import type { ClaudeClientSkill, AiAnalysisOutput } from '../skills/claude-client.skill';
import type { PlanPersisterSkill } from '../skills/plan-persister.skill';
import type { GetAvailableBudgetSkill } from '../skills/get-available-budget.skill';
import type { CriticalDebtDetectorSkill } from '../skills/critical-debt-detector.skill';
import type { IDebtPlanRepository } from '../repositories/interfaces/debt-plan.repository';
import type { IPlanActionRepository } from '../repositories/interfaces/plan-action.repository';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import type { IUserProfileRepository } from '../repositories/interfaces/user-profile.repository';
import type { RequestContext } from '../shared/types';
import {
  DomainError,
  PROFILE_NOT_FOUND,
  NO_ACTIVE_DEBTS,
  NO_SURPLUS,
  INSUFFICIENT_BUDGET,
  MAX_MONTHS_EXCEEDED,
  PLAN_NOT_FOUND,
  PLAN_ALREADY_HAS_AI,
  AI_CIRCUIT_OPEN,
  NO_ACTIVE_PLAN,
} from '../shared/errors';
import { logger } from '../config/logger';

export interface GeneratePlanResult {
  plan: DebtPlan;
  actions: PlanAction[];
  aiAnalysis: AiAnalysisOutput | null;
  totalMonths: number;
  totalInterestPaid: Prisma.Decimal;
  financialFreedomDate: Date;
  aiStatus: 'success' | 'timeout' | 'circuit_open';
}

export interface RetryAiResult {
  plan: DebtPlan;
  aiAnalysis: AiAnalysisOutput | null;
  aiStatus: 'success' | 'timeout';
}

export interface ActivePlanResult {
  plan: DebtPlan;
  actions: PlanAction[];
}

export class AnalysisManager {
  // Circuit breaker state
  private circuitState: 'closed' | 'open' | 'half-open' = 'closed';
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private readonly FAILURE_THRESHOLD = 3;
  private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly strategySorterSkill: StrategySorterSkill,
    private readonly planCalculatorSkill: PlanCalculatorSkill,
    private readonly promptBuilderSkill: PromptBuilderSkill,
    private readonly claudeClientSkill: ClaudeClientSkill,
    private readonly planPersisterSkill: PlanPersisterSkill,
    private readonly debtPlanRepo: IDebtPlanRepository,
    private readonly planActionRepo: IPlanActionRepository,
    private readonly debtRepo: IDebtRepository,
    private readonly userProfileRepo: IUserProfileRepository,
    private readonly getAvailableBudgetSkill: GetAvailableBudgetSkill,
    private readonly criticalDebtDetectorSkill: CriticalDebtDetectorSkill
  ) {}

  async generatePlan(context: RequestContext, strategy: SortStrategy): Promise<GeneratePlanResult> {
    const startTime = Date.now();

    // 1. Fetch profile
    const profile = await this.userProfileRepo.findById(context.profileId!);
    if (!profile) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Profile not found');
    }

    // 2. Fetch active debts
    const activeDebts = await this.debtRepo.findByFinancialSpaceId(
      context.financialSpaceId!,
      { status: 'active' }
    );

    if (activeDebts.length === 0) {
      throw new DomainError(NO_ACTIVE_DEBTS, 422, 'No active debts found');
    }

    // 3. Calculate budget
    const budget = this.getAvailableBudgetSkill.calculate({
      monthlyIncome: profile.monthlyIncome,
      availableCapital: profile.availableCapital,
      monthlyAllocation: profile.monthlyAllocation,
      fixedExpenses: profile.fixedExpenses as import('../skills/update-financial-profile.skill').FixedExpenses | null,
      reservePercentage: profile.reservePercentage,
      activeDebtMinimums: activeDebts.map((d) => d.minimumPayment),
    });

    if (budget.availableBudget.lessThanOrEqualTo(new Prisma.Decimal(0))) {
      throw new DomainError(NO_SURPLUS, 422, 'No surplus budget available for debt payment');
    }

    // 4. Sum minimums from ALL active debts
    const sumMinimums = activeDebts.reduce(
      (sum, d) => sum.add(d.minimumPayment),
      new Prisma.Decimal(0)
    );

    if (budget.availableBudget.lessThan(sumMinimums)) {
      throw new DomainError(
        INSUFFICIENT_BUDGET,
        422,
        'Available budget is less than the sum of minimum payments'
      );
    }

    // 5. Detect critical debts
    const debtsWithCritical = this.criticalDebtDetectorSkill.detect(activeDebts);

    // 6. Sort debts by strategy
    const sortedDebts = this.strategySorterSkill.sort({
      debts: debtsWithCritical.map((d) => ({
        id: d.id,
        label: d.label,
        debtType: d.debtType,
        remainingBalance: d.remainingBalance,
        monthlyInterestRate: d.monthlyInterestRate,
        minimumPayment: d.minimumPayment,
        isCritical: d.isCritical,
      })),
      strategy,
    });

    // 7. Calculate plan (use placeholder planId; persister will set real one)
    const calcResult = this.planCalculatorSkill.calculate({
      sortedDebts,
      monthlyBudget: budget.availableBudget,
      debtPlanId: 'placeholder',
    });

    if (calcResult.exceededMaxMonths) {
      throw new DomainError(MAX_MONTHS_EXCEEDED, 422, 'Plan exceeds maximum allowed months (360)');
    }

    const { totalMonths, totalInterestPaid, financialFreedomDate, actions } = calcResult;

    // 8. Build prompt
    const prompt = this.promptBuilderSkill.build({
      monthlyIncome: profile.monthlyIncome,
      availableCapital: profile.availableCapital,
      totalFixedCosts: budget.totalFixedCosts,
      reservePercentage: profile.reservePercentage,
      monthlyBudget: budget.availableBudget,
      strategy,
      sortedDebts,
      actions: actions.slice(0, 24 * activeDebts.length),
      totalInterestPaid,
      financialFreedomDate,
    });

    // 9. AI call with circuit breaker
    let aiResult: AiAnalysisOutput | null = null;
    let aiStatus: 'success' | 'timeout' | 'circuit_open' = 'circuit_open';

    const now = Date.now();
    const pastCooldown =
      this.lastFailureTime !== null && now - this.lastFailureTime >= this.COOLDOWN_MS;

    if (this.circuitState === 'open' && !pastCooldown) {
      // Circuit is open and cooldown hasn't passed — skip AI
      aiStatus = 'circuit_open';
    } else {
      if (this.circuitState === 'open' && pastCooldown) {
        this.circuitState = 'half-open';
      }

      const rawResult = await this.claudeClientSkill.call(prompt);

      if (rawResult !== null) {
        // Success
        aiResult = rawResult;
        aiStatus = 'success';
        this.consecutiveFailures = 0;
        this.circuitState = 'closed';
      } else {
        // Timeout / network error
        aiStatus = 'timeout';
        this.consecutiveFailures += 1;
        this.lastFailureTime = Date.now();
        if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
          this.circuitState = 'open';
        }
      }
    }

    // 10. Persist plan
    const { plan } = await this.planPersisterSkill.persist({
      financialSpaceId: context.financialSpaceId!,
      createdByUserId: context.userId,
      strategyType: strategy,
      monthlyIncomeSnapshot: profile.monthlyIncome,
      availableCapitalSnapshot: profile.availableCapital,
      totalFixedCostsSnapshot: budget.totalFixedCosts,
      reservePercentage: profile.reservePercentage,
      monthlyBudget: budget.availableBudget,
      aiAnalysis: aiResult,
      aiPrompt: prompt,
      actions: actions.map((a) => ({
        debtId: a.debtId,
        debtLabel: a.debtLabel,
        debtType: a.debtType,
        month: a.month,
        paymentAmount: a.paymentAmount,
        principalAmount: a.principalAmount,
        interestAmount: a.interestAmount,
        runningBalance: a.runningBalance,
      })),
    });

    // 11. Fetch actions for response
    const persistedActions = await this.planActionRepo.findByPlanId(plan.id);

    const durationMs = Date.now() - startTime;
    logger.info(
      {
        operation: 'plan.generate',
        strategy,
        durationMs,
        planActionsCount: persistedActions.length,
        aiStatus,
      },
      'Plan generated'
    );

    return {
      plan,
      actions: persistedActions,
      aiAnalysis: aiResult,
      totalMonths,
      totalInterestPaid,
      financialFreedomDate,
      aiStatus,
    };
  }

  async retryAi(context: RequestContext, planId: string): Promise<RetryAiResult> {
    // 1. Find plan
    const plan = await this.debtPlanRepo.findById(planId);
    if (!plan || plan.financialSpaceId !== context.financialSpaceId) {
      throw new DomainError(PLAN_NOT_FOUND, 404, 'Plan not found');
    }

    // 2. Check if AI already done
    if (plan.aiAnalysis !== null) {
      throw new DomainError(PLAN_ALREADY_HAS_AI, 409, 'Plan already has AI analysis');
    }

    // 3. Check circuit breaker
    const now = Date.now();
    const pastCooldown =
      this.lastFailureTime !== null && now - this.lastFailureTime >= this.COOLDOWN_MS;
    if (this.circuitState === 'open' && !pastCooldown) {
      throw new DomainError(AI_CIRCUIT_OPEN, 503, 'AI circuit breaker is open — try again later');
    }

    if (this.circuitState === 'open' && pastCooldown) {
      this.circuitState = 'half-open';
    }

    // 4. Read aiPrompt from plan
    const aiPrompt = plan.aiPrompt as { systemPrompt: string; userPrompt: string } | null;
    if (!aiPrompt) {
      throw new DomainError(PLAN_NOT_FOUND, 404, 'Plan has no AI prompt stored');
    }

    // 5. Call Claude
    const rawResult = await this.claudeClientSkill.call(aiPrompt);

    if (rawResult === null) {
      this.consecutiveFailures += 1;
      this.lastFailureTime = Date.now();
      if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
        this.circuitState = 'open';
      }
      return { plan, aiAnalysis: null, aiStatus: 'timeout' };
    }

    // 6. Update plan with AI result
    const updatedPlan = await this.debtPlanRepo.updateAiAnalysis(
      plan.id,
      rawResult as unknown as import('@prisma/client').Prisma.InputJsonValue
    );

    this.consecutiveFailures = 0;
    this.circuitState = 'closed';

    return { plan: updatedPlan, aiAnalysis: rawResult, aiStatus: 'success' };
  }

  async getActivePlan(context: RequestContext): Promise<ActivePlanResult> {
    const plan = await this.debtPlanRepo.findActiveBySpaceId(context.financialSpaceId!);
    if (!plan) {
      throw new DomainError(NO_ACTIVE_PLAN, 404, 'No active plan found');
    }

    const actions = await this.planActionRepo.findByPlanId(plan.id);
    return { plan, actions };
  }

  async getPlanHistory(context: RequestContext): Promise<DebtPlan[]> {
    return this.debtPlanRepo.findAllBySpaceId(context.financialSpaceId!);
  }
}
