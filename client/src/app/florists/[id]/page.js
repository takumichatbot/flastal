import FloristDetailClient from './FloristDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/api/florists?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const florists = await res.json();
    return (Array.isArray(florists) ? florists : []).map(f => ({ id: f.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/florists/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error();
    const florist = await res.json();

    const name = florist.platformName || florist.shopName || 'お花屋さん';
    const desc = florist.catchPhrase || `${name}のフラスタ制作実績・ポートフォリオをチェック。FLASTAL（フラスタル）でオファーしよう。`;
    const coverImage = florist.portfolioImages?.[0] || florist.iconUrl || null;

    const ogParams = new URLSearchParams({
      name,
      ...(florist.prefecture ? { prefecture: florist.prefecture } : {}),
      ...(florist.responseRate != null ? { responseRate: String(florist.responseRate) } : {}),
      ...(coverImage ? { image: coverImage } : {}),
    });
    const ogImage = `https://www.flastal.com/api/og/florist?${ogParams}`;

    return {
      title: `${name} | お花屋さん`,
      description: desc,
      openGraph: {
        title: `${name} | FLASTAL`,
        description: desc,
        url: `https://www.flastal.com/florists/${id}`,
        siteName: 'FLASTAL',
        images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
        locale: 'ja_JP',
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} | FLASTAL`,
        description: desc,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: 'お花屋さん',
      description: 'FLASTALのお花屋さんパートナーページ。フラスタ制作をオファーしよう。',
    };
  }
}

export default function FloristDetailPage() {
  return <FloristDetailClient />;
}
