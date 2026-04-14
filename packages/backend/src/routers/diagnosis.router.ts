import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { DiagnosisManager } from '../managers/diagnosis.manager';
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

type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

const generateDiagnosisSchema = z.object({
  financialIntention: z.string().min(1).max(5000),
});

export function createDiagnosisRouter(
  diagnosisManager: DiagnosisManager,
  jwtMiddleware: MiddlewareFn,
  spaceResolver: MiddlewareFn
): Router {
  const router = Router();

  // POST / — generate a financial diagnosis
  router.post(
    '/',
    jwtMiddleware,
    spaceResolver,
    validate(generateDiagnosisSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = getContext(req);
        const { financialIntention } = req.body as z.infer<typeof generateDiagnosisSchema>;
        const result = await diagnosisManager.generateDiagnosis(context, financialIntention);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
