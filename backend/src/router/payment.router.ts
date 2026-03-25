// ROUTER: Payment routes — POST/GET /api/payments
// Spec: specs/ROUTER.md §4

import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { DebtRepository } from '../repositories/DebtRepository'
import { PaymentRepository } from '../repositories/PaymentRepository'
import { PlanRepository } from '../repositories/PlanRepository'
import { MilestoneRepository } from '../repositories/MilestoneRepository'
import { recordPaymentOp, getPaymentHistory } from '../managers/ProgressManager'

const router = Router()
const debtRepo = new DebtRepository(prisma)
const paymentRepo = new PaymentRepository(prisma)
const planRepo = new PlanRepository(prisma)
const milestoneRepo = new MilestoneRepository(prisma)

// POST /api/payments — RECORD_PAYMENT
router.post('/payments', authMiddleware, async (req: Request, res: Response) => {
  const { debtId, amount, paidAt, planActionId, notes } = req.body

  const result = await recordPaymentOp(
    { userId: req.userId, debtId, amount, paidAt: new Date(paidAt), planActionId, notes },
    debtRepo,
    paymentRepo,
    planRepo,
    milestoneRepo
  )

  if (!result.success) {
    const statusMap: Record<string, number> = {
      DEBT_NOT_FOUND: 404,
      DEBT_ALREADY_PAID: 422,
      PAYMENT_EXCEEDS_BALANCE: 422,
      INVALID_AMOUNT: 422,
      INVALID_PAYMENT_DATE: 422,
      PLAN_ACTION_NOT_FOUND: 404,
    }
    res.status(statusMap[result.error] ?? 400).json({ error: result.error, message: paymentErrors[result.error] })
    return
  }

  res.status(201).json({
    payment: result.payment,
    debtUpdate: result.debtUpdate,
    newMilestones: result.newMilestones,
  })
})

// GET /api/payments — GET_PAYMENTS
router.get('/payments', authMiddleware, async (req: Request, res: Response) => {
  // Rule 7: normalize query params
  const debtId = (req.query.debtId as string) || undefined
  const limit = Math.min(Number(req.query.limit) || 50, 100)
  const offset = Number(req.query.offset) || 0

  const result = await getPaymentHistory(
    { userId: req.userId, debtId, limit, offset },
    debtRepo,
    paymentRepo,
    planRepo
  )

  res.json({ payments: result.payments, total: result.total })
})

const paymentErrors: Record<string, string> = {
  DEBT_NOT_FOUND: 'Deuda no encontrada',
  DEBT_ALREADY_PAID: 'La deuda ya está saldada',
  PAYMENT_EXCEEDS_BALANCE: 'El monto excede el saldo restante',
  INVALID_AMOUNT: 'El monto debe ser mayor a 0',
  INVALID_PAYMENT_DATE: 'La fecha de pago no puede ser futura',
  PLAN_ACTION_NOT_FOUND: 'Acción de plan no encontrada',
}

export { router as paymentRouter }
