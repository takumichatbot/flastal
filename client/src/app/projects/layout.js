export const metadata = {
  title: 'フラスタ企画一覧 | FLASTAL',
  description: '推しへのフラワースタンド（フラスタ）企画を探そう。アイドル・VTuber・舞台・アニメ・声優など多彩なジャンルの企画が集まるFLASTAL。',
  openGraph: {
    title: 'フラスタ企画一覧 | FLASTAL',
    description: '推しへのフラスタ企画を探そう。FLASTAL（フラスタル）で一緒に応援しよう。',
    url: 'https://www.flastal.com/projects',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - フラスタ企画一覧',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'フラスタ企画一覧 | FLASTAL',
    description: '推しへのフラスタ企画を探そう。FLASTAL（フラスタル）で一緒に応援しよう。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/projects',
  },
};

export default function ProjectsLayout({ children }) {
  return children;
}
