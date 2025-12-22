import { Suspense } from 'react';
import PaymentSuccessClient from './PaymentSuccessClient';

export const metadata = {
  title: '決済完了 | FLASTAL',
};

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    }>
      <PaymentSuccessClient />
    </Suspense>
  );
}