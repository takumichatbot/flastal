import { Suspense } from 'react';
import CreateProjectClient from './CreateProjectClient';

export const metadata = {
  title: '企画を立ち上げる | FLASTAL',
};

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    }>
      <CreateProjectClient />
    </Suspense>
  );
}