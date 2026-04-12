import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { ProgressManager } from '../managers/progress.manager';
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

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const recordPaymentSchema = z.object({
  debtId: z.string().uuid(),
  amount: z.number().positive(),
  paidAt: z.string().datetime().optional(),
});

const paymentQuerySchema = z.object({
  debtId: z.string().uuid().optional(),
});

const milestoneIdSchema = z.object({
  id: z.string().uuid(),
});

export function createPaymentRouter(
  progressManager: ProgressManager,
  jwtMiddleware: MiddlewareFn,
  spaceResolver: MiddlewareFn
): Router {
  const router = Router();

  // POST /payments — record a payment
  router.post(
    '/payments',
    jwtMiddleware,
    spaceResolver,
    validate(recordPaymentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

        if (!idempotencyKey || !uuidRegex.test(idempotencyKey)) {
          res.status(400).json({
            error: 'VALIDATION_ERROR',
            details: { 'Idempotency-Key': ['Must be a valid UUID'] },
          });
          return;
        }

        const { debtId, amount, paidAt } = req.body as z.infer<typeof recordPaymentSchema>;
        const result = await progressManager.recordPayment(context, {
          debtId,
          amount,
          paidAt: paidAt ? new Date(paidAt) : undefined,
          idempotencyKey,
        });

        res.status(201).json({
          payment: serializePayment(result.payment),
          updatedDebt: {
            id: result.debt.id,
            remainingBalance: result.debt.remainingBalance.toString(),
            status: result.debt.status,
          },
          milestones: result.milestones.map(serializeMilestone),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /payments — list payment history
  router.get(
    '/payments',
    jwtMiddleware,
    spaceResolver,
    validateQuery(paymentQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const debtId = req.query.debtId as string | undefined;
        const payments = await progressManager.getPaymentHistory(context, { debtId });
        res.status(200).json({ payments: payments.map(serializePayment) });
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /payments/alerts — upcoming payment alerts
  router.get(
    '/payments/alerts',
    jwtMiddleware,
    spaceResolver,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const alerts = await progressManager.getUpcomingAlerts(context);
        res.status(200).json({ alerts });
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /milestones — list milestones
  router.get(
    '/milestones',
    jwtMiddleware,
    spaceResolver,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const milestones = await progressManager.getMilestones(context);
        res.status(200).json({ milestones: milestones.map(serializeMilestone) });
      } catch (err) {
        next(err);
      }
    }
  );

  // POST /milestones/:id/acknowledge
  router.post(
    '/milestones/:id/acknowledge',
    jwtMiddleware,
    spaceResolver,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = milestoneIdSchema.safeParse({ id: req.params.id });
        if (!parsed.success) {
          res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });
          return;
        }
        const context = getContext(req);
        const milestone = await progressManager.acknowledgeMilestone(context, parsed.data.id);
        res.status(200).json({ milestone: serializeMilestone(milestone) });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

function serializePayment(payment: import('@prisma/client').Payment & { debt?: { label: string } }) {
  return {
    id: payment.id,
    debtId: payment.debtId,
    debtLabel: payment.debt?.label ?? null,
    financialSpaceId: payment.financialSpaceId,
    recordedByUserId: payment.recordedByUserId,
    amount: payment.amount.toString(),
    principalAmount: payment.principalAmount.toString(),
    interestAmount: payment.interestAmount.toString(),
    paidAt: payment.paidAt.toISOString(),
    idempotencyKey: payment.idempotencyKey,
    createdAt: payment.createdAt.toISOString(),
  };
}

function serializeMilestone(milestone: import('@prisma/client').Milestone) {
  return {
    id: milestone.id,
    financialSpaceId: milestone.financialSpaceId,
    milestoneType: milestone.milestoneType,
    debtId: milestone.debtId,
    message: milestone.message,
    acknowledgedAt: milestone.acknowledgedAt ? milestone.acknowledgedAt.toISOString() : null,
    createdAt: milestone.createdAt.toISOString(),
  };
}
