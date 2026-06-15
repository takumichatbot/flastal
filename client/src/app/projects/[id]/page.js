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
  // ★ 修正1: Next.js 15対応のため params を await する
  const { id } = await params;

  // ★ 修正2: 企画の画像がない場合や、エラー時に表示する「FLASTALの公式ロゴ画像」などのURLを指定
  // ※ 実際の本番環境にある画像のURLに変更してください
  const DEFAULT_IMAGE_URL = 'https://www.flastal.com/opengraph-image.png';

  try {
    // APIからプロジェクト情報を取得 (キャッシュ有効化で高速化)
    const res = await fetch(`${API_URL}/api/projects/${id}`, { next: { revalidate: 60 } });
    
    if (!res.ok) {
      throw new Error('Project not found');
    }

    const project = await res.json();
    const description = project.description?.substring(0, 120) + (project.description?.length > 120 ? '...' : '') || '推し活フラスタ企画のクラウドファンディング';
    
    // 画像があればそれを使用し、なければデフォルト画像
    const imageUrl = project.imageUrl || DEFAULT_IMAGE_URL;

    return {
      title: `${project.title} | FLASTAL`,
      description: description,
      openGraph: {
        title: project.title,
        description: description,
        url: `https://flastal.com/projects/${id}`,
        siteName: 'FLASTAL',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: project.title,
          },
        ],
        locale: 'ja_JP',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image', // 大きな画像カード
        title: project.title,
        description: description,
        images: [imageUrl], // ★ ここに画像URLが必須
      },
    };
  } catch (error) {
    console.error('Metadata fetch failed:', error);
    
    // ★ 修正3: エラー時（URLを間違えた場合など）でも、確実にデフォルト画像を表示させる
    return {
      title: '企画詳細 | FLASTAL',
      description: 'みんなで贈る、想いの結晶。',
      openGraph: {
        title: '企画詳細 | FLASTAL',
        description: 'みんなで贈る、想いの結晶。',
        images: [{ url: DEFAULT_IMAGE_URL, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [DEFAULT_IMAGE_URL],
      }
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