import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { AuthManager } from '../managers/auth.manager';
import type { InvitationManager } from '../managers/invitation.manager';
import type { FinancialSpaceManager } from '../managers/financial-space.manager';
import type { ProfileResolverSkill } from '../skills/profile-resolver.skill';
import type { AuthenticatedRequest, RequestContext } from '../shared/types';
import { jwtMiddleware } from '../shared/middleware/jwt.middleware';

function getContext(req: Request): RequestContext {
  return (req as unknown as AuthenticatedRequest).context;
}

// Zod schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const createInvitationSchema = z.object({
  email: z.string().email(),
});

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

export function createAuthRouter(
  authManager: AuthManager,
  invitationManager: InvitationManager,
  financialSpaceManager: FinancialSpaceManager,
  profileResolverSkill: ProfileResolverSkill,
  spaceResolver: MiddlewareFn
): Router {
  const router = Router();

  // --- Public routes ---

  router.post('/auth/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, displayName } = req.body;
      const result = await authManager.register(email, password, displayName);
      res.status(201).json({ profile: result.profile, financialSpace: result.financialSpace });
    } catch (err) { next(err); }
  });

  router.post('/auth/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { token, profile } = await authManager.login(email, password);
      res.status(200).json({ token, ...profile });
    } catch (err) { next(err); }
  });

  router.post('/auth/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authManager.forgotPassword(req.body.email);
    } catch (_err) {
      // Swallow errors to prevent email enumeration
    }
    // Always 204 to prevent email enumeration
    res.status(204).send();
  });

  router.post('/auth/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authManager.resetPassword(req.body.token, req.body.newPassword);
      res.status(204).send();
    } catch (err) { next(err); }
  });

  // --- Protected routes (JWT required) ---

  router.post('/auth/logout', jwtMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization!.slice(7);
      await authManager.logout(token);
      res.status(204).send();
    } catch (err) { next(err); }
  });

  router.get('/me', jwtMiddleware, spaceResolver, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      const result = await profileResolverSkill.resolve(context.userId);
      res.status(200).json(result);
    } catch (err) { next(err); }
  });

  // --- Protected routes (JWT + space-resolver required) ---

  router.post('/invitations', jwtMiddleware, spaceResolver, validate(createInvitationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      const { invitation } = await invitationManager.createInvitation(context, req.body.email);
      res.status(201).json({ invitation });
    } catch (err) { next(err); }
  });

  router.get('/invitations', jwtMiddleware, spaceResolver, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      const invitations = await invitationManager.listInvitations(context);
      res.status(200).json({ invitations });
    } catch (err) { next(err); }
  });

  router.delete('/invitations/:id', jwtMiddleware, spaceResolver, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      await invitationManager.revokeInvitation(context, req.params.id as string);
      res.status(204).send();
    } catch (err) { next(err); }
  });

  router.post('/invitations/:token/accept', jwtMiddleware, spaceResolver, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      const member = await invitationManager.acceptInvitation(context, req.params.token as string);
      res.status(201).json({ member });
    } catch (err) { next(err); }
  });

  router.get('/financial-space', jwtMiddleware, spaceResolver, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = getContext(req);
      const result = await financialSpaceManager.getSpace(context);
      res.status(200).json(result);
    } catch (err) { next(err); }
  });

  return router;
}
