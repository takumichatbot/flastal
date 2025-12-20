'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { FiMail } from 'react-icons/fi'; // FiMail追加

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OrganizerLoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm(); // getValuesを追加
  const { login } = useAuth();
  const router = useRouter();
  const [showResend, setShowResend] = useState(false); // ★追加

  const onSubmit = async (data) => {
    setShowResend(false); // リセット
    try {
      const res = await fetch(`${API_URL}/api/organizers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // エラーレスポンスでもJSONをパースする必要がある
      const result = await res.json();

      if (!res.ok) {
        // ★ エラーチェック
        if (res.status === 403 && (result.message.includes('認証') || result.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(result.message || 'ログインに失敗しました。');
      }

      login(result.token);
      toast.success('主催者としてログインしました');
      router.push('/organizers/dashboard');

    } catch (error) {
      toast.error(error.message);
    }
  };

  // ★ 追加: 再送信処理
  const handleResendEmail = async () => {
    const email = getValues('email'); // react-hook-formから値を取得
    if (!email) return toast.error('メールアドレスを入力してください');

    const toastId = toast.loading('再送信中...');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: getValues('email'), // react-hook-formの場合
            userType: 'ORGANIZER' // ★★★ これを追加！ ★★★
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
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-900">主催者ログイン</h1>
          <p className="text-sm text-gray-500 mt-2">イベント公式アカウント運用者向け</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ... (入力フォーム部分は変更なし) ... */}
          <div><label className="block text-sm font-medium text-gray-700">メールアドレス</label><input type="email" {...register('email', { required: '必須です' })} className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"/>{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}</div>
          <div><label className="block text-sm font-medium text-gray-700">パスワード</label><input type="password" {...register('password', { required: '必須です' })} className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"/>{errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}</div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400">{isSubmitting ? 'ログイン中...' : 'ログイン'}</button>
        </form>

        {/* ★★★ 再送信ボタンエリア ★★★ */}
        {showResend && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center animate-fadeIn">
                <p className="text-sm text-yellow-800 mb-3 font-bold">認証メールが見当たりませんか？</p>
                <button type="button" onClick={handleResendEmail} className="flex items-center justify-center w-full px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-md transition-colors text-sm">
                    <FiMail className="mr-2" /> 認証メールを再送信する
                </button>
            </div>
        )}

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">アカウントをお持ちでないですか？</p>
          <Link href="/organizers/register" className="text-indigo-600 hover:underline font-semibold">新規主催者登録はこちら</Link>
        </div>
      </div>
    </div>
  );
}