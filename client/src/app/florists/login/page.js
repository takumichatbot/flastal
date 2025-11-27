'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext'; // パスは環境に合わせて調整

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth(); // AuthContextからlogin関数を取得

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/florists/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }

      // ★ここが重要：サーバーは { florist: ... } を返すが、
      // AuthContext は統一的に扱いたいため、role を明示して渡す
      const userData = {
        ...data.florist,
        role: 'FLORIST' // フロントエンド側で識別するためにroleを付与
      };

      // AuthContextのログイン処理を実行
      // (ここでlocalStorageへの保存とstate更新が行われるはずです)
      await login(data.token, userData);

      toast.success('ログインしました！');
      
      // ダッシュボードへ遷移
      router.push('/florists/dashboard');

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">お花屋さんログイン</h1>
          <p className="text-sm text-slate-500 mt-2">
            FLASTALパートナーアカウントへようこそ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              placeholder="example@flower-shop.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? 'ログイン中...' : 'ログインする'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-slate-600">
            アカウントをお持ちでないですか？{' '}
            <Link href="/florists/register" className="text-pink-500 hover:underline font-medium">
              新規登録はこちら
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            <Link href="/forgot-password" className="hover:underline">
              パスワードを忘れた場合
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}