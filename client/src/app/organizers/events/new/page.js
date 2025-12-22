import { Suspense } from 'react';
import CreateEventClient from './CreateEventClient';

export const metadata = {
  title: '新規イベント作成 | 主催者管理',
};

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <CreateEventClient />
    </Suspense>
  );
}