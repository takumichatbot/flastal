'use client';

// ビルド時の静的解析を強制的にスキップ
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, Heart, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// 背景のふわふわ浮かぶパーティクル（透明感・可愛さ）
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{
            x: Math.random() * windowSize.width,
            y: Math.random() * windowSize.height,
          }}
          animate={{
            y: [null, Math.random() * -200],
            x: [null, (Math.random() - 0.5) * 100],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth(); 

  // URLパラメータの取得処理など
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const callback = params.get('callbackUrl');
    }
  }, []);

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

      login(data.token);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <FloatingParticles />
      
      {/* 背景のぼんやりした光 */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-xl max-w-md w-full p-8 md:p-10 border border-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(244,114,182,0.15)] relative z-10"
      >
        <div className="text-center mb-8 relative">
          <Link href="/" className="absolute left-0 top-0 text-slate-400 hover:text-pink-500 transition-colors p-2 -ml-2 -mt-2 rounded-full hover:bg-pink-50">
            <ArrowLeft size={20} />
          </Link>
          
          <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner rotate-3">
            <Heart className="text-pink-500 fill-pink-500" size={28} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">おかえりなさい！</h1>
          <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-pink-400"/> 推し活を再開しよう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2 tracking-widest uppercase">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400" size={18} />
              </div>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="example@email.com"
                className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-medium text-slate-700 placeholder:text-slate-300" 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black text-slate-500 tracking-widest uppercase">Password</label>
              <Link href="/forgot-password?userType=USER" className="text-[10px] font-bold text-pink-500 hover:text-pink-600 hover:underline underline-offset-2">
                忘れた方はこちら
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-slate-400" size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-medium text-slate-700 placeholder:text-slate-300" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-pink-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(244,114,182,0.4)" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isLoading}
            className={cn(
              "w-full py-4 mt-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all",
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            )}
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? 'ログイン中...' : 'ログインする'}
          </motion.button>
        </form>

        {showResend && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-center shadow-sm">
            <p className="text-xs text-orange-600 font-bold mb-2">メールアドレスの認証が完了していません</p>
            <button onClick={handleResendEmail} className="text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-full font-bold text-xs shadow-md transition-all">
              認証メールを再送する
            </button>
          </motion.div>
        )}
        
        <div className="text-center mt-8 pt-6 border-t border-slate-100/50">
          <p className="text-xs text-slate-400 font-bold mb-3">まだアカウントをお持ちでないですか？</p>
          <Link href="/register">
            <span className="inline-block px-8 py-3 bg-white text-pink-500 border-2 border-pink-100 font-black rounded-full hover:bg-pink-50 hover:border-pink-300 transition-all text-sm shadow-sm">
              新規会員登録（無料）
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-pink-50/30">
        <Loader2 className="animate-spin text-pink-500" size={40} />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

// Suspense内でuseSearchParamsを使うためのラッパー（このファイルでは使っていませんが将来の拡張用）
function LoginPageContent() {
  return <LoginForm />;
}