'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight, Flower2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    setIsNativeApp(sessionStorage.getItem('nativeApp') === '1');
  }, []);

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
      login(data.token, data.user);
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
    <div
      className="flex flex-col bg-white font-sans overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* ── Hero ── */}
      <div
        className="relative flex-shrink-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 overflow-hidden flex flex-col items-center justify-center"
        style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 0, height: '30%' }}
      >
        {/* 装飾サークル */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/10 rounded-full" />

        {/* 戻るボタン（Web のみ） */}
        {!isNativeApp && (
          <Link
            href="/"
            className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors p-2"
            style={{ marginTop: 'env(safe-area-inset-top)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </Link>
        )}

        {/* ロゴ */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 border border-white/30 shadow-lg">
            <Flower2 className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">FLASTAL</h1>
          <p className="text-pink-100 text-xs font-bold mt-0.5 tracking-wider">推しへの想いを、花束に</p>
        </motion.div>

        {/* 波形 */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 32" preserveAspectRatio="none" className="w-full h-6 fill-white">
            <path d="M0,32 C360,0 1080,0 1440,32 L1440,32 L0,32 Z"/>
          </svg>
        </div>
      </div>

      {/* ── Form ── */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 bg-white px-5 pt-5 flex flex-col overflow-y-auto"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-800">おかえりなさい</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">ログインして推し活を続けよう</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 ml-1">メールアドレス</label>
            <div className="relative flex items-center rounded-2xl border-2 border-transparent bg-slate-50 transition-all duration-200 focus-within:border-pink-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.1)]">
              <Mail className="absolute left-3.5 text-slate-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full pl-10 pr-4 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-[11px] font-bold text-slate-500">パスワード</label>
              <Link href="/forgot-password?userType=USER" className="text-[11px] font-bold text-pink-500 hover:text-pink-600">
                忘れた方はこちら
              </Link>
            </div>
            <div className="relative flex items-center rounded-2xl border-2 border-transparent bg-slate-50 transition-all duration-200 focus-within:border-pink-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.1)]">
              <Lock className="absolute left-3.5 text-slate-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-pink-500 transition-colors p-1">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 認証メール再送 */}
          <AnimatePresence>
            {showResend && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-orange-50 border border-orange-200 rounded-2xl p-3 text-center"
              >
                <p className="text-xs text-orange-600 font-bold mb-2">メールアドレスの認証が完了していません</p>
                <button onClick={handleResendEmail}
                        className="text-white bg-orange-500 hover:bg-orange-600 px-5 py-1.5 rounded-full font-bold text-xs shadow-md transition-all">
                  認証メールを再送する
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ログインボタン */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-lg shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading
              ? <><Loader2 className="animate-spin" size={18} /> ログイン中...</>
              : <><span>ログインする</span><ArrowRight size={16} /></>
            }
          </motion.button>

          {/* 区切り */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300 font-bold">OR</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* 新規登録へ */}
          <Link href="/register">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:border-pink-200 hover:text-pink-500 transition-all active:bg-slate-50"
            >
              <Sparkles size={14} className="text-pink-400" />
              新規会員登録（無料）
            </motion.div>
          </Link>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-pink-500" size={36} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
