-- Cheer テーブル作成（getProjectById の cheers include が 500 になる問題の修正）
CREATE TABLE IF NOT EXISTS "Cheer" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    CONSTRAINT "Cheer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Cheer_projectId_createdAt_idx" ON "Cheer"("projectId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Cheer_projectId_fkey'
          AND table_name = 'Cheer'
    ) THEN
        ALTER TABLE "Cheer"
            ADD CONSTRAINT "Cheer_projectId_fkey"
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Cheer_userId_fkey'
          AND table_name = 'Cheer'
    ) THEN
        ALTER TABLE "Cheer"
            ADD CONSTRAINT "Cheer_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Tag テーブル
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

-- ProjectTag テーブル
CREATE TABLE IF NOT EXISTS "ProjectTag" (
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("projectId", "tagId")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ProjectTag_projectId_fkey'
          AND table_name = 'ProjectTag'
    ) THEN
        ALTER TABLE "ProjectTag"
            ADD CONSTRAINT "ProjectTag_projectId_fkey"
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ProjectTag_tagId_fkey'
          AND table_name = 'ProjectTag'
    ) THEN
        ALTER TABLE "ProjectTag"
            ADD CONSTRAINT "ProjectTag_tagId_fkey"
            FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Project テーブルの不足カラムを追加（IF NOT EXISTS で安全に）
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
