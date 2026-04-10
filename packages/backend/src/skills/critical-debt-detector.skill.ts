import type { Debt } from '@prisma/client';

export type DebtWithCritical = Debt & { isCritical: boolean };

export class CriticalDebtDetectorSkill {
  detect(debts: Debt[]): DebtWithCritical[] {
    return debts.map((debt) => {
      let isCritical = false;

      if (debt.status === 'active') {
        // isCritical when interest accrued this month > minimum payment
        // interest = remainingBalance * monthlyInterestRate / 100
        const monthlyInterest = debt.remainingBalance
          .mul(debt.monthlyInterestRate)
          .div(100);
        isCritical = monthlyInterest.greaterThan(debt.minimumPayment);
      }

      return { ...debt, isCritical };
    });
  }
}
