import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { ProfileManager } from '../managers/profile.manager';
import type { AuthenticatedRequest, RequestContext } from '../shared/types';

function getContext(req: Request): RequestContext {
  return (req as unknown as AuthenticatedRequest).context;
}

function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
      return;
    }
    req.body = result.data;
    next();
  };
}

type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

const updateFinancialProfileSchema = z
  .object({
    displayName: z.string().min(1).max(100).optional(),
    monthlyIncome: z.number().min(0).optional(),
    availableCapital: z.number().min(0).optional(),
    monthlyAllocation: z.number().min(0).optional(),
    fixedExpenses: z
      .object({
        rent: z.number().min(0),
        utilities: z.number().min(0),
        food: z.number().min(0),
        transport: z.number().min(0),
        other: z.number().min(0),
      })
      .optional(),
    reservePercentage: z.number().min(0).max(50).optional(),
    employmentStatus: z.enum(['employed', 'independent', 'unemployed']).optional(),
    investmentKnowledge: z.enum(['high', 'medium', 'low']).optional(),
    financialIntention: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

function serializeProfile(profile: import('@prisma/client').UserProfile) {
  return {
    id: profile.id,
    supabaseUserId: profile.supabaseUserId,
    email: profile.email,
    displayName: profile.displayName,
    monthlyIncome: profile.monthlyIncome.toNumber(),
    availableCapital: profile.availableCapital.toNumber(),
    monthlyAllocation: profile.monthlyAllocation.toNumber(),
    fixedExpenses: profile.fixedExpenses,
    reservePercentage: profile.reservePercentage.toNumber(),
    employmentStatus: profile.employmentStatus,
    investmentKnowledge: profile.investmentKnowledge,
    financialIntention: profile.financialIntention,
    financialSpaceId: profile.financialSpaceId,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function serializeBudget(budget: import('../skills/get-available-budget.skill').BudgetBreakdown) {
  return {
    effectiveIncome: budget.effectiveIncome.toNumber(),
    incomeSource: budget.incomeSource,
    totalFixedCosts: budget.totalFixedCosts.toNumber(),
    netAfterExpenses: budget.netAfterExpenses.toNumber(),
    reserveAmount: budget.reserveAmount.toNumber(),
    minimumPaymentsTotal: budget.minimumPaymentsTotal?.toNumber() ?? null,
    availableBudget: budget.availableBudget.toNumber(),
    budgetWarning: budget.budgetWarning,
  };
}

export function createProfileRouter(
  profileManager: ProfileManager,
  jwtMiddleware: MiddlewareFn,
  spaceResolver: MiddlewareFn
): Router {
  const router = Router();

  router.get('/profile', jwtMiddleware, spaceResolver, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      const summary = await profileManager.getFinancialSummary(context);
      res.status(200).json({ profile: serializeProfile(summary.profile), budget: serializeBudget(summary.budget) });
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/profile/financial',
    jwtMiddleware,
    spaceResolver,
    validate(updateFinancialProfileSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const profile = await profileManager.updateFinancialProfile(context, req.body);
        res.status(200).json({ profile: serializeProfile(profile) });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/profile/budget', jwtMiddleware, spaceResolver, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      const { budget } = await profileManager.getFinancialSummary(context);
      res.status(200).json({ budget: serializeBudget(budget) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
