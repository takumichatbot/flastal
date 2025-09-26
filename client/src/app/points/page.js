'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext'; // ★ AuthContextをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const pointPackages = [
  { points: 500, amount: 500, color: 'bg-sky-500', hover: 'hover:bg-sky-600' },
  { points: 1000, amount: 1000, color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
  { points: 3000, amount: 3000, color: 'bg-indigo-500', hover: 'hover:bg-indigo-600' },
];

export default function PointsPage() {
  const { user, userType } = useAuth(); // ★ ログイン中のユーザー情報を取得

  const handleCheckout = async (pkg) => {
    // ★ ログインしていない、またはファンでない場合は処理を中断
    if (!user || userType !== 'USER') {
      alert('ポイントの購入には、ファンとしてログインする必要があります。');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, // ★ ログインしているユーザーのIDを自動で使う
          amount: pkg.amount,
          points: pkg.points,
        }),
      });

      if (!response.ok) throw new Error('サーバーとの通信に失敗しました。');

      const data = await response.json();
      // Stripeの決済ページにリダイレクト
      window.location.href = data.url;

    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">ポイントを購入</h1>
        <p className="text-lg text-gray-600 mb-12">企画を支援するために使用するポイントを購入できます。</p>

        {/* ★★★ ログイン状態に応じて表示を切り替える ★★★ */}
        {user && userType === 'USER' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pointPackages.map((pkg) => (
              <div key={pkg.points} className="bg-white rounded-lg shadow-lg p-8 flex flex-col">
                <p className="text-2xl font-semibold text-gray-500 mb-2">{pkg.points.toLocaleString()} pt</p>
                <p className="text-4xl font-bold text-gray-900 mb-6">¥{pkg.amount.toLocaleString()}</p>
                <button onClick={() => handleCheckout(pkg)} className={`w-full mt-auto px-6 py-3 font-bold text-white ${pkg.color} rounded-lg ${pkg.hover} transition-colors`}>
                  購入する
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-700">ポイントの購入には、ファンとしてログインしてください。</p>
            <Link href="/login">
              <span className="mt-4 inline-block px-8 py-3 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">
                ログインページへ
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
