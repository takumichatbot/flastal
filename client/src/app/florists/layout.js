export const metadata = {
  title: 'お花屋さん一覧',
  description: 'フラスタ制作に対応したお花屋さんを探そう。エリア・ジャンル・お急ぎ便対応など条件で絞り込めます。FLASTAL（フラスタル）公式パートナー花屋一覧。',
  openGraph: {
    title: 'お花屋さん一覧 | FLASTAL',
    description: 'フラスタ制作に対応したお花屋さんを探そう。FLASTAL（フラスタル）公式パートナー花屋一覧。',
    url: 'https://www.flastal.com/florists',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - お花屋さん一覧',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お花屋さん一覧',
    description: 'フラスタ制作に対応したお花屋さんを探そう。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/florists',
  },
};

export default function FloristsLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "フラワースタンド対応お花屋さん一覧",
            "description": "アイドル・VTuber向けフラワースタンドに対応したお花屋さん一覧",
            "url": "https://www.flastal.com/florists"
          })
        }}
      />
      {children}
    </>
  );
}
