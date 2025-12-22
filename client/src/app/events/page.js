import { Suspense } from 'react';
import EventListClient from './EventListClient';

// --- メタデータ設定 (SEO向上) ---
export const metadata = {
  title: 'イベント情報局 | FLASTAL',
  description: '推しのイベントを探してフラスタを贈ろう。AIによる自動解析機能で、最新のライブ・コンサート・イベント情報を網羅。',
  openGraph: {
    title: 'イベント情報局 | FLASTAL',
    description: '推しのライブやイベント情報を検索。フラスタ企画の立ち上げもここから。',
    type: 'website',
    siteName: 'FLASTAL',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'イベント情報局 | FLASTAL',
    description: '推しのイベントを探してフラスタを贈ろう。',
  },
};

// --- ローディング中のフォールバック表示 ---
function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-500 font-medium animate-pulse">イベント情報を読み込み中...</p>
      </div>
    </div>
  );
}

// --- メインページコンポーネント ---
export default function EventsPage() {
  return (
    // クライアントコンポーネントをSuspenseで囲むことで、
    // 読み込み中もサーバーサイドのシェルを表示し、UXを向上させる
    <Suspense fallback={<LoadingState />}>
      <EventListClient />
    </Suspense>
  );
}