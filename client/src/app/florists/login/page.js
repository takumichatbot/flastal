'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail } from 'react-icons/fi'; // FiMail追加

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false); // ★追加
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResend(false); // リセット

    try {
      const res = await fetch(`${API_URL}/api/florists/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // ★ エラーチェック
        if (res.status === 403 && (data.message.includes('認証') || data.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(data.message || 'ログインに失敗しました');
      }

      const userData = { ...data.florist, role: 'FLORIST' };
      await login(data.token, userData);
      toast.success('ログインしました！');
      router.push('/florists/dashboard');

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ★ 追加: 再送信処理
  const handleResendEmail = async () => {
    const toastId = toast.loading('再送信中...');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">お花屋さんログイン</h1>
          <p className="text-sm text-slate-500 mt-2">FLASTALパートナーアカウントへようこそ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (入力フォーム部分は変更なし) ... */}
          <div><label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="example@flower-shop.com"/></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="••••••••"/></div>
          <button type="submit" disabled={isLoading} className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">{isLoading ? 'ログイン中...' : 'ログインする'}</button>
        </form>

        {/* ★★★ 再送信ボタンエリア ★★★ */}
        {showResend && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center animate-fadeIn">
                <p className="text-sm text-yellow-800 mb-3 font-bold">認証メールが見当たりませんか？</p>
                <button onClick={handleResendEmail} className="flex items-center justify-center w-full px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-md transition-colors text-sm">
                    <FiMail className="mr-2" /> 認証メールを再送信する
                </button>
            </div>
        )}

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-slate-600">アカウントをお持ちでないですか？ <Link href="/florists/register" className="text-pink-500 hover:underline font-medium">新規登録はこちら</Link></p>
          <p className="text-xs text-slate-400"><Link href="/forgot-password" className="hover:underline">パスワードを忘れた場合</Link></p>
        </div>
      </div>
    </div>
  );
}