// SKILL: milestone-detector
// Spec: specs/skills/SKILL-milestone-detector.md
// Detects but does NOT persist milestones — pure detection logic.

import type { MilestoneType } from '../types/domain'
import type { MilestoneRepository } from '../repositories/MilestoneRepository'

export interface DebtSummary {
  id: string
  label: string
  originalBalance: number
  remainingBalance: number
}

export interface MilestoneData {
  userId: string
  debtId?: string | null
  type: MilestoneType
  context: Record<string, unknown>
}

export interface MilestoneDetectorInput {
  userId: string
  affectedDebtId: string
  isDebtPaidOff: boolean
  isFirstPaymentEver: boolean
  allUserDebts: DebtSummary[]
}

export interface MilestoneDetectorOutput {
  newMilestones: MilestoneData[]
}

export async function detectMilestones(
  input: MilestoneDetectorInput,
  milestoneRepo: MilestoneRepository
): Promise<MilestoneDetectorOutput> {
  const { userId, affectedDebtId, isDebtPaidOff, isFirstPaymentEver, allUserDebts } = input
  const newMilestones: MilestoneData[] = []

  // Load existing milestones to check uniqueness (Rule 6)
  const existing = await milestoneRepo.getByUserId(userId, 'all')
  const existingTypes = new Set(existing.map(m => m.type))

  // Rule 5 (order): first_payment → debt_paid_off → percentage milestones

  // BR-21: first payment ever
  if (isFirstPaymentEver && !existingTypes.has('first_payment')) {
    newMilestones.push({ userId, type: 'first_payment', context: { label: 'Primer pago', description: '¡Registraste tu primer pago! El camino a la libertad financiera comienza hoy.' } })
  }

  // BR-19: debt paid off
  if (isDebtPaidOff) {
    // Rule 6 exception: debt_paid_off can repeat for different debts
    const paidDebt = allUserDebts.find(d => d.id === affectedDebtId)
    const debtLabel = paidDebt?.label ?? 'Deuda'
    newMilestones.push({
      userId,
      debtId: affectedDebtId,
      type: 'debt_paid_off',
      context: {
        label: `¡${debtLabel} saldada!`,
        description: `Pagaste completamente "${debtLabel}". ¡Una deuda menos!`,
        debtLabel,
        originalBalance: paidDebt?.originalBalance ?? 0,
      },
    })
  }

  // BR-20: total reduction thresholds
  const totalOriginal = allUserDebts.reduce((sum, d) => sum + d.originalBalance, 0)
  const totalRemaining = allUserDebts.reduce((sum, d) => sum + d.remainingBalance, 0)

  if (totalOriginal > 0) {
    const reduced = (totalOriginal - totalRemaining) / totalOriginal

    const thresholds: Array<{ pct: number; type: MilestoneType }> = [
      { pct: 0.25, type: 'total_reduced_25pct' },
      { pct: 0.50, type: 'total_reduced_50pct' },
      { pct: 0.75, type: 'total_reduced_75pct' },
    ]

    for (const { pct, type } of thresholds) {
      if (reduced >= pct && !existingTypes.has(type)) {
        const pctLabel = Math.round(pct * 100)
        newMilestones.push({
          userId,
          type,
          context: {
            label: `${pctLabel}% de deuda reducida`,
            description: `Has reducido tu deuda total en un ${pctLabel}%. ¡Sigue así!`,
            percentageReduced: pctLabel,
            amountReduced: totalOriginal - totalRemaining,
            totalOriginal,
          },
        })
        // Add to existingTypes so we don't double-add in this same call
        existingTypes.add(type)
      }
    }
  }

  return { newMilestones }
}
