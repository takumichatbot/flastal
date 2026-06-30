'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MyPageVenue() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === 'VENUE') {
      router.replace(`/venues/dashboard/${user.id}`);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (user?.role === 'VENUE') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center max-w-md w-full shadow-2xl">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner">
          <Building2 size={40} />
        </div>
        <h1 className="text-xl font-black text-slate-800 mb-2 text-center tracking-tighter">会場専用ページです</h1>
        <p className="text-xs font-bold text-slate-400 mb-8 text-center leading-relaxed">
          このダッシュボードは登録済みの会場向けのページです。<br/>
          会場として登録するとご利用いただけます。
        </p>
        <Link href="/venues/register" className="w-full py-4 bg-emerald-500 text-white rounded-full font-black hover:bg-emerald-600 transition-colors shadow-lg text-center block mb-3">
          会場登録はこちら
        </Link>
        <button onClick={() => router.back()} className="w-full py-4 bg-slate-100 text-slate-600 rounded-full font-black hover:bg-slate-200 transition-colors">
          戻る
        </button>
      </div>
    </div>
  );
}
