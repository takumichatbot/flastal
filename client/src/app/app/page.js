'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function AppEntryPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('authToken');
      const token = raw ? raw.replace(/['"]+/g, '').trim() : null;

      if (token) {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();
        if (!isExpired) {
          router.replace('/mypage');
          return;
        }
      }
    } catch (_) {}

    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-black">F</span>
        </div>
        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
