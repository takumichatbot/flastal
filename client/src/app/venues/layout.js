export const metadata = {
  title: '会場一覧',
  description: 'フラワースタンドの設置実績がある会場一覧。搬入規定・フラスタ許可状況・アクセス情報を確認できます。',
  openGraph: {
    title: '会場一覧 | FLASTAL',
    description: 'フラワースタンドの設置実績がある会場一覧。搬入規定・フラスタ許可状況・アクセス情報を確認できます。',
    url: 'https://www.flastal.com/venues',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - 会場一覧',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '会場一覧',
    description: 'フラワースタンドの設置実績がある会場一覧。搬入規定・フラスタ許可状況を確認できます。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/venues',
  },
};

export default function VenuesLayout({ children }) {
  return children;
}
