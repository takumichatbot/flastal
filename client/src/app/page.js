import { Suspense } from 'react';
import HomeClient from './HomeClient';

// サーバーコンポーネントとしてメタデータを定義
export const metadata = {
  title: 'FLASTAL - 推しにフラスタを贈ろう',
  description: 'フラスタ専門のクラウドファンディングプラットフォーム。',
};

export default function Page() {
  return (
    // URLパラメータを使用するコンポーネントを Suspense でラップ
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    }>
      <HomeClient />
    </Suspense>
  );
}