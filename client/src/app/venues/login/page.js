'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiMapPin, FiLoader } from 'react-icons/fi';

export default function VenueLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'}/api/venues/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }

      // ★重要: ここで role: 'VENUE' を明示的に指定してログイン状態を保存
      await login(data.token, { 
        ...data.venue, 
        role: 'VENUE' 
      });

      toast.success('会場としてログインしました');
      
      // ダッシュボードへ遷移 (IDが必要なため data.venue.id を使用)
      router.push(`/venues/dashboard/${data.venue.id}`);

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-sky-500 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-inner">
                <FiMapPin />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">会場・ホール様 ログイン</h1>
            <p className="text-sky-100 text-xs font-bold mt-2 uppercase tracking-widest">Venue Dashboard</p>
        </div>

        <div className="p-8 pt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
                <FiMail className="absolute top-4 left-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="メールアドレス"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none transition-all font-bold text-slate-700"
                    required
                />
            </div>
            
            <div className="relative group">
                <FiLock className="absolute top-4 left-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワード"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none transition-all font-bold text-slate-700"
                    required
                />
            </div>

            <div className="text-right">
                <Link href="/forgot-password" className="text-xs font-bold text-slate-400 hover:text-sky-500 transition-colors">
                    パスワードをお忘れですか？
                </Link>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-600 hover:shadow-sky-300 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {isLoading ? <FiLoader className="animate-spin" /> : <>ログイン <FiArrowRight /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-slate-400">アカウントをお持ちでない場合</p>
            <Link href="/venues/register" className="inline-block mt-2 text-sky-500 font-black hover:underline">
                新規利用登録はこちら
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}