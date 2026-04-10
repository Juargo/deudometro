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
        res.status(201).json(result);
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
        res.status(200).json(result);
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
        res.status(200).json({ plans });
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
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
