'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiMail } from 'react-icons/fi'; // FiMail追加

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false); // ★追加
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowResend(false); // リセット
    
    const promise = fetch(`${API_URL}/api/venues/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        // ★ エラーチェック
        if (response.status === 403 && (data.message.includes('認証') || data.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(data.message || 'ログインに失敗しました');
      }
      return data;
    });

    toast.promise(promise, {
      loading: 'ログイン中...',
      success: (data) => {
        localStorage.setItem('flastal-venue', JSON.stringify(data.venue));
        router.push(`/venues/dashboard/${data.venue.id}`);
        return 'ログインしました！';
      },
      error: (err) => err.message,
    });
  };

  // ★ 追加: 再送信処理
  const handleResendEmail = async () => {
    const toastId = toast.loading('再送信中...');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            userType: 'VENUE' // ★★★ これを追加！ ★★★
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { id: toastId });
        setShowResend(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900 whitespace-nowrap">ライブハウス・会場様 ログイン</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (入力フォーム部分は変更なし) ... */}
          <div><label className="block text-sm font-medium text-gray-700">メールアドレス</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/></div>
          <div className="relative"><label className="block text-sm font-medium text-gray-700">パスワード</label><input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-600">{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button></div>
          <div><button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">ログイン</button></div>
        </form>

        {/* ★★★ 再送信ボタンエリア ★★★ */}
        {showResend && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center animate-fadeIn">
                <p className="text-sm text-yellow-800 mb-3 font-bold">認証メールが見当たりませんか？</p>
                <button onClick={handleResendEmail} className="flex items-center justify-center w-full px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-md transition-colors text-sm">
                    <FiMail className="mr-2" /> 認証メールを再送信する
                </button>
            </div>
        )}

        <div className="text-sm text-center text-gray-600">
          <Link href="/forgot-password?userType=VENUE"><span className="font-medium text-sky-600 hover:underline">パスワードを忘れた方はこちら</span></Link>
        </div>
        <p className="text-sm text-center text-gray-600">アカウントをお持ちでないですか？ <Link href="/venues/register"><span className="font-medium text-sky-600 hover:underline">新規登録</span></Link></p>
      </div>
    </div>
  );
}