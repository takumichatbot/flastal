import { Suspense } from 'react';
import VenuesClient from './VenuesClient';

export const metadata = { title: '会場管理 | FLASTAL' };

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }>
      <VenuesClient />
    </Suspense>
  );
}