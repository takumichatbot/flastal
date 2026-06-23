import GroupBuyDetailClient from './GroupBuyDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(
      `${API_URL}/api/group-buys/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error('not found');
    const gb = await res.json();
    const title = `${gb.title} | FLASTAL`;
    const description = gb.description
      ? gb.description.substring(0, 120) + (gb.description.length > 120 ? '...' : '')
      : `一口${Number(gb.pricePerSlot || 0).toLocaleString()}円・目標${gb.targetSlots || 0}口のグループ購入企画。`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.flastal.com/group-buy/${id}`,
        images: [{ url: '/og-default.png', width: 1200, height: 630, alt: gb.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og-default.png'],
      },
    };
  } catch {
    return { title: 'グループ購入 | FLASTAL' };
  }
}

export default function GroupBuyDetailPage() {
  return <GroupBuyDetailClient />;
}
