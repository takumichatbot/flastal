'use client'; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent'; // ログイン前の内容

export default function Home() {
  const { user, loading } = useAuth(); // AuthContext から user と loading を取得
  const router = useRouter();

  useEffect(() => {
    // AuthContext がまだユーザー情報を読み込んでいる間は待機
    if (loading) {
      return;
    }

    // 読み込みが完了し、user が存在する (ログインしている) 場合
    if (user) {
      // 役割 (role) に応じて適切なダッシュボードにリダイレクト
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'USER') {
        router.push('/mypage');
      }
      // 注: お花屋さんや会場は AuthContext (user) ではなく
      // localStorage で管理されているため、このロジックではリダイレクトされません。
      // (Header.js のロジックに基づく)
    }
    // user が null (未ログイン) の場合は、何もせず HomePageContent を表示
  }, [user, loading, router]);

  // ログインチェック中 (loading) または
  // ログイン済みでリダイレクト実行待ち (user が存在する) の間は、ローディング画面を表示
  if (loading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-sky-50">
        <p className="text-gray-700">読み込み中...</p>
      </div>
    );
  }

  // 読み込みが完了し、かつ未ログイン (user が null) の場合のみ、
  // ホームページのコンテンツを表示
  return <HomePageContent />;
}