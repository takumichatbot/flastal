-- Migration: fix_cascade_and_points
-- Pledge: プロジェクト削除時に CASCADE DELETE
ALTER TABLE "Pledge" DROP CONSTRAINT IF EXISTS "Pledge_projectId_fkey";
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Offer: プロジェクト削除時に CASCADE DELETE
ALTER TABLE "Offer" DROP CONSTRAINT IF EXISTS "Offer_projectId_fkey";
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Offer: 花屋削除時に CASCADE DELETE
ALTER TABLE "Offer" DROP CONSTRAINT IF EXISTS "Offer_floristId_fkey";
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_floristId_fkey"
  FOREIGN KEY ("floristId") REFERENCES "Florist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatRoom: Offer削除時に CASCADE DELETE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ChatRoom_offerId_fkey'
      AND table_name = 'ChatRoom'
  ) THEN
    ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_offerId_fkey";
  END IF;
END $$;
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatMessage: ChatRoom削除時に CASCADE DELETE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ChatMessage_chatRoomId_fkey'
      AND table_name = 'ChatMessage'
  ) THEN
    ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_chatRoomId_fkey";
  END IF;
END $$;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatRoomId_fkey"
  FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User: ポイント残高の非負制約
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "user_points_non_negative";
ALTER TABLE "User" ADD CONSTRAINT "user_points_non_negative" CHECK ("points" >= 0);
