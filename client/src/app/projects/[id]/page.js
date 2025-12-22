import { Suspense } from 'react';
import ProjectDetailClient from './ProjectDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ✅ ビューポート設定
export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// ✅ 動的メタデータ生成 (SEO / OGP)
export async function generateMetadata({ params }) {
  const id = params.id;

  try {
    // APIからプロジェクト情報を取得 (キャッシュ有効化で高速化)
    const res = await fetch(`${API_URL}/api/projects/${id}`, { next: { revalidate: 60 } });
    
    if (!res.ok) {
      return {
        title: '企画が見つかりません | FLASTAL',
        description: 'お探しの企画は存在しないか、削除された可能性があります。',
      };
    }

    const project = await res.json();
    const description = project.description?.substring(0, 120) + (project.description?.length > 120 ? '...' : '') || '推し活フラスタ企画のクラウドファンディング';

    return {
      title: `${project.title} | FLASTAL`,
      description: description,
      openGraph: {
        title: project.title,
        description: description,
        url: `https://flastal.com/projects/${id}`, // 本番ドメインに合わせて変更推奨
        siteName: 'FLASTAL',
        images: project.imageUrl ? [
          {
            url: project.imageUrl,
            width: 1200,
            height: 630,
            alt: project.title,
          },
        ] : [],
        locale: 'ja_JP',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: project.title,
        description: description,
        images: project.imageUrl ? [project.imageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Metadata fetch failed:', error);
    return {
      title: '企画詳細 | FLASTAL',
      description: 'みんなで贈る、想いの結晶。',
    };
  }
}

// ローディング中の表示
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-pink-500"></div>
        <p className="text-gray-500 font-bold animate-pulse text-sm">企画データを読み込み中...</p>
      </div>
    </div>
  );
}

// メインコンポーネント
export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProjectDetailClient />
    </Suspense>
  );
}