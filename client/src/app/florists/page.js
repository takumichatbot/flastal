'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★★★ お花屋さんカードコンポーネント ★★★
function FloristCard({ florist, projectId, onOffer, isOffering }) {
  // カード全体のクリック時のリンク先
  // オファーモードなら、そのページにとどまる（もしくは新しいタブで開くなど工夫も可能だが一旦シンプルに）
  const cardContent = (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="bg-gradient-to-br from-pink-100 to-rose-200 h-32 flex items-center justify-center text-4xl">
        💐
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{florist.platformName}</h3>
        
        {/* レビュー表示 */}
        <div className="mt-auto mb-4 flex items-center gap-2">
           {florist.reviews && florist.reviews.length > 0 ? (
              <span className="text-xs text-gray-500">({florist.reviews.length}件のレビュー)</span>
            ) : (
              <span className="text-xs text-gray-500">レビューはまだありません</span>
            )}
        </div>

        {/* ★ projectId がある場合はオファーボタンを表示 */}
        {projectId ? (
          <button
            onClick={(e) => {
              e.preventDefault(); // リンク遷移を防ぐ
              onOffer(florist.id);
            }}
            disabled={isOffering}
            className="w-full mt-2 py-2 px-4 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-400"
          >
            {isOffering ? '送信中...' : 'この花屋さんにオファー'}
          </button>
        ) : (
          // 通常時はプロフィールへのリンク
          <span className="text-pink-500 text-sm font-semibold group-hover:underline">
            プロフィールを見る →
          </span>
        )}
      </div>
    </div>
  );

  // オファーモードのときはカード全体をリンクにしない（ボタンと競合するため）
  if (projectId) {
    return <div className="h-full">{cardContent}</div>;
  }

  return (
    <Link href={`/florists/${florist.id}`} className="block h-full">
      {cardContent}
    </Link>
  );
}

// ★★★ お花屋さん一覧リストの中身（Suspenseでラップされる部分） ★★★
function FloristsListContent() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffering, setIsOffering] = useState(false); // オファー処理中フラグ
  
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId'); // URLから企画IDを取得
  const router = useRouter();

  useEffect(() => {
    const fetchFlorists = async () => {
      try {
        const response = await fetch(`${API_URL}/api/florists`);
        if (!response.ok) throw new Error('データの取得に失敗しました。');
        const data = await response.json();
        setFlorists(data);
      } catch (error) {
        console.error(error);
        toast.error('お花屋さん一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchFlorists();
  }, []);

  // ★ オファーを送信する関数
  const handleOffer = async (floristId) => {
    if (!projectId) return;
    
    if (!window.confirm('このお花屋さんにオファーを送信しますか？\n承認されるとチャットルームが開設されます。')) {
      return;
    }

    setIsOffering(true);
    const toastId = toast.loading('オファーを送信中...');

    try {
      const res = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, floristId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'オファーの送信に失敗しました。');
      }

      toast.success('オファーを送信しました！', { id: toastId });
      // 企画詳細ページに戻る
      router.push(`/projects/${projectId}`);

    } catch (error) {
      toast.error(error.message, { id: toastId });
      setIsOffering(false);
    }
  };

  return (
    <main>
      <div className="relative w-full bg-pink-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">お花屋さんを探す</h1>
          {projectId ? (
            <p className="mt-4 text-lg text-pink-600 font-semibold bg-white inline-block px-6 py-2 rounded-full shadow-sm">
              企画ID: {projectId} のオファー先を選択中
            </p>
          ) : (
            <p className="mt-2 text-gray-600">あなたの想いを形にしてくれる、素敵なお花屋さんを見つけましょう。</p>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-center">読み込み中...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {florists.map((florist) => (
              <FloristCard 
                key={florist.id} 
                florist={florist} 
                projectId={projectId}
                onOffer={handleOffer}
                isOffering={isOffering}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ★★★ メインコンポーネント (Suspenseラッパー) ★★★
export default function FloristsPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense fallback={<div className="text-center py-20">読み込み中...</div>}>
        <FloristsListContent />
      </Suspense>
    </div>
  );
}