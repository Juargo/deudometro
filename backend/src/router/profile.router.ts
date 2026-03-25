// ROUTER: Profile routes — POST/GET/PATCH /api/profile
// Spec: specs/ROUTER.md §4

import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { UserRepository } from '../repositories/UserRepository'
import type { FixedExpenses } from '../types/domain'

const router = Router()
const userRepo = new UserRepository(prisma)

// POST /api/profile — CREATE_PROFILE
router.post('/profile', authMiddleware, async (req: Request, res: Response) => {
  const { displayName, monthlyIncome, fixedExpenses } = req.body

  if (!displayName || monthlyIncome == null || !fixedExpenses) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'displayName, monthlyIncome y fixedExpenses son requeridos' })
    return
  }

  // Rule 4: reject if profile already exists
  const existing = await userRepo.getByAuthUserId(req.authUserId)
  if (existing) {
    res.status(409).json({ error: 'PROFILE_ALREADY_EXISTS', message: 'Ya existe un perfil para este usuario' })
    return
  }

  const profile = await userRepo.create({
    authUserId: req.authUserId,
    displayName,
    monthlyIncome,
    fixedExpenses,
  })

  res.status(201).json({ profile })
})

// GET /api/profile — GET_PROFILE
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  const profile = await userRepo.getByAuthUserId(req.authUserId)
  if (!profile) {
    res.status(404).json({ error: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' })
    return
  }

  const fixedExpenses = profile.fixedExpenses as unknown as FixedExpenses
  const totalFixedCosts = Object.values(fixedExpenses).reduce((s, v) => s + (v ?? 0), 0)

  res.json({ profile: { ...profile, totalFixedCosts } })
})

// PATCH /api/profile — UPDATE_PROFILE
router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  const { displayName, monthlyIncome, fixedExpenses } = req.body

  const profile = await userRepo.update(req.authUserId, {
    ...(displayName !== undefined && { displayName }),
    ...(monthlyIncome !== undefined && { monthlyIncome }),
    ...(fixedExpenses !== undefined && { fixedExpenses }),
  })

  res.json({ profile })
})

export { router as profileRouter }
