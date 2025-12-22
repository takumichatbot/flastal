import { Suspense } from 'react';
import PaymentSuccessClient from './PaymentSuccessClient';

export const metadata = { title: '決済完了 | FLASTAL' };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">読み込み中...</div>}>
      <PaymentSuccessClient />
    </Suspense>
  );
}