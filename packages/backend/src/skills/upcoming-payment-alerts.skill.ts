import type { Debt } from '@prisma/client';

export interface UpcomingAlert {
  debtId: string;
  label: string;
  debtType: string;
  remainingBalance: string;
  minimumPayment: string;
  paymentDueDay: number;
  daysUntilDue: number;
}

export class UpcomingPaymentAlertsSkill {
  detect(debts: Debt[], today?: Date): UpcomingAlert[] {
    const now = today ?? new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const alerts: UpcomingAlert[] = [];

    for (const debt of debts) {
      if (debt.status !== 'active') continue;
      if (!debt.paymentDueDay) continue;

      const dueDay = debt.paymentDueDay;

      // Determine whether due date is this month or next month
      let dueDate: Date;
      if (dueDay >= currentDay) {
        // Due this month (or today)
        dueDate = new Date(currentYear, currentMonth, dueDay);
      } else {
        // Already passed this month — use next month
        dueDate = new Date(currentYear, currentMonth + 1, dueDay);
      }

      const msPerDay = 1000 * 60 * 60 * 24;
      const todayMidnight = new Date(currentYear, currentMonth, currentDay);
      const daysUntilDue = Math.round((dueDate.getTime() - todayMidnight.getTime()) / msPerDay);

      if (daysUntilDue <= 3) {
        alerts.push({
          debtId: debt.id,
          label: debt.label,
          debtType: debt.debtType,
          remainingBalance: debt.remainingBalance.toString(),
          minimumPayment: debt.minimumPayment.toString(),
          paymentDueDay: dueDay,
          daysUntilDue,
        });
      }
    }

    return alerts;
  }
}
