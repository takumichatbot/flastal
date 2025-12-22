import { Suspense } from 'react';
import MyPageContent from './MyPageContent';

export const metadata = {
  title: 'マイページ | FLASTAL',
};

// themeColorの警告が出ていたため viewport に移動
export const viewport = {
  themeColor: '#ffffff',
};

export default function MyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">読み込み中...</div>}>
      <MyPageContent />
    </Suspense>
  );
}