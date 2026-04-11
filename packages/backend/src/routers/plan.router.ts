import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { AnalysisManager } from '../managers/analysis.manager';
import type { AuthenticatedRequest, RequestContext } from '../shared/types';

function getContext(req: Request): RequestContext {
  return (req as unknown as AuthenticatedRequest).context;
}

function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
      return;
    }
    req.body = result.data;
    next();
  };
}

function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
      return;
    }
    next();
  };
}

function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
      return;
    }
    req.query = result.data;
    next();
  };
}

type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

const generatePlanSchema = z.object({
  strategy: z.enum(['avalanche', 'snowball', 'hybrid', 'crisis_first', 'guided_consolidation']),
});

const planIdSchema = z.object({
  id: z.string().uuid(),
});

const listQuerySchema = z.object({
  status: z.enum(['active', 'frozen', 'paid_off']).optional(),
});

function serializePlan(
  plan: import('@prisma/client').DebtPlan,
  extras?: { totalMonths?: number; totalInterestPaid?: number; financialFreedomDate?: Date; aiStatus?: string }
) {
  return {
    id: plan.id,
    financialSpaceId: plan.financialSpaceId,
    strategy: plan.strategyType,
    status: plan.status,
    monthlyBudget: plan.monthlyBudget.toNumber(),
    monthlyIncomeSnapshot: plan.monthlyIncomeSnapshot.toNumber(),
    availableCapitalSnapshot: plan.availableCapitalSnapshot.toNumber(),
    totalFixedCostsSnapshot: plan.totalFixedCostsSnapshot.toNumber(),
    reservePercentage: plan.reservePercentage.toNumber(),
    aiAnalysis: plan.aiAnalysis,
    financialFreedomDate: plan.financialFreedomDate?.toISOString() ?? extras?.financialFreedomDate?.toISOString() ?? null,
    totalMonths: extras?.totalMonths ?? null,
    totalInterestPaid: extras?.totalInterestPaid ?? null,
    aiStatus: extras?.aiStatus ?? (plan.aiAnalysis ? 'success' : 'timeout'),
    createdByUserId: plan.createdByUserId,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

function serializePlanAction(action: import('@prisma/client').PlanAction) {
  return {
    id: action.id,
    planId: action.debtPlanId,
    debtId: action.debtId,
    debtLabel: action.debtLabel,
    debtType: action.debtType,
    month: action.month,
    paymentAmount: action.paymentAmount.toNumber(),
    principalAmount: action.principalAmount.toNumber(),
    interestAmount: action.interestAmount.toNumber(),
    remainingBalance: action.runningBalance.toNumber(),
  };
}

function computePlanExtras(actions: import('@prisma/client').PlanAction[]) {
  if (actions.length === 0) return { totalMonths: 0, totalInterestPaid: 0 };
  const totalMonths = Math.max(...actions.map((a) => a.month));
  const totalInterestPaid = actions.reduce((sum, a) => sum + a.interestAmount.toNumber(), 0);
  return { totalMonths, totalInterestPaid };
}

export function createPlanRouter(
  analysisManager: AnalysisManager,
  jwtMiddleware: MiddlewareFn,
  spaceResolver: MiddlewareFn
): Router {
  const router = Router();

  // POST /plan/generate — generate a new debt repayment plan
  router.post(
    '/plan/generate',
    jwtMiddleware,
    spaceResolver,
    validate(generatePlanSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const { strategy } = req.body as z.infer<typeof generatePlanSchema>;
        const result = await analysisManager.generatePlan(context, strategy);
        res.status(201).json({
          plan: serializePlan(result.plan, {
            totalMonths: result.totalMonths,
            totalInterestPaid: result.totalInterestPaid.toNumber(),
            financialFreedomDate: result.financialFreedomDate,
            aiStatus: result.aiStatus,
          }),
          actions: result.actions.map(serializePlanAction),
          aiStatus: result.aiStatus,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /plan — get active plan with actions
  router.get(
    '/plan',
    jwtMiddleware,
    spaceResolver,
    validateQuery(listQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const result = await analysisManager.getActivePlan(context);
        if (!result) {
          res.status(200).json({ plan: null, actions: [] });
          return;
        }
        const extras = computePlanExtras(result.actions);
        res.status(200).json({
          plan: serializePlan(result.plan, { totalMonths: extras.totalMonths, totalInterestPaid: extras.totalInterestPaid }),
          actions: result.actions.map(serializePlanAction),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /plan/history — list all plans for the space
  router.get(
    '/plan/history',
    jwtMiddleware,
    spaceResolver,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const plans = await analysisManager.getPlanHistory(context);
        res.status(200).json({ plans: plans.map((p) => serializePlan(p)) });
      } catch (err) {
        next(err);
      }
    }
  );

  // POST /plan/:id/retry-ai — retry AI analysis for a plan that timed out
  router.post(
    '/plan/:id/retry-ai',
    jwtMiddleware,
    spaceResolver,
    validateParams(planIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const result = await analysisManager.retryAi(context, req.params.id as string);
        res.status(200).json({
          plan: serializePlan(result.plan, { aiStatus: result.aiStatus }),
          aiAnalysis: result.aiAnalysis,
          aiStatus: result.aiStatus,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
