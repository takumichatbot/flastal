import { Suspense } from 'react';
import PointsClient from './PointsClient';

export const metadata = { title: 'ポイント購入 | FLASTAL' };

export default function Page() {
  return (
    // Next.js 15 の厳格なビルド要件に合わせ、ページ全体を明確にラップ
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    }>
      <PointsClient />
    </Suspense>
  );
}