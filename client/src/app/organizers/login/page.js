'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, Briefcase, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ふわふわ浮かぶパーティクル（インディゴ系）
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

function OrganizerLoginContent() {
  const { register, handleSubmit, formState: { isSubmitting }, getValues } = useForm();
  const { login } = useAuth();
  const router = useRouter();
  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setShowResend(false);
    try {
      const res = await fetch(`${API_URL}/api/organizers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403 && (result.message.includes('認証') || result.message.includes('Verification'))) {
            setShowResend(true);
        }
        throw new Error(result.message || 'ログインに失敗しました。');
      }

      login(result.token);
      toast.success('主催者としてログインしました');
      router.push('/organizers/dashboard');

    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (!email) return toast.error('メールアドレスを入力してください');

    const toastId = toast.loading('再送信中...');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType: 'ORGANIZER' }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || '認証メールを再送しました', { id: toastId });
        setShowResend(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-xl max-w-md w-full p-8 md:p-10 border border-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(79,70,229,0.15)] relative z-10"
      >
        <div className="text-center mb-8 relative">
          <Link href="/" className="absolute left-0 top-0 text-slate-400 hover:text-indigo-500 transition-colors p-2 -ml-2 -mt-2 rounded-full hover:bg-indigo-50">
            <ArrowLeft size={20} />
          </Link>
          
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner rotate-3 border border-white">
            <Briefcase className="text-indigo-600" size={28} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">主催者ログイン</h1>
          <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-indigo-400"/> Official Partner
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400" size={18} />
              </div>
              <input 
                type="email" {...register('email', { required: '必須です' })} 
                className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="organizer@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase">Password</label>
              <Link href="/forgot-password?userType=ORGANIZER" className="text-[10px] font-bold text-indigo-500 hover:underline">
                忘れた方はこちら
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-slate-400" size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} {...register('password', { required: '必須です' })} 
                className="w-full pl-12 pr-12 py-3.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-500 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(79,70,229,0.3)" }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting} 
            className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Briefcase size={18}/>}
            {isSubmitting ? 'ログイン中...' : 'ログインする'}
          </motion.button>
        </form>

        <AnimatePresence>
          {showResend && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 p-4 bg-pink-50 border border-pink-100 rounded-2xl text-center shadow-sm">
                  <p className="text-xs text-pink-600 font-bold mb-3">認証が完了していないようです</p>
                  <button type="button" onClick={handleResendEmail} className="inline-flex items-center justify-center px-4 py-2 bg-white border border-pink-200 text-pink-600 font-bold rounded-xl hover:bg-pink-100 transition-colors shadow-sm text-xs">
                      <Mail className="mr-2" size={14} /> 認証メールを再送する
                  </button>
              </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-8 pt-6 border-t border-slate-100/50">
            <Link href="/organizers/register">
              <span className="inline-block px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-100 font-black rounded-full hover:bg-indigo-50 transition-all text-sm shadow-sm">
                新規主催者登録（無料）
              </span>
            </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrganizerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-indigo-50/50"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>}>
      <OrganizerLoginContent />
    </Suspense>
  );
}