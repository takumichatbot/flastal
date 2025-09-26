'use client'; // ★ このページをクライアントコンポーネントに変更

import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent'; // ★ ログイン前の内容
import Dashboard from './components/Dashboard'; // ★ ログイン後の内容

export default function Home() {
  const { user, userType } = useAuth();

  // ★ ログインしていて、かつファン(USER)ならダッシュボードを表示
  if (user && userType === 'USER') {
    return <Dashboard />;
  }

  // ★ それ以外の場合（ログアウト中、お花屋さん、会場）は、通常のホームページを表示
  return <HomePageContent />;
}