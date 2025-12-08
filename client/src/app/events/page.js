import EventListClient from './EventListClient';

export const metadata = {
  title: 'イベント一覧 | FLASTAL',
  description: '開催予定のイベント情報をチェック。AIによる自動追加機能搭載。',
};

export default function EventsPage() {
  return <EventListClient />;
}