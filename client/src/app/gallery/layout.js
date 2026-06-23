export const metadata = {
    title: 'ギャラリー - フラワースタンドの思い出を残そう',
    description: '全国のフラワースタンドの写真・思い出をギャラリーでご覧ください。アイドル・VTuber・舞台・アニメ・声優など様々なイベントのフラスタ写真を掲載しています。',
    openGraph: {
        title: 'ギャラリー',
        description: '全国のフラワースタンドの写真・思い出ギャラリー。あなたの推しへのフラスタを記録しよう。',
        url: 'https://www.flastal.com/gallery',
        siteName: 'FLASTAL',
        images: [
            {
                url: 'https://www.flastal.com/opengraph-image.png',
                width: 1200,
                height: 630,
                alt: 'FLASTAL - フラスタギャラリー',
            },
        ],
        locale: 'ja_JP',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ギャラリー',
        description: '全国のフラワースタンドの写真・思い出ギャラリー',
        images: ['https://www.flastal.com/opengraph-image.png'],
    },
    alternates: {
        canonical: 'https://www.flastal.com/gallery',
    },
};

export default function GalleryLayout({ children }) {
    return children;
}
