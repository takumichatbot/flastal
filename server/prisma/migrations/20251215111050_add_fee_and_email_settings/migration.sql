-- AlterTable
ALTER TABLE "Florist" ADD COLUMN     "customFeeRate" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "platformFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "approvalEmailSubject" TEXT NOT NULL DEFAULT '[FLASTAL] アカウント承認のお知らせ',
    "approvalEmailBody" TEXT NOT NULL DEFAULT 'この度はご登録ありがとうございます。審査が完了し、アカウントが承認されました。今すぐログインしてサービスをご利用いただけます。',

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
