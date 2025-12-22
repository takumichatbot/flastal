import { Suspense } from 'react';
import AdminReportsClient from './AdminReportsClient';

export const metadata = { title: '通報管理 | FLASTAL 管理画面' };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">読み込み中...</div>}>
      <AdminReportsClient />
    </Suspense>
  );
}