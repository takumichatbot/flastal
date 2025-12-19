'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('認証情報を確認しています...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('トークンが見つかりません。URLを確認してください。');
      return;
    }

    // 2回実行を防ぐためのフラグ管理（React 18のStrict Mode対策）
    let isMounted = true;

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (isMounted) {
          if (res.ok) {
            setStatus('success');
            setMessage(data.message || '認証に成功しました！');
            toast.success('認証成功！ログイン画面へ移動します。');
            
            // 3秒後にログイン画面へリダイレクト
            setTimeout(() => {
              router.push('/login'); // 必要に応じて /florists/login などに変えてもOK
            }, 3000);
          } else {
            setStatus('error');
            setMessage(data.message || '認証に失敗しました。');
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error(error);
          setStatus('error');
          setMessage('サーバーエラーが発生しました。');
        }
      }
    };

    verifyEmail();

    return () => { isMounted = false; };
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-100">
        
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <FiLoader className="text-4xl text-indigo-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">確認中...</h2>
            <p className="text-gray-500 text-sm">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <FiCheckCircle className="text-5xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">認証完了</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-400">数秒後にログイン画面へ移動します...</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-bold text-sm"
            >
              今すぐログイン
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <FiAlertCircle className="text-5xl text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">認証エラー</h2>
            <p className="text-red-600 mb-6">{message}</p>
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-600 text-sm"
            >
              ログイン画面へ戻る
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 flex items-center justify-center">
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}