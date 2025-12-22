import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'ログイン | FLASTAL',
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}