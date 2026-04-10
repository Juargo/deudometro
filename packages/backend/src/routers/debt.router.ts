import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { DebtManager } from '../managers/debt.manager';
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

function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
      return;
    }
    req.query = result.data;
    next();
  };
}

type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

const debtTypeEnum = z.enum(['credit_card', 'consumer_loan', 'mortgage', 'informal_lender']);

const createDebtSchema = z.object({
  label: z.string().min(1).max(100),
  debtType: debtTypeEnum,
  lenderName: z.string().min(1).max(100),
  balance: z.number().positive(),
  monthlyInterestRate: z.number().min(0).max(99.9999),
  minimumPayment: z.number().positive(),
  paymentDueDay: z.number().int().min(1).max(31),
  cutoffDay: z.number().int().min(1).max(31).optional(),
  isShared: z.boolean().optional().default(false),
  metadata: z
    .object({
      hasInterest: z.boolean().optional(),
      urgency: z.enum(['low', 'medium', 'high']).optional(),
    })
    .optional(),
});

const updateDebtSchema = z
  .object({
    label: z.string().min(1).max(100).optional(),
    lenderName: z.string().min(1).max(100).optional(),
    remainingBalance: z.number().min(0).optional(),
    monthlyInterestRate: z.number().min(0).max(99.9999).optional(),
    minimumPayment: z.number().positive().optional(),
    paymentDueDay: z.number().int().min(1).max(31).optional(),
    cutoffDay: z.number().int().min(1).max(31).nullable().optional(),
    metadata: z
      .object({
        hasInterest: z.boolean().optional(),
        urgency: z.enum(['low', 'medium', 'high']).optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

const toggleSharedSchema = z.object({ isShared: z.boolean() });

const listDebtsQuery = z.object({
  status: z.enum(['active', 'frozen', 'paid_off']).optional().default('active'),
});

export function createDebtRouter(
  debtManager: DebtManager,
  jwtMiddleware: MiddlewareFn,
  spaceResolver: MiddlewareFn
): Router {
  const router = Router();

  router.post(
    '/debts',
    jwtMiddleware,
    spaceResolver,
    validate(createDebtSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const debt = await debtManager.createDebt(context, req.body);
        res.status(201).json({ debt });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/debts',
    jwtMiddleware,
    spaceResolver,
    validateQuery(listDebtsQuery),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const status = req.query.status as 'active' | 'frozen' | 'paid_off' | undefined;
        const debts = await debtManager.listDebts(context, { status });
        res.status(200).json({ debts });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/debts/:id',
    jwtMiddleware,
    spaceResolver,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const debt = await debtManager.getDebt(context, req.params.id as string);
        res.status(200).json({ debt });
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/debts/:id',
    jwtMiddleware,
    spaceResolver,
    validate(updateDebtSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const debt = await debtManager.updateDebt(context, req.params.id as string, req.body);
        res.status(200).json({ debt });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/debts/:id/archive',
    jwtMiddleware,
    spaceResolver,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const debt = await debtManager.archiveDebt(context, req.params.id as string);
        res.status(200).json({ debt });
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/debts/:id/shared',
    jwtMiddleware,
    spaceResolver,
    validate(toggleSharedSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const debt = await debtManager.toggleShared(context, req.params.id as string, req.body.isShared);
        res.status(200).json({ debt });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
