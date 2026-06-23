-- AlterEnum: ApprovalStatus に SUSPENDED を追加
ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- AlterEnum: FloristStatus に SUSPENDED を追加
ALTER TYPE "FloristStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- AlterTable: User に停止関連フィールドを追加
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendReason" TEXT;

-- AlterTable: Florist に停止関連フィールドを追加
ALTER TABLE "Florist" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Florist" ADD COLUMN IF NOT EXISTS "suspendReason" TEXT;
