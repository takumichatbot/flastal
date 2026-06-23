CREATE TABLE "GroupBuy" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "pricePerSlot" INTEGER NOT NULL,
  "targetSlots" INTEGER NOT NULL,
  "maxSlots" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "deadline" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroupBuy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupBuyEntry" (
  "id" TEXT NOT NULL,
  "groupBuyId" TEXT NOT NULL,
  "userId" TEXT,
  "slots" INTEGER NOT NULL DEFAULT 1,
  "amount" INTEGER NOT NULL,
  "stripeSessionId" TEXT NOT NULL,
  "stripePaymentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroupBuyEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GroupBuy" ADD CONSTRAINT "GroupBuy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupBuyEntry" ADD CONSTRAINT "GroupBuyEntry_groupBuyId_fkey" FOREIGN KEY ("groupBuyId") REFERENCES "GroupBuy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupBuyEntry" ADD CONSTRAINT "GroupBuyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "GroupBuyEntry_stripeSessionId_key" ON "GroupBuyEntry"("stripeSessionId");
CREATE INDEX "GroupBuyEntry_groupBuyId_idx" ON "GroupBuyEntry"("groupBuyId");
