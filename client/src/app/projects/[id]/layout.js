import { headers } from 'next/headers';

// バックエンドのURL (データ取得用)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
// フロントエンドのURL (OGP画像のリンク生成用)
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://flastal.vercel.app'; 

export async function generateMetadata({ params }) {
  const id = params.id;

  try {
    // 企画データを取得
    const res = await fetch(`${API_URL}/api/projects/${id}`, { 
        cache: 'no-store' // 常に最新を取得
    });
    
    if (!res.ok) {
        return { title: '企画が見つかりません | FLASTAL' };
    }

    const project = await res.json();

    // 進捗率の計算
    const progress = project.targetAmount > 0 
        ? Math.min((project.collectedAmount / project.targetAmount) * 100, 100).toFixed(0) 
        : 0;

    // 動的OGP画像のURLを作成 (/api/og は以前作成したもの)
    const ogImageUrl = new URL(`${FRONTEND_URL}/api/og`);
    ogImageUrl.searchParams.set('title', project.title);
    ogImageUrl.searchParams.set('progress', progress);
    ogImageUrl.searchParams.set('collected', project.collectedAmount);
    ogImageUrl.searchParams.set('target', project.targetAmount);

    return {
      title: `${project.title} | FLASTAL`,
      description: project.description?.substring(0, 120) + '...',
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

  } catch (error) {
    console.error('Metadata generation error:', error);
    return { title: 'FLASTAL - フラスタクラウドファンディング' };
  }
}

export default function ProjectLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
}