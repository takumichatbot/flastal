'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totpRequired, setTotpRequired] = useState(false);
  const [totpToken, setTotpToken] = useState('');
  const [errors, setErrors] = useState({});

  const isNativeApp = Capacitor.isNativePlatform();

  const router = useRouter();
  const { login } = useAuth();

  const validate = () => {
    const errs = {};
    if (!email || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
      errs.email = '有効なメールアドレスを入力してください。';
    }
    if (!password || password.length < 8) {
      errs.password = 'パスワードは8文字以上で入力してください。';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowResend(false);

    if (!totpRequired) {
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      setErrors({});
    }

    setIsLoading(true);
    try {
      const body = totpRequired
        ? { email, password, totpToken }
        : { email, password };
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.requireTotp) {
        setTotpRequired(true);
        setTotpToken('');
        return;
      }
      if (!res.ok) {
        if (res.status === 403 && (data.message.includes('認証') || data.message.includes('Verification'))) {
          setShowResend(true);
        }
        throw new Error(data.message || 'メールアドレスまたはパスワードが違います。');
      }
      login(data.token, data.user, data.refreshToken);
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
          <div className="w-14 h-14 mb-2">
            <img src="/icon-512x512.png" alt="FLASTAL" width={56} height={56} style={{ borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }} />
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
            <label htmlFor="login-email" className="block text-[11px] font-bold text-slate-500 mb-1 ml-1">メールアドレス</label>
            <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.1)] ${errors.email ? 'border-red-300 bg-red-50 focus-within:border-red-400' : 'border-transparent bg-slate-50 focus-within:border-pink-400 focus-within:bg-white'}`}>
              <Mail className="absolute left-3.5 text-slate-400" size={16} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                required
                autoComplete="email"
                placeholder="example@email.com"
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                aria-invalid={!!errors.email}
                className="w-full pl-10 pr-4 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="text-xs text-red-500 mt-1.5 ml-1 font-medium" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label htmlFor="login-password" className="text-[11px] font-bold text-slate-500">パスワード</label>
              <Link href="/forgot-password?userType=USER" className="text-[11px] font-bold text-pink-500 hover:text-pink-600">
                忘れた方はこちら
              </Link>
            </div>
            <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.1)] ${errors.password ? 'border-red-300 bg-red-50 focus-within:border-red-400' : 'border-transparent bg-slate-50 focus-within:border-pink-400 focus-within:bg-white'}`}>
              <Lock className="absolute left-3.5 text-slate-400" size={16} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                required
                minLength={8}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                aria-invalid={!!errors.password}
                className="w-full pl-10 pr-11 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-pink-500 transition-colors p-1">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="text-xs text-red-500 mt-1.5 ml-1 font-medium" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* 2FA TOTP 入力（必要な場合のみ表示） */}
          <AnimatePresence>
            {totpRequired && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-violet-50 border border-violet-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} className="text-violet-500" />
                  <p className="text-xs font-black text-violet-700">2段階認証コードを入力</p>
                </div>
                <p className="text-[11px] text-violet-500 mb-3">認証アプリに表示された6桁のコードを入力してください</p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-white border-2 border-violet-200 rounded-xl outline-none font-black text-center text-2xl tracking-[0.5em] text-violet-700 focus:border-violet-400"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

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
              ? <><Loader2 className="animate-spin" size={18} /> {totpRequired ? '確認中...' : 'ログイン中...'}</>
              : totpRequired
                ? <><ShieldCheck size={16} /><span>認証コードを確認</span></>
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

          {/* Googleでログイン */}
          <a
            href={`${API_URL}/api/auth/google`}
            className="w-full py-3.5 border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-base flex items-center justify-center gap-3 hover:border-blue-200 hover:text-blue-600 transition-all active:bg-slate-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </a>
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
