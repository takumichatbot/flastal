import { Suspense } from 'react';
import LegalCancelClient from './LegalCancelClient';

// メタデータの設定（themeColorエラー回避のため viewport も分離推奨）
export const metadata = {
  title: 'キャンセルポリシー | FLASTAL',
  description: 'ポイント購入および企画支援に関するキャンセルポリシーのご案内です。',
};

export const viewport = {
  themeColor: '#ffffff',
};

export default function LegalCancelPage() {
  return (
    // useSearchParams() を含むコンポーネントを Suspense でラップ
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    }>
      <LegalCancelClient />
    </Suspense>
  );
}