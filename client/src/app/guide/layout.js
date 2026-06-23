export const metadata = {
  title: '使い方ガイド',
  description: 'FLASTALの使い方ガイド。フラスタ企画の始め方・支援方法・お花屋さんとのやり取りまで、はじめての方でも安心のステップバイステップ解説。',
  openGraph: {
    title: '使い方ガイド | FLASTAL',
    description: 'FLASTALの使い方ガイド。フラスタ企画の始め方から完成まで、はじめての方でも安心のステップバイステップ解説。',
    url: 'https://www.flastal.com/guide',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - 使い方ガイド',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '使い方ガイド',
    description: 'フラスタ企画の始め方から完成まで、はじめての方でも安心のステップバイステップ解説。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/guide',
  },
};

export default function GuideLayout({ children }) {
  return children;
}
