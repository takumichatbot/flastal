'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast'; // Import toast
import { useRouter } from 'next/navigation'; // Import router for redirect

// ★ API_URL corrected
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const pointPackages = [
  { points: 1000, amount: 1000 },
  { points: 5000, amount: 5000 },
  { points: 10000, amount: 10000 },
];

export default function PointsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false); // For checkout process
  const router = useRouter(); // Initialize router

  const handleCheckout = async (pkg) => {
    if (!user) {
      toast.error('ポイントの購入には、ログインする必要があります。');
      router.push('/login'); // Redirect to login
      return;
    }
    setLoading(true);

    // ★★★ Corrected API call: remove token, add userId ★★★
    try {
      const response = await fetch(`${API_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Authorization header removed
        },
        body: JSON.stringify({
          amount: pkg.amount,
          points: pkg.points,
          userId: user.id, // ★ Add userId from context
        }),
      });

      if (!response.ok) throw new Error('決済セッションの作成に失敗しました。');

      const data = await response.json();
      // Redirect to Stripe checkout URL
      window.location.href = data.url; 

    } catch (error) {
      toast.error(`エラー: ${error.message}`); // Use toast for error
      setLoading(false); // Reset loading state on error
    }
    // No finally setLoading(false) here because we redirect on success
  };

  // Show loading indicator while auth state is being determined
  if (authLoading) {
    return (
      <div className="bg-sky-50 min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  // Show login prompt if not logged in after auth check
  if (!user) {
    return (
      <div className="bg-sky-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 text-center bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">ポイントを購入するには、ログインしてください。</p>
          <Link href="/login" className="inline-block px-8 py-3 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors">
              ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  // Logged-in view
  return (
    <div className="bg-sky-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-sky-600">ポイント購入</h1>
          <p className="text-gray-500 mt-4 text-lg">企画を支援するためのポイントを購入します。</p>
        </header>

        {/* Display current points */}
        <section className="bg-white p-6 border rounded-xl shadow-md mb-12 text-center">
            <p className="text-gray-600">現在の保有ポイント</p>
            {/* Ensure user.points exists */}
            <p className="text-4xl font-bold text-sky-600 my-2">{(user.points || 0).toLocaleString()} pt</p> 
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pointPackages.map((pkg, index) => (
            <div 
              key={pkg.points} 
              // Added relative positioning for the badge
              className={`relative bg-white p-8 border rounded-xl shadow-md text-center flex flex-col ${index === 1 ? 'border-2 border-sky-500 shadow-lg' : 'border-gray-200'}`} 
            >
              {/* Positioned the badge correctly */}
              {index === 1 && <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">おすすめ</p>}
              <p className="text-2xl font-semibold text-gray-800">{pkg.points.toLocaleString()} pt</p>
              <p className="text-4xl font-bold text-gray-900 my-4">¥{pkg.amount.toLocaleString()}</p>
              <button 
                onClick={() => handleCheckout(pkg)}
                disabled={loading} // Disable button during processing
                className="w-full mt-auto p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '処理中...' : '購入する'}
              </button>
            </div>
          ))}
        </section>
        
        {/* Add legal text / terms link if necessary */}
        <p className="text-center text-xs text-gray-400 mt-12">
            ポイント購入に関する<Link href="/terms" className="underline hover:text-gray-600">利用規約</Link>をご確認ください。
        </p>
      </div>
    </div>
  );
}