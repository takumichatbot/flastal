/*
  Warnings:

  - The `targetRole` column on the `EmailTemplate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[key]` on the table `EmailTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `EmailTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EmailTemplate_name_key";

-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "key" TEXT NOT NULL,
DROP COLUMN "targetRole",
ADD COLUMN     "targetRole" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");
