export const metadata = {
  title: 'フィード',
  description: '支援しているフラスタ企画の最新情報をフィードで確認しよう。進捗報告・アップデートをリアルタイムでキャッチ。',
  openGraph: {
    title: 'フィード',
    description: '支援しているフラスタ企画の最新情報をフィードで確認しよう。',
    url: 'https://www.flastal.com/feed',
    siteName: 'FLASTAL',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'フィード',
    description: '支援しているフラスタ企画の最新情報をフィードで確認しよう。',
  },
};

export default function FeedLayout({ children }) {
  return children;
}
