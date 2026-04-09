import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthenticatedRequest } from '../types';

// Supabase JWKS URL for token verification
const JWKS_URL = new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
const jwks = createRemoteJWKSet(JWKS_URL);

export async function jwtMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'MISSING_TOKEN' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
    });

    (req as AuthenticatedRequest).context = {
      userId: payload.sub!,
      email: (payload.email as string) || '',
    };
    next();
  } catch (err: unknown) {
    const message = err instanceof Error && err.message.includes('expired') ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    res.status(401).json({ error: message });
  }
}
