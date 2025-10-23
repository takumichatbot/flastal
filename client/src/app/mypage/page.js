// ./src/app/mypage/page.js
import { Suspense } from 'react';
import MyPageContent from './MyPageContent'; // ◀ さっき作ったコンポーネント

// page.js はサーバーコンポーネントのまま
export default function MyPage() {
  return (
    // <Suspense> でクライアントコンポーネントを囲む
    <Suspense fallback={<div>Loading...</div>}> 
      <MyPageContent />
    </Suspense>
  );
}