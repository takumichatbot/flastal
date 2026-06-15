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

  const inputClass = () =>
    'relative flex items-center rounded-2xl border-2 border-transparent bg-slate-50 transition-all duration-200 focus-within:border-pink-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.1)]';

  // ── 登録完了画面 ──
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans"
           style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="text-pink-500" size={44} />
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">登録ありがとうございます！</h2>
          <p className="text-slate-400 text-sm font-medium mb-8">あと少しで推し活がスタートできます ✨</p>

          <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left space-y-4">
            {[
              { n: 1, text: 'ご登録のメールアドレスに認証メールを送信しました' },
              { n: 2, text: 'メール内のボタンをクリックして認証を完了させてください' },
              { n: 3, text: '認証完了後にすぐログインできます' },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {n}
                </span>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <Link href="/login">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
            >
              ログイン画面へ <ArrowRight size={18} />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── 新規登録フォーム ──
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans overflow-hidden">

      {/* ── Hero Section ── */}
      <div className="relative flex-shrink-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 overflow-hidden"
           style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: '32vh' }}>

        <div className="absolute -top-12 -right-12 w-52 h-52 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-white/10 rounded-full" />

        {!isNativeApp && (
          <Link href="/"
                className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors p-2"
                style={{ marginTop: 'env(safe-area-inset-top)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </Link>
        )}

        <div className="flex flex-col items-center justify-center h-full px-6 pt-10 pb-10 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-xl">
              <Flower2 className="text-white" size={30} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">アカウント作成</h1>
            <p className="text-pink-100 text-sm font-bold mt-1.5 flex items-center justify-center gap-1.5">
              <Heart size={12} className="fill-pink-200 text-pink-200" />
              無料で始める推し活プラットフォーム
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-8 fill-white">
            <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z"/>
          </svg>
        </div>
      </div>

      {/* ── Form Sheet ── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 bg-white px-6 pt-5 overflow-y-auto"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <form onSubmit={handleRegister} className="flex flex-col gap-4">

          {/* ハンドルネーム */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ニックネーム <span className="text-pink-500">*</span></label>
            <div className={inputClass('name')}>
              <User className="absolute left-4 text-slate-400" size={18} />
              <input
                type="text"
                value={formData.handleName}
                onChange={(e) => setFormData({ ...formData, handleName: e.target.value })}

                required
                placeholder="フラスタ太郎"
                className="w-full pl-11 pr-4 py-4 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">メールアドレス <span className="text-pink-500">*</span></label>
            <div className={inputClass('email')}>
              <Mail className="absolute left-4 text-slate-400" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}

                required
                placeholder="example@email.com"
                className="w-full pl-11 pr-4 py-4 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">パスワード <span className="text-pink-500">*</span></label>
            <div className={inputClass('password')}>
              <Lock className="absolute left-4 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}

                required
                placeholder="8文字以上"
                className="w-full pl-11 pr-12 py-4 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-pink-500 transition-colors p-1">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* パスワード強度 */}
            <AnimatePresence>
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 px-1"
                >
                  <div className="flex gap-1 mb-1">
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
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 flex items-center gap-1">
              紹介コード
              <span className="text-slate-300 font-medium">（任意）</span>
            </label>
            <div className={inputClass('referral')}>
              <Gift className="absolute left-4 text-slate-400" size={18} />
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}

                placeholder="コードを入力"
                className="w-full pl-11 pr-4 py-4 bg-transparent rounded-2xl outline-none font-medium text-slate-800 placeholder:text-slate-300 text-[16px]"
              />
            </div>
          </div>

          {/* 登録ボタン */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-lg shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading
              ? <><Loader2 className="animate-spin" size={20} /> 登録処理中...</>
              : <><Sparkles size={18} /> アカウントを作成する</>
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
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300 font-bold">OR</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <Link href="/login">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:border-pink-200 hover:text-pink-500 transition-all"
            >
              すでにアカウントをお持ちの方
            </motion.div>
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
