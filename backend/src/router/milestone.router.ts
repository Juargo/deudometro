// ROUTER: Milestone routes — GET/PATCH /api/milestones
// Spec: specs/ROUTER.md §4

import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { MilestoneRepository } from '../repositories/MilestoneRepository'
import { getMilestones, acknowledgeMilestone } from '../managers/ProgressManager'
import { enrichMilestone } from '../lib/milestone-labels'

const router = Router()
const milestoneRepo = new MilestoneRepository(prisma)

// GET /api/milestones — GET_MILESTONES
router.get('/milestones', authMiddleware, async (req: Request, res: Response) => {
  const filter = (req.query.filter as 'pending' | 'acknowledged' | 'all') || 'all'
  const result = await getMilestones({ userId: req.userId, filter }, milestoneRepo)
  res.json({
    milestones: result.milestones.map(enrichMilestone),
    pendingCount: result.pendingCount,
  })
})

// PATCH /api/milestones/:id/acknowledge — ACKNOWLEDGE_MILESTONE
router.patch('/milestones/:id/acknowledge', authMiddleware, async (req: Request, res: Response) => {
  const result = await acknowledgeMilestone({ userId: req.userId, milestoneId: req.params.id as string }, milestoneRepo)

  if (!result.success) {
    const statusMap: Record<string, number> = {
      MILESTONE_NOT_FOUND: 404,
      ALREADY_ACKNOWLEDGED: 409,
    }
    const messages: Record<string, string> = {
      MILESTONE_NOT_FOUND: 'Milestone no encontrado',
      ALREADY_ACKNOWLEDGED: 'Este logro ya fue reconocido',
    }
    res.status(statusMap[result.error] ?? 400).json({ error: result.error, message: messages[result.error] })
    return
  }

  res.json({ milestone: enrichMilestone(result.milestone as unknown as Record<string, unknown>) })
})

export { router as milestoneRouter }
