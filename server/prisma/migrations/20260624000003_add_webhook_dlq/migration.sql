-- Migration: 20260624000003_add_webhook_dlq
-- WebhookLog テーブルに DLQ（デッドレターキュー）フィールドを追加

ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "dlqAt" TIMESTAMP(3);

-- dlqAt インデックス追加（DLQ未処理レコードの検索に使用）
CREATE INDEX IF NOT EXISTS "WebhookLog_dlqAt_idx" ON "WebhookLog"("dlqAt");
