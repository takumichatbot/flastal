-- CreateTable
CREATE TABLE "AdminChatRoom" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminChatRoom_userId_userRole_key" ON "AdminChatRoom"("userId", "userRole");
