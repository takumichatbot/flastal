export const metadata = {
  title: 'お問い合わせ',
  description: 'FLASTALへのお問い合わせ。サービスに関するご質問・ご意見・不具合報告などはこちらからお送りください。',
  openGraph: {
    title: 'お問い合わせ | FLASTAL',
    description: 'FLASTALへのお問い合わせ。サービスに関するご質問・ご意見・不具合報告などはこちらからお送りください。',
    url: 'https://www.flastal.com/contact',
    siteName: 'FLASTAL',
    images: [
      {
        url: 'https://www.flastal.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - お問い合わせ',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お問い合わせ',
    description: 'FLASTALへのご質問・ご意見はこちらからお送りください。',
    images: ['https://www.flastal.com/opengraph-image.png'],
  },
  alternates: {
    canonical: 'https://www.flastal.com/contact',
  },
  robots: { index: false, follow: false },
};

export default function ContactLayout({ children }) {
  return children;
}
