import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory JWT validation cache — 60s TTL (spec: ROUTER.md §1)
const tokenCache = new Map<string, { userId: string; expiresAt: number }>()

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Authorization header missing' })
    return
  }

  const token = authHeader.slice(7)
  const now = Date.now()

  // Check cache first
  const cached = tokenCache.get(token)
  if (cached && cached.expiresAt > now) {
    req.userId = cached.userId
    next()
    return
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token inválido o expirado' })
    return
  }

  // Cache valid tokens for 60 seconds
  tokenCache.set(token, { userId: data.user.id, expiresAt: now + 60_000 })
  req.userId = data.user.id
  next()
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}
