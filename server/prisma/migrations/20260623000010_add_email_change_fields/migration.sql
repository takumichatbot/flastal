-- メールアドレス変更フローに必要なフィールドを追加
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingEmail" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailChangeToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailChangeExpires" TIMESTAMP(3);
