-- CreateTable: Cheer (応援コメント)
CREATE TABLE IF NOT EXISTS "Cheer" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    CONSTRAINT "Cheer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Cheer_projectId_createdAt_idx" ON "Cheer"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "Cheer" ADD CONSTRAINT "Cheer_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Cheer" ADD CONSTRAINT "Cheer_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: Tag
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX IF NOT EXISTS "Tag_slug_idx" ON "Tag"("slug");

-- CreateTable: ProjectTag (junction)
CREATE TABLE IF NOT EXISTS "ProjectTag" (
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("projectId", "tagId")
);

ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add missing columns to Project table (IF NOT EXISTS to be safe)
ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "minContributionAmount" INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "isExpress" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "materialCost" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "materialDescription" TEXT,
    ADD COLUMN IF NOT EXISTS "needsIllustrator" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "illustratorBudget" INTEGER,
    ADD COLUMN IF NOT EXISTS "illustratorRequirements" TEXT,
    ADD COLUMN IF NOT EXISTS "illustratorId" TEXT,
    ADD COLUMN IF NOT EXISTS "illustratorReward" INTEGER,
    ADD COLUMN IF NOT EXISTS "illustrationDataUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "isIllustrationAccepted" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "isPanelReceived" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "artistPageId" TEXT,
    ADD COLUMN IF NOT EXISTS "artistPageSlug" TEXT;

-- AddForeignKey for illustratorId
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_illustratorId_fkey";
ALTER TABLE "Project" ADD CONSTRAINT "Project_illustratorId_fkey"
    FOREIGN KEY ("illustratorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: IllustratorOffer
CREATE TABLE IF NOT EXISTS "IllustratorOffer" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "illustratorId" TEXT NOT NULL,
    CONSTRAINT "IllustratorOffer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IllustratorOffer" ADD CONSTRAINT "IllustratorOffer_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IllustratorOffer" ADD CONSTRAINT "IllustratorOffer_illustratorId_fkey"
    FOREIGN KEY ("illustratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: IllustratorApplication
CREATE TABLE IF NOT EXISTS "IllustratorApplication" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "portfolio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "illustratorId" TEXT NOT NULL,
    CONSTRAINT "IllustratorApplication_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IllustratorApplication" ADD CONSTRAINT "IllustratorApplication_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IllustratorApplication" ADD CONSTRAINT "IllustratorApplication_illustratorId_fkey"
    FOREIGN KEY ("illustratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
