import ProjectDetailClient from './ProjectDetailClient';

// ★★★ ここで viewport (themeColor) を定義します ★★★
export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// メタデータ（タイトルなど）の定義
export async function generateMetadata({ params }) {
  return {
    title: '企画詳細 | FLASTAL',
    description: '推し活フラスタ企画のクラウドファンディング',
  };
}

// サーバーコンポーネントとして、クライアントコンポーネントを呼び出す
export default function Page() {
  return <ProjectDetailClient />;
}