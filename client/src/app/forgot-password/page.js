"use client";

// Next.js 15 ビルドエラー回避用
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const TYPE_CONFIG = {
  USER: {
    label: 'ファン', themeColor: 'sky', iconBg: 'bg-sky-100', iconColor: 'text-sky-600',
    btnBg: 'bg-sky-500 hover:bg-sky-600', linkText: 'text-sky-600', loginLink: '/login',
  },
  FLORIST: {
    label: 'お花屋さん', themeColor: 'pink', iconBg: 'bg-pink-100', iconColor: 'text-pink-600',
    btnBg: 'bg-pink-500 hover:bg-pink-600', linkText: 'text-pink-600', loginLink: '/florists/login',
  },
  VENUE: {
    label: '会場', themeColor: 'green', iconBg: 'bg-green-100', iconColor: 'text-green-600',
    btnBg: 'bg-green-600 hover:bg-green-700', linkText: 'text-green-600', loginLink: '/venues/login',
  }
};

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [userType, setUserType] = useState('USER');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('userType');
      if (type && TYPE_CONFIG[type]) setUserType(type);
    }
  }, []);

  const config = TYPE_CONFIG[userType];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email) return setErrorMessage('メールアドレスを入力してください');
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType }), 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'エラーが発生しました。');
      setStatus('success');
      toast.success('再設定メールを送信しました！');
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('idle');
      toast.error('送信に失敗しました');
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      {status === 'success' ? (
        <div className="text-center py-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${config.iconBg} ${config.iconColor}`}>
            <FiCheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">送信しました</h2>
          <p className="text-gray-600 mb-6 text-sm">{email} 宛にパスワード再設定用リンクをお送りしました。</p>
          <Link href={config.loginLink} className={`block w-full py-3 rounded-lg text-white font-bold shadow-md text-center ${config.btnBg}`}>ログイン画面に戻る</Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${config.iconBg} ${config.iconColor}`}>
              <FiLock size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">パスワード再設定</h1>
            <p className={`text-sm font-bold mt-1 ${config.linkText}`}>{config.label} アカウント</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3.5 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none" />
              </div>
              {errorMessage && <div className="text-red-500 text-xs mt-2 font-bold"><FiAlertCircle className="inline mr-1"/>{errorMessage}</div>}
            </div>
            <button disabled={status === 'loading'} className={`w-full py-3.5 text-white font-bold rounded-xl shadow-md flex items-center justify-center ${config.btnBg}`}>
              {status === 'loading' ? <FiLoader className="animate-spin mr-2" /> : '再設定メールを送信'}
            </button>
          </form>
          <div className="text-center mt-6 pt-6 border-t">
            <Link href={config.loginLink} className={`text-sm font-bold flex items-center justify-center gap-1 ${config.linkText}`}><FiArrowLeft /> ログインページに戻る</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<FiLoader className="animate-spin text-gray-400" size={40} />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}