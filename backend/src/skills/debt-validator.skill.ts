// SKILL: debt-validator
// Spec: specs/skills/SKILL-debt-validator.md
// Pure validation — no side effects, no DB access.

import type { DebtType } from '../types/domain'

export interface ValidationError {
  field: string
  code: string
  message: string
}

export interface DebtValidatorInput {
  debtType: DebtType
  formData: {
    label: string
    remainingBalance: number
    monthlyInterestRate?: number | null
    minimumPayment: number
    paymentDueDay: number
    cutoffDay?: number | null
    metadata: Record<string, unknown>
  }
}

export interface DebtValidatorOutput {
  isValid: boolean
  errors: ValidationError[]
}

export function validateDebt(input: DebtValidatorInput): DebtValidatorOutput {
  const { debtType, formData } = input
  const errors: ValidationError[] = []

  // Rule 1-2: label
  if (!formData.label || formData.label.trim().length === 0) {
    errors.push({ field: 'label', code: 'INVALID_LABEL', message: 'El nombre no puede estar vacío' })
  } else if (formData.label.length > 60) {
    errors.push({ field: 'label', code: 'INVALID_LABEL', message: 'El nombre no puede superar 60 caracteres' })
  }

  // Rule 3: remainingBalance > 0
  if (formData.remainingBalance <= 0) {
    errors.push({ field: 'remainingBalance', code: 'INVALID_BALANCE', message: 'El saldo debe ser mayor a 0' })
  }

  // Rule 4: monthlyInterestRate required for non-informal_lender
  if (debtType !== 'informal_lender') {
    if (formData.monthlyInterestRate == null) {
      errors.push({
        field: 'monthlyInterestRate',
        code: 'MISSING_INTEREST_RATE',
        message: 'La tasa de interés mensual es obligatoria para este tipo de deuda',
      })
    } else if (formData.monthlyInterestRate < 0 || formData.monthlyInterestRate > 99.9999) {
      // Rule 5: valid range
      errors.push({
        field: 'monthlyInterestRate',
        code: 'INVALID_INTEREST_RATE',
        message: 'La tasa mensual debe estar entre 0 y 99.9999',
      })
    }
  } else if (formData.monthlyInterestRate != null) {
    // Rule 5 applied to informal_lender if value is provided
    if (formData.monthlyInterestRate < 0 || formData.monthlyInterestRate > 99.9999) {
      errors.push({
        field: 'monthlyInterestRate',
        code: 'INVALID_INTEREST_RATE',
        message: 'La tasa mensual debe estar entre 0 y 99.9999',
      })
    }
  }

  // Rule 6: minimumPayment <= remainingBalance
  if (formData.minimumPayment > formData.remainingBalance) {
    errors.push({
      field: 'minimumPayment',
      code: 'MINIMUM_EXCEEDS_BALANCE',
      message: 'El pago mínimo no puede superar el saldo restante',
    })
  }

  // Rule 7: paymentDueDay 1-31
  if (
    !Number.isInteger(formData.paymentDueDay) ||
    formData.paymentDueDay < 1 ||
    formData.paymentDueDay > 31
  ) {
    errors.push({ field: 'paymentDueDay', code: 'INVALID_DUE_DAY', message: 'El día de vencimiento debe estar entre 1 y 31' })
  }

  // Rule 8: cutoffDay for non-credit_card is ignored (not an error)
  // Rule 9: cutoffDay 1-31 for credit_card (if provided)
  if (debtType === 'credit_card' && formData.cutoffDay != null) {
    if (
      !Number.isInteger(formData.cutoffDay) ||
      formData.cutoffDay < 1 ||
      formData.cutoffDay > 31
    ) {
      errors.push({ field: 'cutoffDay', code: 'INVALID_CUTOFF_DAY', message: 'El día de corte debe estar entre 1 y 31' })
    }
  }

  // Rule 10: metadata shape per debtType
  const metadataError = validateMetadata(debtType, formData.metadata)
  if (metadataError) {
    errors.push({ field: 'metadata', code: 'INVALID_METADATA', message: metadataError })
  }

  return { isValid: errors.length === 0, errors }
}

function validateMetadata(debtType: DebtType, meta: Record<string, unknown>): string | null {
  switch (debtType) {
    case 'credit_card':
      if (typeof meta.creditLimit !== 'number' || meta.creditLimit <= 0)
        return 'creditLimit debe ser un número mayor a 0'
      if (typeof meta.isActivelyUsed !== 'boolean')
        return 'isActivelyUsed debe ser un booleano'
      break

    case 'consumer_loan':
      if (typeof meta.totalInstallments !== 'number' || meta.totalInstallments < 1)
        return 'totalInstallments debe ser un número mayor a 0'
      if (typeof meta.remainingInstallments !== 'number' || meta.remainingInstallments < 0)
        return 'remainingInstallments debe ser un número no negativo'
      if (typeof meta.hasInsurance !== 'boolean')
        return 'hasInsurance debe ser un booleano'
      if (typeof meta.allowsEarlyPayment !== 'boolean')
        return 'allowsEarlyPayment debe ser un booleano'
      break

    case 'mortgage':
      if (typeof meta.remainingInstallments !== 'number' || meta.remainingInstallments < 0)
        return 'remainingInstallments debe ser un número no negativo'
      if (typeof meta.isFixedRate !== 'boolean')
        return 'isFixedRate debe ser un booleano'
      if (typeof meta.hasInsurance !== 'boolean')
        return 'hasInsurance debe ser un booleano'
      if (typeof meta.isDFL2 !== 'boolean')
        return 'isDFL2 debe ser un booleano'
      break

    case 'informal_lender':
      if (!['low', 'medium', 'high'].includes(meta.urgencyLevel as string))
        return 'urgencyLevel debe ser "low", "medium" o "high"'
      if (meta.hasInterest !== null && meta.hasInterest !== undefined && typeof meta.hasInterest !== 'boolean')
        return 'hasInterest debe ser booleano o null'
      break
  }
  return null
}
