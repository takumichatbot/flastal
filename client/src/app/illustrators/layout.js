export const metadata = {
  title: 'クリエイター（絵師）一覧 | FLASTAL',
  description: 'フラスタのイラストパネルを手掛けるクリエイター（絵師）一覧。あなたの推し活に合ったクリエイターを見つけよう。',
  openGraph: {
    title: 'クリエイター（絵師）一覧 | FLASTAL',
    description: 'フラスタのイラストパネルを手掛けるクリエイター（絵師）一覧。あなたの推し活に合ったクリエイターを見つけよう。',
    url: 'https://www.flastal.com/illustrators',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - クリエイター一覧',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'クリエイター（絵師）一覧 | FLASTAL',
    description: 'フラスタのイラストパネルを手掛けるクリエイター一覧。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/illustrators',
  },
};

export default function IllustratorsLayout({ children }) {
  return children;
}
