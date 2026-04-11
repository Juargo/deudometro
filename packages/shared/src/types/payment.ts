export interface PaymentResponse {
  id: string;
  debtId: string;
  debtLabel?: string;
  financialSpaceId: string;
  recordedByUserId: string;
  amount: string;
  principalAmount: string;
  interestAmount: string;
  paidAt: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface MilestoneResponse {
  id: string;
  financialSpaceId: string;
  milestoneType: string;
  debtId: string | null;
  message: string;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface RecordPaymentResponse {
  payment: PaymentResponse;
  updatedDebt: { id: string; remainingBalance: string; status: string };
  milestones: MilestoneResponse[];
}

export interface UpcomingAlertResponse {
  debtId: string;
  label: string;
  debtType: string;
  remainingBalance: string;
  minimumPayment: string;
  paymentDueDay: number;
  daysUntilDue: number;
}
