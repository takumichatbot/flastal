export const metadata = {
  title: 'プレミアムプラン',
  description: 'FLASTALプレミアムプランの詳細。限定バッジ・優先マッチング・特別ポイント還元など、推し活をさらに充実させる特典が盛りだくさん。',
  openGraph: {
    title: 'プレミアムプラン | FLASTAL',
    description: 'FLASTALプレミアムプランの詳細。限定バッジ・優先マッチング・特別ポイント還元など豊富な特典。',
    url: 'https://www.flastal.com/premium',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - プレミアムプラン',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'プレミアムプラン',
    description: 'FLASTALプレミアムプランで推し活をさらに充実させよう。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/premium',
  },
};

export default function PremiumLayout({ children }) {
  return children;
}
