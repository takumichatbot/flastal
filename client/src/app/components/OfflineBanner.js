'use client';

import { useOfflineDetection } from '@/app/hooks/useOfflineDetection';

/**
 * オフラインバナー
 * オフライン時に画面上部に固定表示される Client Component。
 * layout.js (Server Component) から Suspense 内に配置して使用する。
 */
export default function OfflineBanner() {
  const isOffline = useOfflineDetection();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center py-2 text-sm font-medium shadow-md"
    >
      オフラインです。接続を確認してください。
    </div>
  );
}
