export const metadata = {
  title: 'お花屋さんマッチング | FLASTAL',
  description: 'フラスタ制作に最適なお花屋さんを自動マッチング。エリア・予算・イベント日程に合わせて最適なパートナーを見つけよう。',
  openGraph: {
    title: 'お花屋さんマッチング | FLASTAL',
    description: 'フラスタ制作に最適なお花屋さんを自動マッチング。エリア・予算・イベント日程に合わせて最適なパートナーを見つけよう。',
    url: 'https://www.flastal.com/matching',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - お花屋さんマッチング',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お花屋さんマッチング | FLASTAL',
    description: 'フラスタ制作に最適なお花屋さんを自動マッチング。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/matching',
  },
};

export default function MatchingLayout({ children }) {
  return children;
}
