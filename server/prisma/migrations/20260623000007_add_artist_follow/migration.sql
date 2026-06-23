-- CreateTable: ArtistPageFollow
CREATE TABLE IF NOT EXISTS "ArtistPageFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistPageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArtistPageFollow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: userId -> User
ALTER TABLE "ArtistPageFollow" ADD CONSTRAINT "ArtistPageFollow_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: artistPageId -> ArtistPage
ALTER TABLE "ArtistPageFollow" ADD CONSTRAINT "ArtistPageFollow_artistPageId_fkey"
    FOREIGN KEY ("artistPageId") REFERENCES "ArtistPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ArtistPageFollow_userId_artistPageId_key"
    ON "ArtistPageFollow"("userId", "artistPageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ArtistPageFollow_userId_idx"
    ON "ArtistPageFollow"("userId");
