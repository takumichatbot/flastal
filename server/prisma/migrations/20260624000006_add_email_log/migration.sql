-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id"        TEXT NOT NULL,
    "to"        TEXT NOT NULL,
    "template"  TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'queued',
    "error"     TEXT,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt"    TIMESTAMP(3),

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailLog_to_idx" ON "EmailLog"("to");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
