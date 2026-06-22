import { Suspense } from 'react';
import ProjectDetailClient from './ProjectDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ページ単位の ISR — 60秒ごとに再検証
export const revalidate = 60;

// 人気上位プロジェクトをビルド時に静的生成
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/api/projects?limit=50`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const projects = await res.json();
    return (Array.isArray(projects) ? projects : []).map(p => ({ id: p.id }));
  } catch {
    return [];
  }
}

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

    const progress = project.targetAmount > 0
      ? Math.round((project.collectedAmount / project.targetAmount) * 100)
      : 0;

    const ogImageUrl = `https://www.flastal.com/api/og?title=${encodeURIComponent(project.title)}&progress=${progress}&collected=${project.collectedAmount || 0}&target=${project.targetAmount || 0}&user=${encodeURIComponent(project.planner?.handleName || '')}&image=${encodeURIComponent(project.imageUrl || '')}`;

    return {
      title: `${project.title} | FLASTAL`,
      description: description,
      openGraph: {
        title: project.title,
        description: description,
        url: `https://www.flastal.com/projects/${id}`,
        siteName: 'FLASTAL',
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: project.title }],
        locale: 'ja_JP',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: project.title,
        description: description,
        images: [ogImageUrl],
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

// JSON-LD 構造化データ
async function ProjectJsonLd({ id }) {
  try {
    const res = await fetch(`${API_URL}/api/projects/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const project = await res.json();

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CrowdfundingCampaign',
      name: project.title,
      description: project.description?.substring(0, 200) || '',
      url: `https://www.flastal.com/projects/${id}`,
      image: project.imageUrl || 'https://www.flastal.com/opengraph-image.png',
      startDate: project.createdAt,
      endDate: project.deadline,
      fundingGoal: {
        '@type': 'MonetaryAmount',
        currency: 'JPY',
        value: project.targetAmount || 0,
      },
      amountRaised: {
        '@type': 'MonetaryAmount',
        currency: 'JPY',
        value: project.collectedAmount || 0,
      },
      creator: {
        '@type': 'Person',
        name: project.planner?.handleName || 'プランナー',
      },
      organizer: {
        '@type': 'Organization',
        name: 'FLASTAL',
        url: 'https://www.flastal.com',
      },
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  } catch {
    return null;
  }
}

// メインコンポーネント
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <>
      <ProjectJsonLd id={id} />
      <Suspense fallback={<LoadingSkeleton />}>
        <ProjectDetailClient />
      </Suspense>
    </>
  );
}