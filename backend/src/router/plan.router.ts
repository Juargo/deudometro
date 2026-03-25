// ROUTER: Plan routes — POST/GET /api/plan/*
// Spec: specs/ROUTER.md §4

import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { UserRepository } from '../repositories/UserRepository'
import { DebtRepository } from '../repositories/DebtRepository'
import { PlanRepository } from '../repositories/PlanRepository'
import { generatePlan } from '../managers/AnalysisManager'
import { getActivePlan, getPlanHistory, retryAiGeneration } from '../managers/PlanManager'

const router = Router()
const userRepo = new UserRepository(prisma)
const debtRepo = new DebtRepository(prisma)
const planRepo = new PlanRepository(prisma)

// UUID v4 regex for path param validation (Rule 5)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/plan/generate — GENERATE_PLAN
router.post('/plan/generate', authMiddleware, async (req: Request, res: Response) => {
  const { strategy, reservePercentage } = req.body

  // Rule 3: require UserProfile with monthlyIncome and fixedExpenses
  const user = await userRepo.getByAuthUserId(req.userId)
  if (!user || !user.monthlyIncome || !user.fixedExpenses) {
    res.status(422).json({ error: 'PROFILE_INCOMPLETE', message: 'Completa tu perfil con ingresos y gastos fijos antes de generar un plan' })
    return
  }

  const result = await generatePlan(
    { userId: req.userId, strategy, reservePercentage },
    userRepo,
    debtRepo,
    planRepo
  )

  if (!result.success) {
    res.status(422).json({ error: result.error, message: errorMessages[result.error], details: result.details })
    return
  }

  res.status(201).json({ plan: result.plan, aiGenerated: result.aiGenerated })
})

// GET /api/plan/active — GET_ACTIVE_PLAN
router.get('/plan/active', authMiddleware, async (req: Request, res: Response) => {
  const result = await getActivePlan({ userId: req.userId }, planRepo, debtRepo)
  res.json({ hasPlan: result.hasPlan, plan: result.plan })
})

// GET /api/plan/history — GET_PLAN_HISTORY
router.get('/plan/history', authMiddleware, async (req: Request, res: Response) => {
  const result = await getPlanHistory({ userId: req.userId }, planRepo)
  res.json({ plans: result.plans })
})

// POST /api/plan/:id/retry-ai — RETRY_AI_PLAN
router.post('/plan/:id/retry-ai', authMiddleware, async (req: Request, res: Response) => {
  // Rule 5: validate UUID
  if (!UUID_RE.test(req.params.id as string)) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ID de plan inválido' })
    return
  }

  const result = await retryAiGeneration({ userId: req.userId, planId: req.params.id as string }, planRepo, debtRepo)

  if (!result.success) {
    const statusMap: Record<string, number> = {
      PLAN_NOT_FOUND: 404,
      AI_ALREADY_GENERATED: 409,
      AI_GENERATION_FAILED: 422,
    }
    res.status(statusMap[result.error] ?? 500).json({ error: result.error, message: retryErrorMessages[result.error] })
    return
  }

  res.json({ aiOutput: result.aiOutput })
})

const errorMessages: Record<string, string> = {
  NO_ACTIVE_DEBTS: 'No tienes deudas activas para generar un plan',
  INSUFFICIENT_BUDGET: 'El presupuesto no alcanza para los pagos mínimos',
  NO_SURPLUS: 'Tus gastos fijos consumen todo tu ingreso',
}

const retryErrorMessages: Record<string, string> = {
  PLAN_NOT_FOUND: 'Plan no encontrado',
  AI_ALREADY_GENERATED: 'El resumen IA ya fue generado para este plan',
  AI_GENERATION_FAILED: 'Error al generar el resumen IA',
}

export { router as planRouter }
