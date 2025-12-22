import { Suspense } from 'react';
import OrganizerRegisterClient from './OrganizerRegisterClient';

export const metadata = { title: '主催者登録 | FLASTAL' };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrganizerRegisterClient />
    </Suspense>
  );
}