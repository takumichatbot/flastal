'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { 
  User, Mail, Lock, Eye, EyeOff, Gift, 
  ArrowLeft, Loader2, Sparkles, CheckCircle2, Heart 
} from 'lucide-react';

// ★ ここにcn関数を定義（ビルドエラー解消）
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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    handleName: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(formData.email, formData.password, formData.handleName, formData.referralCode);
      setIsSubmitted(true);
      toast.success('アカウントを作成しました！');
    } catch (err) {
      toast.error(err.message || '登録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------
  // 🌸 登録完了（メール認証待ち）画面
  // ------------------------------------------
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingParticles />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-xl max-w-lg w-full p-8 md:p-10 border border-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(244,114,182,0.15)] relative z-10 text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-sky-100 rounded-full flex items-center justify-center shadow-inner border-4 border-white">
              <CheckCircle2 className="text-pink-500 w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">登録ありがとうございます！</h2>
          <p className="text-sm font-bold text-slate-500 mb-8">あと少しで推し活がスタートできます✨</p>
          
          <div className="bg-white/60 border border-slate-100 rounded-[1.5rem] p-6 mb-8 text-left shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-sky-100/50 rounded-full blur-[20px] -mr-4 -mt-4 pointer-events-none"/>
            <p className="text-xs font-black text-pink-500 tracking-widest uppercase mb-4 flex items-center gap-1"><Sparkles size={14}/> Next Steps</p>
            <ul className="text-sm text-slate-600 space-y-4 font-medium">
              <li className="flex items-start">
                <span className="bg-sky-100 text-sky-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">1</span>
                <span className="leading-relaxed">本人確認メールを送信しました。メール内のボタンをクリックして認証を完了させてください。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">2</span>
                <span className="leading-relaxed">認証完了後、すぐにログインしてサービスをご利用いただけます。</span>
              </li>
            </ul>
          </div>
          
          <Link href="/login" className="block w-full">
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2"
            >
              ログインページへ移動する
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ------------------------------------------
  // 🌸 新規登録フォーム画面
  // ------------------------------------------
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
          
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner -rotate-3">
            <Heart className="text-pink-500 fill-pink-500" size={28} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">新規登録</h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-pink-400"/> 推しへの想いを形にしよう
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          
          {/* ハンドルネーム */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase">Name <span className="text-pink-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="text-slate-400" size={18} />
              </div>
              <input 
                type="text" 
                value={formData.handleName} 
                onChange={(e) => setFormData({...formData, handleName: e.target.value})} 
                required 
                placeholder="フラスタ太郎" 
                className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" 
              />
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase">Email <span className="text-pink-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400" size={18} />
              </div>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
                placeholder="example@email.com" 
                className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" 
              />
            </div>
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase">Password <span className="text-pink-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-slate-400" size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
                placeholder="8文字以上の英数字"
                className="w-full pl-12 pr-12 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" 
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

          {/* 紹介コード */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 tracking-widest uppercase flex items-center gap-1">
              Referral Code <span className="text-slate-300 text-[9px] font-bold lowercase tracking-normal">(お持ちの方のみ)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Gift className="text-slate-400" size={18} />
              </div>
              <input 
                type="text" 
                value={formData.referralCode} 
                onChange={(e) => setFormData({...formData, referralCode: e.target.value})} 
                placeholder="コードを入力" 
                className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all font-bold text-slate-700 placeholder:text-slate-300" 
              />
            </div>
          </div>

          <div className="pt-2">
             <motion.button 
               whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(244,114,182,0.4)" }}
               whileTap={{ scale: 0.98 }}
               type="submit" 
               disabled={isLoading}
               className={cn(
                 "w-full py-4 mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all",
                 isLoading ? 'opacity-70 cursor-not-allowed' : ''
               )}
             >
               {isLoading && <Loader2 className="animate-spin" size={18} />}
               {isLoading ? '登録処理中...' : 'アカウントを作成'}
             </motion.button>
          </div>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100/50">
          <p className="text-xs text-slate-400 font-bold mb-3">すでにアカウントをお持ちですか？</p>
          <Link href="/login">
            <span className="inline-block px-8 py-3 bg-white text-sky-500 border-2 border-sky-100 font-black rounded-full hover:bg-sky-50 hover:border-sky-300 transition-all text-sm shadow-sm">
              ログイン画面へ
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}