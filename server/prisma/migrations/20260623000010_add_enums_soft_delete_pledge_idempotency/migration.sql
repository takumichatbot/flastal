-- CreateEnum: KycStatus
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum: PayoutStatus
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable User.kycStatus: String → KycStatus (データ保持)
ALTER TABLE "User" ALTER COLUMN "kycStatus" TYPE "KycStatus" USING "kycStatus"::"KycStatus";

-- AlterTable Payout.status: String → PayoutStatus (データ保持)
ALTER TABLE "Payout" ALTER COLUMN "status" TYPE "PayoutStatus" USING "status"::"PayoutStatus";

-- AlterTable PayoutRequest.status: String → PayoutStatus (データ保持)
ALTER TABLE "PayoutRequest" ALTER COLUMN "status" TYPE "PayoutStatus" USING "status"::"PayoutStatus";

-- AlterTable Pledge: stripeSessionId追加
ALTER TABLE "Pledge" ADD COLUMN "stripeSessionId" TEXT;

-- CreateIndex: Pledge.stripeSessionId unique
CREATE UNIQUE INDEX "Pledge_stripeSessionId_key" ON "Pledge"("stripeSessionId");

-- AlterTable Project: deletedAt追加 (soft delete)
ALTER TABLE "Project" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex: Project.deletedAt
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

-- CreateIndex: RefreshToken.expiresAt
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
