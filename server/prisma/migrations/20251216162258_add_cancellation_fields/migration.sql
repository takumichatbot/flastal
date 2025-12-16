-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING', 'PARTIAL', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "cancellationDate" TIMESTAMP(3),
ADD COLUMN     "cancellationFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "materialCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "materialDescription" TEXT,
ADD COLUMN     "refundStatus" TEXT NOT NULL DEFAULT 'NONE';
