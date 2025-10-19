/*
  Warnings:

  - A unique constraint covering the columns `[platformName]` on the table `Florist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `platformName` to the `Florist` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."FloristStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Florist" ADD COLUMN     "platformName" TEXT NOT NULL,
ADD COLUMN     "status" "public"."FloristStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Florist_platformName_key" ON "public"."Florist"("platformName");
