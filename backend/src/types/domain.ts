// Domain types — mirrors Prisma enums and JSON field structures
// Source of truth: docs/domain-model.md v0.2

export type DebtType = 'credit_card' | 'consumer_loan' | 'mortgage' | 'informal_lender'
export type DebtStatus = 'active' | 'paid_off' | 'frozen'
export type StrategyType = 'avalanche' | 'snowball' | 'hybrid' | 'crisis_first' | 'guided_consolidation'
export type PlanStatus = 'active' | 'completed' | 'superseded'
export type MilestoneType =
  | 'debt_paid_off'
  | 'first_payment'
  | 'plan_on_track'
  | 'total_reduced_25pct'
  | 'total_reduced_50pct'
  | 'total_reduced_75pct'

// UserProfile.fixedExpenses JSON structure
export interface FixedExpenses {
  rent: number
  utilities: number
  food: number
  transport: number
  other: number
}

// Debt.metadata JSON structures (per DebtType)
export interface CreditCardMetadata {
  creditLimit: number
  isActivelyUsed: boolean
  lastFourDigits?: string
}

export interface ConsumerLoanMetadata {
  totalInstallments: number
  remainingInstallments: number
  hasInsurance: boolean
  insuranceMonthlyAmount?: number
  allowsEarlyPayment: boolean
  discountDay?: number
}

export interface MortgageMetadata {
  remainingInstallments: number
  isFixedRate: boolean
  hasInsurance: boolean
  insuranceMonthlyAmount?: number
  isDFL2: boolean
}

export interface InformalLenderMetadata {
  hasInterest: boolean | null
  urgencyLevel: 'low' | 'medium' | 'high'
  agreedMonthlyPayment?: number
  agreedTermDescription?: string
}

export type DebtMetadata =
  | CreditCardMetadata
  | ConsumerLoanMetadata
  | MortgageMetadata
  | InformalLenderMetadata

// DebtPlan.aiOutput JSON structure
export interface AiOutput {
  summary: string
  strategy_rationale: string
  monthly_focus: string
  key_milestones: Array<{ month: number; event: string; message: string }>
  critical_alerts: string[]
  free_date_message: string
}

// Skill return type (used by all skills)
export type SkillResult<T extends object> =
  | ({ success: true } & T)
  | { success: false; error: string; details?: unknown }
