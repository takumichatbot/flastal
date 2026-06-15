import FloristDetailClient from './FloristDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const DEFAULT_IMAGE = 'https://www.flastal.com/opengraph-image.png';

  try {
    const res = await fetch(`${API_URL}/api/florists/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error();
    const florist = await res.json();

    const name = florist.platformName || florist.shopName || 'お花屋さん';
    const desc = florist.catchPhrase || `${name}のフラスタ制作実績・ポートフォリオをチェック。FLASTAL（フラスタル）でオファーしよう。`;
    const image = florist.portfolioImages?.[0] || florist.iconUrl || DEFAULT_IMAGE;

    return {
      title: `${name} | お花屋さん | FLASTAL`,
      description: desc,
      openGraph: {
        title: `${name} | FLASTAL`,
        description: desc,
        url: `https://www.flastal.com/florists/${id}`,
        siteName: 'FLASTAL',
        images: [{ url: image, width: 1200, height: 630, alt: name }],
        locale: 'ja_JP',
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} | FLASTAL`,
        description: desc,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'お花屋さん | FLASTAL',
      description: 'FLASTALのお花屋さんパートナーページ。フラスタ制作をオファーしよう。',
    };
  }
}

export default function FloristDetailPage() {
  return <FloristDetailClient />;
}
