'use client'; 

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent';
import { FiLoader } from 'react-icons/fi';

function HomeLoading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
      <FiLoader className="w-10 h-10 text-indigo-500 animate-spin" />
      <p className="mt-4 text-sm text-slate-400 font-medium">FLASTAL Loading...</p>
    </div>
  );
}

// ロジックを隔離
function HomeInner() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'USER' || user.role === 'ORGANIZER') router.push('/mypage');
    }
  }, [user, loading, router]);

  if (loading || user) return <HomeLoading />;
  
  // HomePageContent 自体が useSearchParams を使っているため、ここが肝心
  return <HomePageContent />;
}

export default function Page() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeInner />
    </Suspense>
  );
}