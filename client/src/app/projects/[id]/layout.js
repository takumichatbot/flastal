// src/app/projects/[id]/layout.js

// バックエンドのURL (データ取得用)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
// フロントエンドのURL (OGP画像のリンク生成用)
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://flastal.vercel.app'; 

// データ取得ヘルパー (Next.jsのrequest memoizationにより、同じURLへのfetchは重複排除されます)
async function getProject(id) {
  try {
    const res = await fetch(`${API_URL}/api/projects/${id}`, { 
        cache: 'no-store' // 常に最新の支援状況を反映するためキャッシュしない
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Project fetch error:', error);
    return null;
  }
}

// 動的メタデータ生成 (SEO / OGP)
export async function generateMetadata({ params }) {
  const { id } = params;
  const project = await getProject(id);

  if (!project) {
    return { title: '企画が見つかりません | FLASTAL' };
  }

  // 進捗率の計算
  const progress = project.targetAmount > 0 
      ? Math.min((project.collectedAmount / project.targetAmount) * 100, 100).toFixed(0) 
      : 0;

  // 動的OGP画像のURLを作成
  // 例: https://flastal.com/api/og?title=企画名&progress=80...
  const ogImageUrl = new URL(`${FRONTEND_URL}/api/og`);
  ogImageUrl.searchParams.set('title', project.title);
  ogImageUrl.searchParams.set('progress', progress);
  ogImageUrl.searchParams.set('collected', project.collectedAmount);
  ogImageUrl.searchParams.set('target', project.targetAmount);
  if (project.imageUrl) {
      ogImageUrl.searchParams.set('image', project.imageUrl); // 背景画像として使う場合
  }

  const description = project.description?.substring(0, 120).replace(/\n/g, ' ') + '...';

  return {
    title: `${project.title} | FLASTAL`,
    description: description,
    openGraph: {
      title: project.title,
      description: '推しにフラスタを贈ろう！ファン参加型クラウドファンディング',
      url: `${FRONTEND_URL}/projects/${id}`,
      siteName: 'FLASTAL',
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: 'みんなでフラスタを贈りませんか？',
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function ProjectLayout({ children, params }) {
  const { id } = params;
  const project = await getProject(id);

  // JSON-LD (構造化データ) の生成
  // これを埋め込むことで、Google検索結果にリッチな情報が表示されやすくなります
  const jsonLd = project ? {
    '@context': 'https://schema.org',
    '@type': 'FundingCampaign', // クラウドファンディングキャンペーン
    name: project.title,
    description: project.description,
    image: project.imageUrl,
    url: `${FRONTEND_URL}/projects/${id}`,
    organizer: {
      '@type': 'Person',
      name: project.planner?.handleName || 'FLASTAL User',
      image: project.planner?.iconUrl
    },
    event: project.venue ? {
        '@type': 'Event',
        name: project.venue.venueName, // 会場名
        location: {
            '@type': 'Place',
            name: project.venue.venueName,
            address: project.venue.address
        },
        startDate: project.deliveryDate // 納品日(イベント日)
    } : undefined,
    offers: {
        '@type': 'Offer',
        price: project.targetAmount,
        priceCurrency: 'JPY',
        availability: project.status === 'FUNDRAISING' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut'
    }
  } : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 構造化データを埋め込み */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      {/* メインコンテンツ */}
      {children}
    </div>
  );
}