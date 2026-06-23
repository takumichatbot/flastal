export const metadata = {
  title: 'アーティスト・グループページ | FLASTAL',
  description: 'アイドル・VTuber・声優・舞台俳優など推しのアーティストページを検索。フラスタ企画との連携でもっと応援しよう。',
  openGraph: {
    title: 'アーティスト・グループページ | FLASTAL',
    description: 'アイドル・VTuber・声優・舞台俳優など推しのアーティストページを検索。フラスタ企画との連携でもっと応援しよう。',
    url: 'https://www.flastal.com/artists',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - アーティストページ',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アーティスト・グループページ | FLASTAL',
    description: '推しのアーティストページを検索してフラスタ企画を応援しよう。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/artists',
  },
};

export default function ArtistsLayout({ children }) {
  return children;
}
