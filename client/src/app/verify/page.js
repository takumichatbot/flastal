'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('認証情報を確認しています...');
  const [countdown, setCountdown] = useState(5);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('無効なリンクです。トークンが見つかりません。');
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyEmail = async () => {
      try {
        await new Promise(r => setTimeout(r, 700));
        const res = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'メールアドレスの認証が完了しました！');
        } else {
          setStatus('error');
          setMessage(
            res.status === 400 || res.status === 401
              ? 'リンクの有効期限が切れているか、既に使用されています。'
              : data.message || '認証に失敗しました。もう一度お試しください。'
          );
        }
      } catch {
        setStatus('error');
        setMessage('サーバー接続エラーが発生しました。時間を置いて再度お試しください。');
      }
    };

    verifyEmail();
  }, [token]);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); router.push('/login'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 to-rose-50/40 flex items-center justify-center p-4 font-sans">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-100/30 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(244,114,182,0.15)] p-8 md:p-10 text-center"
      >
        {/* アイコンエリア */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="mb-6 flex justify-center"
          >
            {status === 'loading' && (
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center border-2 border-pink-100">
                <Loader2 className="text-pink-400 animate-spin" size={36} />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-gradient-to-br from-pink-50 to-rose-50 rounded-full flex items-center justify-center border-2 border-pink-100 shadow-inner">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}>
                  <CheckCircle2 className="text-pink-500" size={40} />
                </motion.div>
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100 shadow-inner">
                <AlertCircle className="text-red-400" size={40} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* タイトル */}
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          {status === 'loading' && '認証中...'}
          {status === 'success' && '認証完了！'}
          {status === 'error' && '認証エラー'}
        </h1>
        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">{message}</p>

        {/* 成功時 */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            <div className="w-full bg-pink-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-pink-400 to-rose-400 h-full rounded-full"
                style={{ width: `${(countdown / 5) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              <span className="font-black text-slate-600">{countdown}秒後</span>に自動的にログインページへ移動します
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
            >
              今すぐログインする <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        )}

        {/* エラー時 */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black shadow-lg shadow-pink-200"
              >
                ログイン画面へ戻る
              </motion.button>
            </Link>
            <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 text-left">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                メールが届かない、または期限切れの場合は、再度新規登録または認証メールの再送をお試しください。
              </p>
            </div>
          </motion.div>
        )}

        {/* フッター */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-slate-300 font-bold">
          <Sparkles size={12} /> FLASTAL Secure Verification
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-pink-50/30">
        <Loader2 className="animate-spin text-pink-400" size={36} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
