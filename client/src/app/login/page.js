'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiMail } from 'react-icons/fi'; // FiMail追加

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false); // ★追加
  const router = useRouter();
  const { login } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowResend(false); // リセット

    const promise = fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async res => {
      if (!res.ok) {
        const errData = await res.json();
        // ★ エラー内容をチェックして再送信ボタンを表示
        if (res.status === 403 && (errData.message.includes('認証') || errData.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(errData.message || 'メールアドレスまたはパスワードが違います。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: 'ログイン中...',
      success: (data) => {
        login(data.token);
        router.push('/mypage');
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
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-sky-600 text-center mb-8">ログイン</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ... (入力フォーム部分は変更なし) ... */}
          <div>
            <label className="font-semibold text-gray-700">メールアドレス:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" />
          </div>
          <div className="relative">
            <label className="font-semibold text-gray-700">パスワード:</label>
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-600">
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          
          <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4">
            ログインする
          </button>
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
        
        <div className="text-center mt-6 space-y-2">
          {/* ... (リンク部分は変更なし) ... */}
          <p className="text-sm"><Link href="/forgot-password?userType=USER"><span className="text-sky-600 hover:underline">パスワードを忘れた方はこちら</span></Link></p>
          <p className="text-sm">アカウントをお持ちでないですか？ <Link href="/register"><span className="font-semibold text-sky-600 hover:underline">新規登録</span></Link></p>
        </div>
      </div>
    </div>
  );
}