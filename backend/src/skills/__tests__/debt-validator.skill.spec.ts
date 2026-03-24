// Tests for debt-validator skill
// Each test group maps to a rule from SKILL-debt-validator.md

import { describe, it, expect } from 'vitest'
import { validateDebt } from '../debt-validator.skill'

const validCreditCard = {
  debtType: 'credit_card' as const,
  formData: {
    label: 'Tarjeta Visa BCI',
    remainingBalance: 500_000,
    monthlyInterestRate: 3.5,
    minimumPayment: 15_000,
    paymentDueDay: 15,
    cutoffDay: 5,
    metadata: { creditLimit: 1_000_000, isActivelyUsed: true },
  },
}

describe('debt-validator', () => {
  it('returns isValid: true for a valid credit_card input', () => {
    const result = validateDebt(validCreditCard)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // Rule 1: label empty
  it('Rule 1 — rejects empty label', () => {
    const result = validateDebt({ ...validCreditCard, formData: { ...validCreditCard.formData, label: '' } })
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.code === 'INVALID_LABEL')).toBe(true)
  })

  // Rule 2: label > 60 chars
  it('Rule 2 — rejects label longer than 60 characters', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, label: 'A'.repeat(61) },
    })
    expect(result.errors.some(e => e.code === 'INVALID_LABEL')).toBe(true)
  })

  // Rule 3: remainingBalance <= 0
  it('Rule 3 — rejects remainingBalance of 0', () => {
    const result = validateDebt({ ...validCreditCard, formData: { ...validCreditCard.formData, remainingBalance: 0 } })
    expect(result.errors.some(e => e.code === 'INVALID_BALANCE')).toBe(true)
  })

  it('Rule 3 — rejects negative remainingBalance', () => {
    const result = validateDebt({ ...validCreditCard, formData: { ...validCreditCard.formData, remainingBalance: -1 } })
    expect(result.errors.some(e => e.code === 'INVALID_BALANCE')).toBe(true)
  })

  // Rule 4: monthlyInterestRate required for non-informal
  it('Rule 4 — rejects missing rate for credit_card', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, monthlyInterestRate: null },
    })
    expect(result.errors.some(e => e.code === 'MISSING_INTEREST_RATE')).toBe(true)
  })

  it('Rule 4 — accepts missing rate for informal_lender', () => {
    const result = validateDebt({
      debtType: 'informal_lender',
      formData: {
        label: 'Préstamo amigo',
        remainingBalance: 100_000,
        monthlyInterestRate: null,
        minimumPayment: 10_000,
        paymentDueDay: 1,
        metadata: { hasInterest: false, urgencyLevel: 'low' },
      },
    })
    expect(result.errors.filter(e => e.code === 'MISSING_INTEREST_RATE')).toHaveLength(0)
  })

  // Rule 5: rate out of range
  it('Rule 5 — rejects rate above 99.9999', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, monthlyInterestRate: 100 },
    })
    expect(result.errors.some(e => e.code === 'INVALID_INTEREST_RATE')).toBe(true)
  })

  it('Rule 5 — rejects negative rate', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, monthlyInterestRate: -0.1 },
    })
    expect(result.errors.some(e => e.code === 'INVALID_INTEREST_RATE')).toBe(true)
  })

  // Rule 6: minimumPayment > remainingBalance
  it('Rule 6 — rejects minimumPayment > remainingBalance', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, minimumPayment: 600_000, remainingBalance: 500_000 },
    })
    expect(result.errors.some(e => e.code === 'MINIMUM_EXCEEDS_BALANCE')).toBe(true)
  })

  // Rule 7: paymentDueDay 1-31
  it('Rule 7 — rejects paymentDueDay of 0', () => {
    const result = validateDebt({ ...validCreditCard, formData: { ...validCreditCard.formData, paymentDueDay: 0 } })
    expect(result.errors.some(e => e.code === 'INVALID_DUE_DAY')).toBe(true)
  })

  it('Rule 7 — rejects paymentDueDay of 32', () => {
    const result = validateDebt({ ...validCreditCard, formData: { ...validCreditCard.formData, paymentDueDay: 32 } })
    expect(result.errors.some(e => e.code === 'INVALID_DUE_DAY')).toBe(true)
  })

  it('Rule 7 — accepts paymentDueDay of 31', () => {
    const result = validateDebt({ ...validCreditCard, formData: { ...validCreditCard.formData, paymentDueDay: 31 } })
    expect(result.errors.filter(e => e.code === 'INVALID_DUE_DAY')).toHaveLength(0)
  })

  // Rule 8: cutoffDay ignored for non-credit_card
  it('Rule 8 — ignores cutoffDay for consumer_loan (not an error)', () => {
    const result = validateDebt({
      debtType: 'consumer_loan',
      formData: {
        label: 'Crédito BancoEstado',
        remainingBalance: 300_000,
        monthlyInterestRate: 2,
        minimumPayment: 20_000,
        paymentDueDay: 10,
        cutoffDay: 5,
        metadata: {
          totalInstallments: 24,
          remainingInstallments: 18,
          hasInsurance: false,
          allowsEarlyPayment: true,
        },
      },
    })
    expect(result.errors.filter(e => e.code === 'INVALID_CUTOFF_DAY')).toHaveLength(0)
  })

  // Rule 9: cutoffDay invalid for credit_card
  it('Rule 9 — rejects cutoffDay of 0 for credit_card', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, cutoffDay: 0 },
    })
    expect(result.errors.some(e => e.code === 'INVALID_CUTOFF_DAY')).toBe(true)
  })

  // Rule 10: metadata validation
  it('Rule 10 — rejects invalid credit_card metadata (missing creditLimit)', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, metadata: { isActivelyUsed: true } },
    })
    expect(result.errors.some(e => e.code === 'INVALID_METADATA')).toBe(true)
  })

  it('Rule 10 — rejects invalid informal_lender metadata (invalid urgencyLevel)', () => {
    const result = validateDebt({
      debtType: 'informal_lender',
      formData: {
        label: 'Préstamo',
        remainingBalance: 100_000,
        minimumPayment: 5_000,
        paymentDueDay: 1,
        metadata: { hasInterest: false, urgencyLevel: 'extreme' },
      },
    })
    expect(result.errors.some(e => e.code === 'INVALID_METADATA')).toBe(true)
  })

  // Rule 11: collect ALL errors (no fail-fast)
  it('Rule 11 — collects multiple errors at once', () => {
    const result = validateDebt({
      ...validCreditCard,
      formData: { ...validCreditCard.formData, label: '', remainingBalance: -100, paymentDueDay: 0 },
    })
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
