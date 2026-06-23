export const metadata = {
    title: 'ログイン | FLASTAL',
    description: 'FLASTALにログインして推し活を続けよう。アイドル・VTuberへのフラスタ企画に参加・支援できます。',
    openGraph: {
        title: 'ログイン | FLASTAL',
        description: 'FLASTALにログインして推し活を続けよう。',
        url: 'https://www.flastal.com/login',
        siteName: 'FLASTAL',
        images: [
            {
                url: 'https://www.flastal.com/opengraph-image.png',
                width: 1200,
                height: 630,
                alt: 'FLASTAL - ログイン',
            },
        ],
        locale: 'ja_JP',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'ログイン | FLASTAL',
        description: 'FLASTALにログインして推し活を続けよう。',
    },
    alternates: {
        canonical: 'https://www.flastal.com/login',
    },
    robots: { index: false, follow: false },
};

export default function LoginLayout({ children }) {
    return children;
}
