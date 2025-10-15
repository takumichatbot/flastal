'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

// ★ 1. APIの接続先をPythonバックエンドに変更
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

const pointPackages = [
  { points: 1000, amount: 1000 },
  { points: 5000, amount: 5000 },
  { points: 10000, amount: 10000 },
];

export default function PointsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (pkg) => {
    if (!user) {
      alert('ポイントの購入には、ログインする必要があります。');
      return;
    }
    setLoading(true);

    // ★ 2. 認証情報(トークン)を取得
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('認証情報が見つかりません。再度ログインしてください。');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ★ 認証情報をヘッダーに追加
        },
        // ★ 3. バックエンドがトークンからユーザーを特定するため、userIdは不要
        body: JSON.stringify({
          amount: pkg.amount,
          points: pkg.points,
        }),
      });

      if (!response.ok) throw new Error('サーバーとの通信に失敗しました。');

      const data = await response.json();
      window.location.href = data.url;

    } catch (error) {
      alert(`エラー: ${error.message}`);
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    // ログインしていない、または認証情報読み込み中の表示
    return (
      <div className="bg-sky-50 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 text-center bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">ポイントを購入するには、ログインしてください。</p>
          <Link href="/login">
            <span className="inline-block px-8 py-3 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors">
              ログインページへ
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sky-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-sky-600">ポイント購入</h1>
          <p className="text-gray-500 mt-4 text-lg">企画を支援するためのポイントを購入します。</p>
        </header>

        {/* ★ 4. 現在の保有ポイント表示を追加 */}
        <section className="bg-white p-6 border rounded-xl shadow-md mb-12 text-center">
            <p className="text-gray-600">現在の保有ポイント</p>
            <p className="text-4xl font-bold text-sky-600 my-2">{user.points.toLocaleString()} pt</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pointPackages.map((pkg, index) => (
            <div 
              key={pkg.points} 
              // ★ 4. UIデザインをサイト全体で統一
              className={`bg-white p-8 border rounded-xl shadow-md text-center flex flex-col ${index === 1 ? 'border-2 border-sky-500 shadow-lg' : ''}`}
            >
              {index === 1 && <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-3 py-1 rounded-full text-sm font-semibold">おすすめ</p>}
              <p className="text-2xl font-semibold text-gray-800">{pkg.points.toLocaleString()} pt</p>
              <p className="text-4xl font-bold text-gray-900 my-4">¥{pkg.amount.toLocaleString()}</p>
              <button 
                onClick={() => handleCheckout(pkg)}
                disabled={loading}
                className="w-full mt-auto p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold disabled:bg-gray-400"
              >
                {loading ? '処理中...' : '購入する'}
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}