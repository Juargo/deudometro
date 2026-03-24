// MANAGER: DebtManager
// Spec: specs/managers/MANAGER-DebtManager.md
// Gestiona el ciclo de vida completo de las deudas: CRUD con validación de dominio.

import type { Debt } from '@prisma/client'
import type { DebtStatus, DebtType } from '../types/domain'
import type { ValidationError } from '../skills/debt-validator.skill'
import type { DebtEntryInput } from '../skills/debt-entry.skill'
import { entryDebt } from '../skills/debt-entry.skill'
import { validateDebt } from '../skills/debt-validator.skill'
import { detectCriticalDebts } from '../skills/critical-debt-detector.skill'
import type { DebtRepository } from '../repositories/DebtRepository'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DebtFormData = DebtEntryInput['formData']

export type EnrichedDebt = Debt & {
  isCritical: boolean
  monthlyInterestCost: number
}

export interface ListDebtsSummary {
  totalRemainingBalance: number
  totalMonthlyInterestCost: number
  totalMinimumPayments: number
  criticalCount: number
}

// ─── Operación 1: createDebt ───────────────────────────────────────────────────

export type CreateDebtOutput =
  | { success: true; debt: Debt }
  | { success: false; errors: ValidationError[] }

export async function createDebt(
  input: { userId: string; debtType: DebtType; formData: DebtFormData },
  debtRepo: DebtRepository
): Promise<CreateDebtOutput> {
  return entryDebt(input, debtRepo)
}

// ─── Operación 2: updateDebt ───────────────────────────────────────────────────

export type UpdateDebtOutput =
  | { success: true; debt: Debt }
  | { success: false; error: 'DEBT_NOT_FOUND' | 'DEBT_ALREADY_PAID' | string; errors?: ValidationError[] }

export async function updateDebt(
  input: { userId: string; debtId: string; patch: Partial<DebtFormData> },
  debtRepo: DebtRepository
): Promise<UpdateDebtOutput> {
  const { userId, debtId, patch } = input

  // Step 1: load current debt
  const existing = await debtRepo.getByIdAndUserId(debtId, userId)
  if (!existing) return { success: false, error: 'DEBT_NOT_FOUND' }

  // Step 3: reject edits on paid_off debts (BR-04)
  if (existing.status === 'paid_off') return { success: false, error: 'DEBT_ALREADY_PAID' }

  // Step 4: merge patch with current data
  const merged: DebtFormData = {
    label: patch.label ?? existing.label,
    lenderName: patch.lenderName !== undefined ? patch.lenderName : existing.lenderName,
    remainingBalance: patch.remainingBalance ?? Number(existing.remainingBalance),
    monthlyInterestRate:
      patch.monthlyInterestRate !== undefined
        ? patch.monthlyInterestRate
        : existing.monthlyInterestRate !== null
          ? Number(existing.monthlyInterestRate)
          : null,
    minimumPayment: patch.minimumPayment ?? Number(existing.minimumPayment),
    paymentDueDay: patch.paymentDueDay ?? existing.paymentDueDay,
    cutoffDay: patch.cutoffDay !== undefined ? patch.cutoffDay : existing.cutoffDay,
    metadata: patch.metadata ?? (existing.metadata as Record<string, unknown>),
  }

  // Step 5: validate merged data
  const validation = validateDebt({ debtType: existing.debtType as DebtType, formData: merged })
  if (!validation.isValid) return { success: false, error: 'VALIDATION_FAILED', errors: validation.errors }

  // Step 7: persist and return
  const updated = await debtRepo.update(debtId, merged)
  return { success: true, debt: updated }
}

// ─── Operación 3: listDebts ────────────────────────────────────────────────────

export interface ListDebtsOutput {
  success: true
  debts: EnrichedDebt[]
  summary: ListDebtsSummary
}

export async function listDebts(
  input: { userId: string; filters?: { status?: DebtStatus | DebtStatus[] } },
  debtRepo: DebtRepository
): Promise<ListDebtsOutput> {
  const { userId } = input

  // Step 1: fetch debts
  const allDebts = await debtRepo.getAllByUserId(userId)
  const statuses = input.filters?.status
    ? Array.isArray(input.filters.status)
      ? input.filters.status
      : [input.filters.status]
    : (['active'] as DebtStatus[])
  const debts = allDebts.filter(d => statuses.includes(d.status as DebtStatus))

  // Step 2: detect critical debts
  const detectorInput = debts.map(d => ({
    id: d.id,
    label: d.label,
    debtType: d.debtType as DebtType,
    remainingBalance: Number(d.remainingBalance),
    monthlyInterestRate: d.monthlyInterestRate !== null ? Number(d.monthlyInterestRate) : null,
    minimumPayment: Number(d.minimumPayment),
    status: d.status as import('../types/domain').DebtStatus,
  }))
  const { debts: enriched, criticalCount } = detectCriticalDebts({ debts: detectorInput })

  // Step 3: merge enrichment back onto Debt objects
  const enrichedDebts: EnrichedDebt[] = debts.map(d => {
    const e = enriched.find(r => r.id === d.id)!
    return { ...d, isCritical: e.isCritical, monthlyInterestCost: e.monthlyInterestCost }
  })

  // Step 4: compute summary
  const summary: ListDebtsSummary = {
    totalRemainingBalance: enrichedDebts.reduce((s, d) => s + Number(d.remainingBalance), 0),
    totalMonthlyInterestCost: enrichedDebts.reduce((s, d) => s + d.monthlyInterestCost, 0),
    totalMinimumPayments: enrichedDebts.reduce((s, d) => s + Number(d.minimumPayment), 0),
    criticalCount,
  }

  return { success: true, debts: enrichedDebts, summary }
}

// ─── Operación 4: archiveDebt ──────────────────────────────────────────────────

export type ArchiveDebtOutput =
  | { success: true }
  | { success: false; error: 'DEBT_NOT_FOUND' }

export async function archiveDebt(
  input: { userId: string; debtId: string },
  debtRepo: DebtRepository
): Promise<ArchiveDebtOutput> {
  const { userId, debtId } = input

  // Step 1: verify ownership
  const debt = await debtRepo.getByIdAndUserId(debtId, userId)
  if (!debt) return { success: false, error: 'DEBT_NOT_FOUND' }

  // Step 3: archive (status → frozen)
  await debtRepo.archive(debtId)
  return { success: true }
}
