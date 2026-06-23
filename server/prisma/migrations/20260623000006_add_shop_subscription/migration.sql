CREATE TABLE "ShopSubscription" (
  "id" TEXT NOT NULL,
  "floristId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "stripeSubId" TEXT NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "nextBillingDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "ShopSubscription_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_floristId_fkey" FOREIGN KEY ("floristId") REFERENCES "Florist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON UPDATE CASCADE;
CREATE UNIQUE INDEX "ShopSubscription_stripeSubId_key" ON "ShopSubscription"("stripeSubId");
CREATE INDEX "ShopSubscription_floristId_idx" ON "ShopSubscription"("floristId");
