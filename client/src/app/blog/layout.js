export const metadata = {
  title: 'ブログ',
  description: 'FLASTALブログ。フラスタの作り方・推し活のヒント・成功事例・新機能のお知らせなど役立つ情報を発信中。',
  openGraph: {
    title: 'ブログ',
    description: 'フラスタの作り方・推し活のヒント・成功事例・新機能のお知らせなど役立つ情報を発信中。',
    url: 'https://www.flastal.com/blog',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL ブログ',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ブログ',
    description: 'フラスタの作り方・推し活のヒント・成功事例を発信中。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/blog',
  },
};

export default function BlogLayout({ children }) {
  return children;
}
