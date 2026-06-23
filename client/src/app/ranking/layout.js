export const metadata = {
    title: '人気企画ランキング | FLASTAL',
    description: '今注目のフラスタ企画をランキングで紹介。支援額・支援者数・達成率で話題のプロジェクトをチェックしよう。',
    openGraph: {
        title: '人気企画ランキング | FLASTAL',
        description: '今注目のフラスタ企画をランキングで紹介。支援額・支援者数・達成率で話題のプロジェクトをチェックしよう。',
        url: 'https://www.flastal.com/ranking',
        siteName: 'FLASTAL',
        images: [
            {
                url: 'https://www.flastal.com/opengraph-image.png',
                width: 1200,
                height: 630,
                alt: 'FLASTAL - 人気企画ランキング',
            },
        ],
        locale: 'ja_JP',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: '人気企画ランキング | FLASTAL',
        description: '今注目のフラスタ企画をランキングで紹介。',
        images: ['https://www.flastal.com/opengraph-image.png'],
    },
    alternates: {
        canonical: 'https://www.flastal.com/ranking',
    },
};

export default function RankingLayout({ children }) {
    return children;
}
