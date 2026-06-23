import IllustratorDetailClient from './IllustratorDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const DEFAULT_IMAGE = 'https://www.flastal.com/opengraph-image.png';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/illustrators/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'クリエイター' };
    const illustrator = await res.json();
    const name = illustrator.name || illustrator.user?.handleName || 'クリエイター';
    const bio = illustrator.bio ? illustrator.bio.slice(0, 120) : 'FLASTALのイラストクリエイターです。';
    const image = illustrator.portfolioUrls?.[0] || illustrator.iconUrl || illustrator.user?.iconUrl || DEFAULT_IMAGE;
    return {
      title: `${name} | イラストクリエイター`,
      description: bio,
      openGraph: {
        title: `${name} | FLASTAL`,
        description: bio,
        images: [{ url: image, width: 1200, height: 630 }],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} | FLASTAL`,
        description: bio,
        images: [image],
      },
    };
  } catch {
    return { title: 'クリエイター' };
  }
}

export default function IllustratorDetailPage() {
  return <IllustratorDetailClient />;
}
