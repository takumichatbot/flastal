'use client';

// Next.js 15のビルドエラー（Prerenderエラー）を回避するための設定
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowLeft, FiLoader } from 'react-icons/fi';

// 環境変数がない場合のフォールバック
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

/**
 * ログインフォームの本体コンポーネント
 */
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowResend(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && (data.message.includes('認証') || data.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(data.message || 'メールアドレスまたはパスワードが違います。');
      }

      login(data.token);
      toast.success('ログインしました！');
      router.push('/mypage');

    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 border border-gray-100 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-sky-600 hover:text-sky-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">おかえりなさい</h1>
          <p className="text-gray-500 text-sm mt-2">FLASTALで推し活を続けましょう</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="example@email.com"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition" 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">パスワード</label>
              <Link href="/forgot-password?userType=USER" className="text-xs text-sky-600 hover:underline">
                忘れた方はこちら
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-sky-600"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3.5 bg-sky-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-sky-600 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'ログイン中...' : 'ログインする'}
          </button>
        </form>

        {showResend && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                <p className="text-sm text-orange-800 mb-3 font-medium">まだメール認証が完了していませんか？</p>
                <button 
                  onClick={handleResendEmail} 
                  className="inline-flex items-center px-4 py-2 bg-white border border-orange-300 text-orange-600 font-bold rounded-lg hover:bg-orange-100 transition shadow-sm text-sm"
                >
                    <FiMail className="mr-2" /> 認証メールを再送する
                </button>
            </div>
        )}
        
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでないですか？<br/>
            <Link href="/register" className="font-bold text-sky-600 hover:text-sky-700 hover:underline mt-1 inline-block">
              新規会員登録（無料）
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * メインエクスポート（Suspenseラップ）
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <FiLoader className="animate-spin text-sky-500" size={40} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}