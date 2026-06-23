export const metadata = {
  title: '機能紹介',
  description: 'FLASTALの機能一覧。企画作成・クラウドファンディング・お花屋さんマッチング・ギャラリー・アーティストページなど、推し活を支えるすべての機能を紹介。',
  openGraph: {
    title: '機能紹介 | FLASTAL',
    description: 'FLASTALの機能一覧。企画作成・クラウドファンディング・お花屋さんマッチングなど推し活を支えるすべての機能を紹介。',
    url: 'https://www.flastal.com/features',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - 機能紹介',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '機能紹介',
    description: 'FLASTALの機能一覧。推し活を支えるすべての機能を紹介。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/features',
  },
};

export default function FeaturesLayout({ children }) {
  return children;
}
