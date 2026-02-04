/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Event` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[floristId]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "BankAccount" DROP CONSTRAINT "BankAccount_userId_fkey";

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "floristId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "imageUrl",
ADD COLUMN     "announcement" TEXT,
ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "illustratorRequirements" TEXT,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "isIllustratorRecruiting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEditorId" TEXT,
ADD COLUMN     "officialWebsite" TEXT,
ADD COLUMN     "twitterUrl" TEXT;

-- AlterTable
ALTER TABLE "Florist" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptsRushOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "themeColor" TEXT DEFAULT '#6366f1',
ADD COLUMN     "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;

-- CreateTable
CREATE TABLE "FloristDeal" (
    "id" TEXT NOT NULL,
    "floristId" TEXT NOT NULL,
    "color" TEXT,
    "flower" TEXT,
    "discount" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloristDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodBoardItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodBoardItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodBoardLike" (
    "id" TEXT NOT NULL,
    "moodBoardItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodBoardLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalFlower" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalFlower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialReaction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficialReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventInterest_userId_eventId_key" ON "EventInterest"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "MoodBoardLike_moodBoardItemId_userId_key" ON "MoodBoardLike"("moodBoardItemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialReaction_projectId_key" ON "OfficialReaction"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_floristId_key" ON "BankAccount"("floristId");

-- AddForeignKey
ALTER TABLE "FloristDeal" ADD CONSTRAINT "FloristDeal_floristId_fkey" FOREIGN KEY ("floristId") REFERENCES "Florist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_lastEditorId_fkey" FOREIGN KEY ("lastEditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInterest" ADD CONSTRAINT "EventInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInterest" ADD CONSTRAINT "EventInterest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_floristId_fkey" FOREIGN KEY ("floristId") REFERENCES "Florist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodBoardItem" ADD CONSTRAINT "MoodBoardItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodBoardItem" ADD CONSTRAINT "MoodBoardItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodBoardLike" ADD CONSTRAINT "MoodBoardLike_moodBoardItemId_fkey" FOREIGN KEY ("moodBoardItemId") REFERENCES "MoodBoardItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodBoardLike" ADD CONSTRAINT "MoodBoardLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalFlower" ADD CONSTRAINT "DigitalFlower_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialReaction" ADD CONSTRAINT "OfficialReaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
