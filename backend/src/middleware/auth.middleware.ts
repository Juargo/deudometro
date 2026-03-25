import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory JWT validation cache — 60s TTL (spec: ROUTER.md §1)
const tokenCache = new Map<string, { authUserId: string; userId: string | null; expiresAt: number }>()

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
    req.authUserId = cached.authUserId
    req.userId = cached.userId ?? cached.authUserId
    next()
    return
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token inválido o expirado' })
    return
  }

  const authUserId = data.user.id

  // Resolve authUserId → UserProfile.id
  const profile = await prisma.userProfile.findUnique({ where: { authUserId } })
  const userId = profile?.id ?? null

  // Cache for 60 seconds
  tokenCache.set(token, { authUserId, userId, expiresAt: now + 60_000 })
  req.authUserId = authUserId
  req.userId = userId ?? authUserId
  next()
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      authUserId: string
      userId: string
    }
  }
}
