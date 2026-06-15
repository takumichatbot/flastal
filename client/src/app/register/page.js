'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff, Gift,
  Loader2, Sparkles, CheckCircle2, Flower2, ArrowRight, Heart
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    handleName: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setIsNativeApp(sessionStorage.getItem('nativeApp') === '1');
  }, []);

  const router = useRouter();
  const { register } = useAuth();

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthConfig = [
    { label: '', color: 'bg-slate-200' },
    { label: '弱い', color: 'bg-red-400' },
    { label: 'やや弱い', color: 'bg-orange-400' },
    { label: '普通', color: 'bg-yellow-400' },
    { label: '強い', color: 'bg-green-500' },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData.email, formData.password, formData.handleName, formData.referralCode);
      setIsSubmitted(true);
    } catch (err) {
      toast.error(err.message || '登録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const inputWrapClass = 'relative flex items-center rounded-2xl border-2 border-transparent bg-slate-50 transition-all duration-200 focus-within:border-pink-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.1)]';

  // ── 登録完了画面 ──
  if (isSubmitted) {
    return (
      <div
        className="bg-white flex flex-col items-center justify-center p-6 font-sans"
        style={{
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckCircle2 className="text-pink-500" size={38} />
          </div>

          <h2 className="text-xl font-black text-slate-800 mb-1.5">登録ありがとうございます！</h2>
          <p className="text-slate-400 text-sm font-medium mb-6">あと少しで推し活がスタートできます ✨</p>

          <div className="bg-slate-50 rounded-3xl p-5 mb-6 text-left space-y-3">
            {[
              { n: 1, text: 'ご登録のメールアドレスに認証メールを送信しました' },
              { n: 2, text: 'メール内のボタンをクリックして認証を完了させてください' },
              { n: 3, text: '認証完了後にすぐログインできます' },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {n}
                </span>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <Link href="/login">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
            >
              ログイン画面へ <ArrowRight size={16} />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── 新規登録フォーム ──
  return (
    <div
      className="flex flex-col bg-white font-sans overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* ── Hero ── */}
      <div
        className="relative flex-shrink-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 overflow-hidden flex flex-col items-center justify-center"
        style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 0, height: '26%' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/10 rounded-full" />

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

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 border border-white/30 shadow-lg">
            <Flower2 className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">アカウント作成</h1>
          <p className="text-pink-100 text-xs font-bold mt-0.5 flex items-center gap-1">
            <Heart size={10} className="fill-pink-200 text-pink-200" />
            無料で始める推し活プラットフォーム
          </p>
        </motion.div>

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
        className="flex-1 bg-white px-5 pt-4 overflow-y-auto"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <form onSubmit={handleRegister} className="flex flex-col gap-3">

          {/* ニックネーム */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 ml-1">ニックネーム <span className="text-pink-500">*</span></label>
            <div className={inputWrapClass}>
              <User className="absolute left-3.5 text-slate-400" size={16} />
              <input
                type="text"
                value={formData.handleName}
                onChange={(e) => setFormData({ ...formData, handleName: e.target.value })}
                required
                placeholder="フラスタ太郎"
                className="w-full pl-10 pr-4 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 ml-1">メールアドレス <span className="text-pink-500">*</span></label>
            <div className={inputWrapClass}>
              <Mail className="absolute left-3.5 text-slate-400" size={16} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="example@email.com"
                className="w-full pl-10 pr-4 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 ml-1">パスワード <span className="text-pink-500">*</span></label>
            <div className={inputWrapClass}>
              <Lock className="absolute left-3.5 text-slate-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="8文字以上"
                className="w-full pl-10 pr-11 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-pink-500 transition-colors p-1">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <AnimatePresence>
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 px-1"
                >
                  <div className="flex gap-1 mb-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}
                           className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                             i <= passwordStrength ? strengthConfig[passwordStrength].color : 'bg-slate-100'
                           }`} />
                    ))}
                  </div>
                  <p className={`text-[10px] font-bold ${
                    passwordStrength <= 1 ? 'text-red-400' :
                    passwordStrength === 2 ? 'text-orange-400' :
                    passwordStrength === 3 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {strengthConfig[passwordStrength]?.label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 紹介コード */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 ml-1">
              紹介コード <span className="text-slate-300 font-medium">（任意）</span>
            </label>
            <div className={inputWrapClass}>
              <Gift className="absolute left-3.5 text-slate-400" size={16} />
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                placeholder="コードを入力"
                className="w-full pl-10 pr-4 py-3.5 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
          </div>

          {/* 登録ボタン */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-lg shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading
              ? <><Loader2 className="animate-spin" size={18} /> 登録処理中...</>
              : <><Sparkles size={16} /> アカウントを作成する</>
            }
          </motion.button>

          {/* 利用規約 */}
          <p className="text-center text-[10px] text-slate-400 font-medium px-4">
            登録することで
            <Link href="/terms" className="text-pink-500 underline underline-offset-2 mx-0.5">利用規約</Link>
            および
            <Link href="/privacy" className="text-pink-500 underline underline-offset-2 mx-0.5">プライバシーポリシー</Link>
            に同意したものとみなします
          </p>

          {/* ログインへ */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300 font-bold">OR</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <Link href="/login">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:border-pink-200 hover:text-pink-500 transition-all"
            >
              すでにアカウントをお持ちの方
            </motion.div>
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
