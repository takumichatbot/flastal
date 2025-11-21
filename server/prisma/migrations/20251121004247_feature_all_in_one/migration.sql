-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "ProjectStatus" ADD VALUE 'READY_FOR_DELIVERY';

-- AlterTable
ALTER TABLE "Pledge" ADD COLUMN     "pledgeTierId" TEXT;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "isFinalized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedUserId" TEXT;

-- CreateTable
CREATE TABLE "PledgeTier" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "PledgeTier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PledgeTier" ADD CONSTRAINT "PledgeTier_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_pledgeTierId_fkey" FOREIGN KEY ("pledgeTierId") REFERENCES "PledgeTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
