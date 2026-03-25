-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('credit_card', 'consumer_loan', 'mortgage', 'informal_lender');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('active', 'paid_off', 'frozen');

-- CreateEnum
CREATE TYPE "StrategyType" AS ENUM ('avalanche', 'snowball', 'hybrid', 'crisis_first', 'guided_consolidation');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('active', 'completed', 'superseded');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('debt_paid_off', 'first_payment', 'plan_on_track', 'total_reduced_25pct', 'total_reduced_50pct', 'total_reduced_75pct');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'CLP',
    "monthlyIncome" DECIMAL(15,2) NOT NULL,
    "fixedExpenses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "debtType" "DebtType" NOT NULL,
    "lenderName" VARCHAR(100),
    "originalBalance" DECIMAL(15,2) NOT NULL,
    "remainingBalance" DECIMAL(15,2) NOT NULL,
    "monthlyInterestRate" DECIMAL(7,4),
    "minimumPayment" DECIMAL(15,2) NOT NULL,
    "paymentDueDay" INTEGER NOT NULL,
    "cutoffDay" INTEGER,
    "status" "DebtStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategy" "StrategyType" NOT NULL,
    "monthlyIncomeSnapshot" DECIMAL(15,2) NOT NULL,
    "totalFixedCostsSnapshot" DECIMAL(15,2) NOT NULL,
    "reservePercentage" DECIMAL(5,2) NOT NULL,
    "monthlyBudget" DECIMAL(15,2) NOT NULL,
    "totalDebtAtCreation" DECIMAL(15,2) NOT NULL,
    "totalInterestProjected" DECIMAL(15,2) NOT NULL,
    "totalInterestNoPlan" DECIMAL(15,2) NOT NULL,
    "estimatedPayoffDate" DATE NOT NULL,
    "aiOutput" JSONB,
    "status" "PlanStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanAction" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "monthOffset" INTEGER NOT NULL,
    "paymentAmount" DECIMAL(15,2) NOT NULL,
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "interestAmount" DECIMAL(15,2) NOT NULL,
    "remainingBalanceAfter" DECIMAL(15,2) NOT NULL,
    "debtOrder" INTEGER NOT NULL,

    CONSTRAINT "PlanAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "planActionId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "paidAt" DATE NOT NULL,
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "debtId" TEXT,
    "type" "MilestoneType" NOT NULL,
    "context" JSONB NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_authUserId_key" ON "UserProfile"("authUserId");

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPlan" ADD CONSTRAINT "DebtPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAction" ADD CONSTRAINT "PlanAction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DebtPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAction" ADD CONSTRAINT "PlanAction_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planActionId_fkey" FOREIGN KEY ("planActionId") REFERENCES "PlanAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
