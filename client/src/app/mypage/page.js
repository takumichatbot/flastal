import { Suspense } from 'react';
// ↓ ここがファイル名と完全に一致している必要があります
import MyPageClient from './MyPageClient';

export const metadata = {
  title: 'マイページ | FLASTAL',
};

export const viewport = {
  themeColor: '#ffffff',
};

export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    }>
      <MyPageClient />
    </Suspense>
  );
}