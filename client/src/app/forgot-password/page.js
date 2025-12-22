"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★★★ 設定オブジェクト ★★★
// ユーザータイプごとの色やテキスト、リンク先を定義
const TYPE_CONFIG = {
  USER: {
    label: 'ファン',
    themeColor: 'sky', // Tailwindの色名
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    btnBg: 'bg-sky-500 hover:bg-sky-600',
    linkText: 'text-sky-600',
    loginLink: '/login',
  },
  FLORIST: {
    label: 'お花屋さん',
    themeColor: 'pink',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    btnBg: 'bg-pink-500 hover:bg-pink-600',
    linkText: 'text-pink-600',
    loginLink: '/florists/login',
  },
  VENUE: {
    label: '会場',
    themeColor: 'green',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    btnBg: 'bg-green-600 hover:bg-green-700',
    linkText: 'text-green-600',
    loginLink: '/venues/login',
  }
};

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success
  const [errorMessage, setErrorMessage] = useState('');

  // 1. URLから userType を読み取る
  const searchParams = useSearchParams();
  const userTypeParam = searchParams.get('userType');
  
  // userType が定義外の場合は 'USER' をデフォルトにする
  const userType = (userTypeParam && TYPE_CONFIG[userTypeParam]) ? userTypeParam : 'USER';
  const config = TYPE_CONFIG[userType];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // 簡易バリデーション
    if (!email) return setErrorMessage('メールアドレスを入力してください');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErrorMessage('正しいメールアドレスの形式で入力してください');

    setStatus('loading');
    
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType }), 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'エラーが発生しました。');
      }

      // 成功時
      setStatus('success');
      toast.success('再設定メールを送信しました！');

    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
      setStatus('idle');
      toast.error('送信に失敗しました');
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      
      {/* --- 送信完了画面 --- */}
      {status === 'success' ? (
        <div className="text-center animate-fadeIn py-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${config.iconBg} ${config.iconColor}`}>
            <FiCheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">送信しました</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            <span className="font-bold text-gray-800">{email}</span> 宛に<br/>
            パスワード再設定用のリンクをお送りしました。<br/>
            メールをご確認の上、手続きを進めてください。
          </p>
          
          <div className="space-y-3">
            <Link href={config.loginLink} className={`block w-full py-3 rounded-lg text-white font-bold shadow-md transition-colors text-center ${config.btnBg}`}>
              ログイン画面に戻る
            </Link>
            <button 
              onClick={() => setStatus('idle')} 
              className="text-sm text-gray-500 hover:text-gray-800 underline"
            >
              メールが届かない場合 / 再入力
            </button>
          </div>
        </div>
      ) : (
        /* --- 入力フォーム --- */
        <>
          <div className="text-center mb-8">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${config.iconBg} ${config.iconColor}`}>
              <FiLock size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">パスワード再設定</h1>
            <p className={`text-sm font-bold mt-1 ${config.linkText}`}>
              {config.label} アカウント
            </p>
            <p className="text-sm text-gray-500 mt-2">
              登録済みのメールアドレスを入力してください。<br/>リセット用リンクをお送りします。
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${errorMessage ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100'}`}
                />
              </div>
              {errorMessage && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-2 font-bold animate-fadeIn">
                  <FiAlertCircle /> {errorMessage}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className={`w-full py-3.5 text-white font-bold rounded-xl shadow-md transition-all transform active:scale-95 flex items-center justify-center ${config.btnBg} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </>
              ) : '再設定メールを送信'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <Link href={config.loginLink} className={`flex items-center justify-center gap-1 text-sm font-bold hover:underline ${config.linkText}`}>
              <FiArrowLeft /> ログインページに戻る
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// メインページコンポーネント
export default function ForgotPasswordPage() {
  return (
    // 背景色も動的に変えたいところですが、Suspenseの外側なので汎用的な色にしておきます
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-400"></div>
        </div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}