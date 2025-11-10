/*
  Warnings:

  - You are about to drop the column `businessHours` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `portfolioImages` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Florist" ADD COLUMN     "businessHours" TEXT,
ADD COLUMN     "portfolioImages" TEXT[];

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "businessHours",
DROP COLUMN "portfolioImages";
