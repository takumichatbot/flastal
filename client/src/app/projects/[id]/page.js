// src/app/projects/[id]/page.js

import ProjectDetailPage from './ProjectDetailClient';

// ★★★ ここで viewport (themeColor) を定義します ★★★
// これで "Unsupported metadata themeColor" エラーが消えます
export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// 必要であればメタデータ（タイトルなど）もここで定義できます
export async function generateMetadata({ params }) {
  // idを使ってDBからタイトルを取得することも可能です
  return {
    title: '企画詳細 | FLASTAL', 
    description: 'フラスタ企画の詳細ページです。',
  };
}

// サーバーコンポーネントとして、クライアントコンポーネントを呼び出す
export default function Page() {
  return <ProjectDetailPage />;
}