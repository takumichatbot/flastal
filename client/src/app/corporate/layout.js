export const metadata = {
  title: '企業スポンサー | FLASTAL',
  description: 'FLASTALの企業スポンサープログラム。フラスタ企画への法人協賛・ブランド露出・ファンとの共創機会についてご案内します。',
  openGraph: {
    title: '企業スポンサー | FLASTAL',
    description: 'FLASTALの企業スポンサープログラム。フラスタ企画への法人協賛・ブランド露出についてご案内します。',
    url: 'https://www.flastal.com/corporate',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - 企業スポンサー',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '企業スポンサー | FLASTAL',
    description: 'FLASTALの企業スポンサープログラムについてご案内します。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/corporate',
  },
};

export default function CorporateLayout({ children }) {
  return children;
}
