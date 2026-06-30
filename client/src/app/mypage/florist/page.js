'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Flower2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MyPageFlorist() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === 'FLORIST') {
      router.replace('/florists/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading || user?.role === 'FLORIST') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-pink-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center max-w-md w-full shadow-2xl">
        <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner">
          <Flower2 size={40} />
        </div>
        <h1 className="text-xl font-black text-slate-800 mb-2 text-center tracking-tighter">フローリスト専用ページです</h1>
        <p className="text-xs font-bold text-slate-400 mb-8 text-center leading-relaxed">
          このダッシュボードはお花屋さん向けのページです。<br/>
          フローリストとして登録するとご利用いただけます。
        </p>
        <Link href="/florists/register" className="w-full py-4 bg-pink-500 text-white rounded-full font-black hover:bg-pink-600 transition-colors shadow-lg text-center block mb-3">
          フローリスト登録はこちら
        </Link>
        <button onClick={() => router.back()} className="w-full py-4 bg-slate-100 text-slate-600 rounded-full font-black hover:bg-slate-200 transition-colors">
          戻る
        </button>
      </div>
    </div>
  );
}
