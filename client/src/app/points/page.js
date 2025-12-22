import { Suspense } from 'react';
import PointsClient from './PointsClient';

export const metadata = { title: 'ポイント購入 | FLASTAL' };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PointsClient />
    </Suspense>
  );
}