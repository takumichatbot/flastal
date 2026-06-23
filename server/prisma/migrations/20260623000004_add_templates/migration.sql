CREATE TABLE "ProjectTemplate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "targetAmount" INTEGER NOT NULL,
  "targetArtist" TEXT,
  "projectType" TEXT NOT NULL DEFAULT 'PUBLIC',
  "tags" TEXT[],
  "coverMessage" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ProjectTemplate" ADD CONSTRAINT "ProjectTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ProjectTemplate_userId_idx" ON "ProjectTemplate"("userId");
CREATE INDEX "ProjectTemplate_isPublic_idx" ON "ProjectTemplate"("isPublic");
