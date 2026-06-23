-- PostgreSQL enumに EXPIRED を追加
ALTER TYPE "OfferStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- Offer テーブルに expiresAt を追加
ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- NotificationType に OFFER_EXPIRED を追加
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFER_EXPIRED';
