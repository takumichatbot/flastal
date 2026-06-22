'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // JWTを AuthContext の login に渡してセッションを確立
      login(token, null).then(() => {
        router.push('/mypage');
      });
    } else {
      router.push('/login?error=' + (error || 'auth_failed'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
      <Loader2 size={32} className="animate-spin text-pink-400" />
      <p className="text-slate-500 font-bold text-sm">認証中...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
          <Loader2 size={32} className="animate-spin text-pink-400" />
          <p className="text-slate-500 font-bold text-sm">読み込み中...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
