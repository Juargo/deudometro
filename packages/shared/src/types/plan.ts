export type StrategyType = 'avalanche' | 'snowball' | 'hybrid' | 'crisis_first' | 'guided_consolidation';
export type PlanStatus = 'active' | 'completed' | 'superseded';
export type AiStatus = 'success' | 'timeout' | 'circuit_open' | 'error';

export interface AiAnalysisOutput {
  summary: string;
  strategy_rationale: string;
  monthly_focus: string;
  key_milestones: Array<{ month: number; event: string; message: string }>;
  critical_alerts: string[];
  free_date_message: string;
}

export interface PlanActionResponse {
  id: string;
  debtId: string;
  debtLabel: string;
  debtType: string;
  month: number;
  paymentAmount: string;
  principalAmount: string;
  interestAmount: string;
  runningBalance: string;
}

export interface DebtPlanResponse {
  id: string;
  financialSpaceId: string;
  strategyType: StrategyType;
  status: PlanStatus;
  monthlyBudget: string;
  aiAnalysis: AiAnalysisOutput | null;
  createdAt: string;
}

export interface GeneratePlanResponse {
  plan: DebtPlanResponse;
  actions: PlanActionResponse[];
  aiAnalysis: AiAnalysisOutput | null;
  totalMonths: number;
  totalInterestPaid: string;
  financialFreedomDate: string;
  aiStatus: AiStatus;
}

export interface ActivePlanResponse {
  plan: DebtPlanResponse;
  actions: PlanActionResponse[];
}

export interface RetryAiResponse {
  plan: DebtPlanResponse;
  aiAnalysis: AiAnalysisOutput | null;
  aiStatus: AiStatus;
}
