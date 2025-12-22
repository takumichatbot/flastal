import { Suspense } from 'react';
import PrivacyClient from './PrivacyClient';

export const metadata = {
  title: 'プライバシーポリシー | FLASTAL',
};

export default function PrivacyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <PrivacyClient />
    </Suspense>
  );
}