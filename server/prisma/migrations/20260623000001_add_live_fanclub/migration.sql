-- CreateTable LiveSession
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "floristId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable Superchat
CREATE TABLE "Superchat" (
    "id" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Superchat_pkey" PRIMARY KEY ("id")
);

-- CreateTable FanClub
CREATE TABLE "FanClub" (
    "id" TEXT NOT NULL,
    "artistPageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable FanClubTier
CREATE TABLE "FanClubTier" (
    "id" TEXT NOT NULL,
    "fanClubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "benefits" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,

    CONSTRAINT "FanClubTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable FanClubMember
CREATE TABLE "FanClubMember" (
    "id" TEXT NOT NULL,
    "fanClubId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "FanClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable FanClubContent
CREATE TABLE "FanClubContent" (
    "id" TEXT NOT NULL,
    "fanClubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "minTierSort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanClubContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveSession_projectId_idx" ON "LiveSession"("projectId");
CREATE INDEX "LiveSession_isLive_idx" ON "LiveSession"("isLive");
CREATE INDEX "Superchat_liveSessionId_createdAt_idx" ON "Superchat"("liveSessionId", "createdAt");
CREATE UNIQUE INDEX "FanClub_artistPageId_key" ON "FanClub"("artistPageId");
CREATE UNIQUE INDEX "FanClubMember_fanClubId_userId_key" ON "FanClubMember"("fanClubId", "userId");
CREATE INDEX "FanClubMember_fanClubId_idx" ON "FanClubMember"("fanClubId");
CREATE INDEX "FanClubContent_fanClubId_createdAt_idx" ON "FanClubContent"("fanClubId", "createdAt");

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_floristId_fkey" FOREIGN KEY ("floristId") REFERENCES "Florist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Superchat" ADD CONSTRAINT "Superchat_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Superchat" ADD CONSTRAINT "Superchat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FanClub" ADD CONSTRAINT "FanClub_artistPageId_fkey" FOREIGN KEY ("artistPageId") REFERENCES "ArtistPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanClubTier" ADD CONSTRAINT "FanClubTier_fanClubId_fkey" FOREIGN KEY ("fanClubId") REFERENCES "FanClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanClubMember" ADD CONSTRAINT "FanClubMember_fanClubId_fkey" FOREIGN KEY ("fanClubId") REFERENCES "FanClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanClubMember" ADD CONSTRAINT "FanClubMember_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "FanClubTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FanClubMember" ADD CONSTRAINT "FanClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanClubContent" ADD CONSTRAINT "FanClubContent_fanClubId_fkey" FOREIGN KEY ("fanClubId") REFERENCES "FanClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
