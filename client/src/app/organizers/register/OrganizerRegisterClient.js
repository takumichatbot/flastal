'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { Eye, EyeOff, Briefcase, Mail, Lock, Globe, ArrowLeft, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

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

export default function OrganizerRegisterContent() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const res = await fetch(`${API_URL}/api/organizers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '登録に失敗しました。');
      }

      setIsSubmitted(true);
      toast.success('主催者登録の申請を完了しました');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingParticles />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/80 backdrop-blur-xl max-w-lg w-full p-8 md:p-10 border border-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(79,70,229,0.15)] relative z-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-inner border-4 border-white">
              <CheckCircle2 className="text-indigo-600 w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">申請ありがとうございます！</h2>
          <p className="text-sm font-bold text-slate-500 mb-8">公式イベント情報の掲載に向けて準備を進めます</p>
          
          <div className="bg-white/60 border border-slate-100 rounded-[1.5rem] p-6 mb-8 text-left shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-indigo-500 tracking-widest uppercase mb-4 flex items-center gap-1"><Sparkles size={14}/> 今後の流れ</p>
            <ul className="text-sm text-slate-600 space-y-4 font-medium">
              <li className="flex items-start">
                <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">1</span>
                <span className="leading-relaxed">メールアドレス宛に<strong>本人確認メール</strong>をお送りしました。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">2</span>
                <span className="leading-relaxed">メール認証後、運営にて公式アカウントとしての審査を行います。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-emerald-100 text-emerald-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">3</span>
                <span className="leading-relaxed">承認後、ログイン可能となりダッシュボードをご利用いただけます。</span>
              </li>
            </ul>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-8">※メールが届かない場合は、ログイン画面から再送が可能です。</p>
          <Link href="/organizers/login">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2">
              ログインページへ移動
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

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
          
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner -rotate-3 border border-white">
            <Briefcase className="text-indigo-600" size={28} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">主催者アカウント登録</h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-indigo-400"/> Official Partner
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase">主催者名・団体名 <span className="text-indigo-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Briefcase className="text-slate-400" size={18} />
              </div>
              <input type="text" {...register('name', { required: '必須です' })} placeholder="株式会社FLASTAL" className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" />
            </div>
            {errors.name && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase">Email <span className="text-indigo-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400" size={18} />
              </div>
              <input type="email" {...register('email', { required: '必須です' })} placeholder="contact@company.com" className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" />
            </div>
            {errors.email && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase">Password <span className="text-indigo-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-slate-400" size={18} />
              </div>
              <input type={showPassword ? 'text' : 'password'} {...register('password', { required: '必須です', minLength: { value: 8, message: '8文字以上で入力してください' } })} placeholder="••••••••" className="w-full pl-12 pr-12 py-3.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-500 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase flex items-center gap-1">公式サイトURL <span className="text-[9px] lowercase tracking-normal font-bold text-slate-400">(任意)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe className="text-slate-400" size={18} />
              </div>
              <input type="url" {...register('website')} placeholder="https://..." className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(79,70,229,0.3)" }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting} 
            className={cn("w-full py-4 mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all", isSubmitting ? 'opacity-70 cursor-not-allowed' : '')}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Briefcase size={18}/>}
            {isSubmitting ? '登録中...' : '登録を申請する'}
          </motion.button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100/50">
          <p className="text-xs text-slate-400 font-bold mb-3">すでにアカウントをお持ちですか？</p>
          <Link href="/organizers/login">
            <span className="inline-block px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-100 font-black rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-all text-sm shadow-sm">
              ログイン画面へ
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}