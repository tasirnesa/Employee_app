-- HR Integration: Merit proposals, performance bonus on payslips, eligibility on benefits/perks

CREATE TABLE IF NOT EXISTS "MeritProposal" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "evaluationID" INTEGER,
    "sessionID" INTEGER,
    "proposedBy" INTEGER NOT NULL,
    "performanceRating" DOUBLE PRECISION NOT NULL,
    "meritTier" TEXT NOT NULL,
    "bonusPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonusAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "salaryIncreasePercent" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reviewNotes" TEXT,
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "bonusPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeritProposal_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MeritProposal" ADD CONSTRAINT "MeritProposal_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MeritProposal" ADD CONSTRAINT "MeritProposal_proposedBy_fkey"
    FOREIGN KEY ("proposedBy") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MeritProposal" ADD CONSTRAINT "MeritProposal_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payslip" ADD COLUMN IF NOT EXISTS "performanceBonus" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Payslip" ADD COLUMN IF NOT EXISTS "meritTier" TEXT;

ALTER TABLE "Benefit" ADD COLUMN IF NOT EXISTS "minPerformanceRating" DOUBLE PRECISION;
ALTER TABLE "Benefit" ADD COLUMN IF NOT EXISTS "eligibilityTier" TEXT DEFAULT 'Standard';

ALTER TABLE "Perk" ADD COLUMN IF NOT EXISTS "minPerformanceRating" DOUBLE PRECISION;
ALTER TABLE "Perk" ADD COLUMN IF NOT EXISTS "eligibilityTier" TEXT DEFAULT 'Standard';

ALTER TABLE "MeritProposal" ADD COLUMN IF NOT EXISTS "bonusPaidAt" TIMESTAMP(3);
