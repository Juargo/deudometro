// ROUTER: Debt routes — POST/GET/PATCH/DELETE /api/debts
// Spec: specs/ROUTER.md §4

import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { DebtRepository } from '../repositories/DebtRepository'
import { createDebt, updateDebt, listDebts, archiveDebt } from '../managers/DebtManager'
import type { DebtStatus } from '../types/domain'

const router = Router()
const debtRepo = new DebtRepository(prisma)

// POST /api/debts — REGISTER_DEBT
router.post('/debts', authMiddleware, async (req: Request, res: Response) => {
  const { debtType, formData } = req.body
  const result = await createDebt({ userId: req.userId, debtType, formData }, debtRepo)

  if (!result.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', errors: result.errors })
    return
  }

  res.status(201).json({ debt: result.debt })
})

// GET /api/debts — LIST_DEBTS
router.get('/debts', authMiddleware, async (req: Request, res: Response) => {
  // Rule 7: normalize empty strings to undefined
  const statusParam = req.query.status as string | undefined
  let filters: { status?: DebtStatus | DebtStatus[] } | undefined

  if (statusParam) {
    const statuses = statusParam.split(',').filter(Boolean) as DebtStatus[]
    filters = { status: statuses.length === 1 ? statuses[0] : statuses }
  }

  const result = await listDebts({ userId: req.userId, filters }, debtRepo)
  res.json({ debts: result.debts, summary: result.summary })
})

// PATCH /api/debts/:id — UPDATE_DEBT
router.patch('/debts/:id', authMiddleware, async (req: Request, res: Response) => {
  const result = await updateDebt({ userId: req.userId, debtId: req.params.id as string, patch: req.body }, debtRepo)

  if (!result.success) {
    if (result.error === 'DEBT_NOT_FOUND') {
      res.status(404).json({ error: 'DEBT_NOT_FOUND', message: 'Deuda no encontrada' })
      return
    }
    if (result.error === 'DEBT_ALREADY_PAID') {
      res.status(422).json({ error: 'DEBT_ALREADY_PAID', message: 'No se puede editar una deuda saldada' })
      return
    }
    res.status(400).json({ error: 'VALIDATION_ERROR', errors: result.errors })
    return
  }

  res.json({ debt: result.debt })
})

// DELETE /api/debts/:id — ARCHIVE_DEBT
router.delete('/debts/:id', authMiddleware, async (req: Request, res: Response) => {
  const result = await archiveDebt({ userId: req.userId, debtId: req.params.id as string }, debtRepo)

  if (!result.success) {
    res.status(404).json({ error: 'DEBT_NOT_FOUND', message: 'Deuda no encontrada' })
    return
  }

  res.json({ success: true })
})

export { router as debtRouter }
