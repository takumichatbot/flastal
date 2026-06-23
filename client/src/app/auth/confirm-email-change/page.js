'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ConfirmEmailChangePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('トークンが指定されていません。');
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/confirm-email-change?token=${token}`);
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'メールアドレスを変更しました。');
        } else {
          setStatus('error');
          setMessage(data.message || 'メールアドレスの変更に失敗しました。');
        }
      } catch {
        setStatus('error');
        setMessage('通信エラーが発生しました。しばらく時間をおいて再度お試しください。');
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 max-w-md w-full text-center">
        {/* ロゴ */}
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6">FLASTAL</p>

        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-pink-400 mx-auto mb-4" size={48} />
            <p className="font-black text-slate-700 text-lg">確認中...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
            <h1 className="text-xl font-black text-slate-800 mb-3">変更完了</h1>
            <p className="text-sm text-slate-500 font-medium mb-8">{message}</p>
            <p className="text-xs text-slate-400 mb-6">
              次回から新しいメールアドレスでログインしてください。
            </p>
            <Link
              href="/mypage"
              className="inline-block w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-colors text-sm"
            >
              マイページへ
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h1 className="text-xl font-black text-slate-800 mb-3">変更できませんでした</h1>
            <p className="text-sm text-slate-500 font-medium mb-8">{message}</p>
            <Link
              href="/mypage/edit"
              className="inline-block w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-colors text-sm"
            >
              設定ページへ戻る
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
