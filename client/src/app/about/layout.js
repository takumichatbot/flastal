export const metadata = {
  title: 'FLASTALとは | FLASTAL - フラワースタンドで推しを応援するプラットフォーム',
  description: 'FLASTALはフラワースタンド（フラスタ）の企画・資金調達・お花屋さんとのマッチングを一括サポートするプラットフォームです。推し活をもっと楽しく、かんたんに。',
  openGraph: {
    title: 'FLASTALとは | FLASTAL',
    description: 'フラワースタンドの企画・資金調達・お花屋さんとのマッチングを一括サポートするプラットフォーム。',
    url: 'https://www.flastal.com/about',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTALとは',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLASTALとは | FLASTAL',
    description: 'フラワースタンドの企画・資金調達・お花屋さんとのマッチングを一括サポート。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/about',
  },
};

export default function AboutLayout({ children }) {
  return children;
}
