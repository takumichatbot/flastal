/*
  Warnings:

  - A unique constraint covering the columns `[illustratorId]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ILLUSTRATOR';

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "illustratorId" TEXT;

-- CreateTable
CREATE TABLE "Illustrator" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "iconUrl" TEXT,
    "bio" TEXT,
    "portfolioUrl" TEXT,
    "portfolioImages" TEXT[],
    "specialties" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Illustrator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Illustrator_email_key" ON "Illustrator"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_illustratorId_key" ON "BankAccount"("illustratorId");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_illustratorId_fkey" FOREIGN KEY ("illustratorId") REFERENCES "Illustrator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
