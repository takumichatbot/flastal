-- CreateTable
CREATE TABLE "AdminChatMessage" (
    "id" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isAutoResponse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdminChatMessage" ADD CONSTRAINT "AdminChatMessage_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "AdminChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
