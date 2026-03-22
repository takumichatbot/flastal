'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { 
  Eye, EyeOff, Home, Tag, User, Mail, Lock, ArrowLeft, 
  CheckCircle2, Sparkles, Store, ShieldCheck, Loader2 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ふわふわ浮かぶパーティクル
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

export default function FloristRegisterPage() {
  const [formData, setFormData] = useState({
    shopName: '',
    platformName: '',
    contactName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const promise = fetch(`${API_URL}/api/florists/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '登録申請に失敗しました。');
      return data; 
    });

    toast.promise(promise, {
      loading: '申請を送信中...',
      success: () => {
        setIsSubmitted(true); 
        return '申請メールを送信しました。'; 
      },
      error: (err) => err.message,
    });
    
    promise.finally(() => setIsLoading(false));
  };

  // ★送信完了後の表示 (ガラスモーフィズム化)
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingParticles />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-xl max-w-lg w-full p-8 md:p-10 border border-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(244,114,182,0.15)] relative z-10 text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center shadow-inner border-4 border-white">
              <CheckCircle2 className="text-pink-500 w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">申請ありがとうございます！</h2>
          <p className="text-sm font-bold text-slate-500 mb-8">お花屋さんパートナー登録の第一歩です🌸</p>
          
          <div className="bg-white/60 border border-slate-100 rounded-[1.5rem] p-6 mb-8 text-left shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-pink-500 tracking-widest uppercase mb-4 flex items-center gap-1"><Sparkles size={14}/> 今後の流れ</p>
            <ul className="text-sm text-slate-600 space-y-4 font-medium relative z-10">
              <li className="flex items-start">
                <span className="bg-sky-100 text-sky-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">1</span>
                <span className="leading-relaxed">ご入力いただいたメールアドレス宛に、<strong>本人確認メール</strong>を送信しました。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">2</span>
                <span className="leading-relaxed">メール内のボタンをクリックして、メールアドレスの認証を完了させてください。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-emerald-100 text-emerald-600 rounded-full w-6 h-6 flex items-center justify-center font-black text-[10px] mt-0.5 mr-3 shrink-0 shadow-sm border border-white">3</span>
                <span className="leading-relaxed">認証完了後、運営事務局にて審査を行い、承認されるとログイン可能になります。</span>
              </li>
            </ul>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-8">
            ※メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
          <Link href="/">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2">
              トップページへ戻る
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-4 relative overflow-hidden font-sans pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-xl max-w-lg w-full p-8 md:p-10 border border-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(244,114,182,0.15)] relative z-10 mt-8"
      >
        <div className="text-center mb-8 relative">
          <Link href="/" className="absolute left-0 top-0 text-slate-400 hover:text-pink-500 transition-colors p-2 -ml-2 -mt-2 rounded-full hover:bg-pink-50">
            <ArrowLeft size={20} />
          </Link>
          
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner -rotate-3">
            <Store className="text-pink-500" size={28} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">パートナー登録申請</h2>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-pink-400"/> ファンに素敵なお花を届けよう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 店舗情報セクション */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5"><ShieldCheck size={14}/> 店舗情報</h3>
            
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5 tracking-widest">店舗名（正式名称） <span className="text-pink-500">*</span></label>
              <div className="relative">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" required name="shopName" value={formData.shopName} onChange={handleChange} 
                  placeholder="株式会社フラワーショップ"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400">運営確認用です。一般には公開されません。</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5 tracking-widest">活動名（公開名） <span className="text-pink-500">*</span></label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" required name="platformName" value={formData.platformName} onChange={handleChange} 
                  placeholder="FLASTAL 花子"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400">サイト上で表示される名前です。屋号やペンネームも可能。</p>
            </div>
          </div>

          {/* 連絡先セクション */}
          <div className="space-y-5 pt-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5"><Lock size={14}/> 担当者・ログイン情報</h3>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5 tracking-widest uppercase">担当者名 <span className="text-pink-500">*</span></label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" required name="contactName" value={formData.contactName} onChange={handleChange} 
                  placeholder="山田 太郎"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5 tracking-widest uppercase">Email <span className="text-pink-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" required name="email" value={formData.email} onChange={handleChange} 
                  placeholder="contact@flower-shop.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5 tracking-widest uppercase">Password <span className="text-pink-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} required name="password" value={formData.password} onChange={handleChange} 
                  placeholder="8文字以上の英数字"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-pink-500 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(244,114,182,0.4)" }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={isLoading}
              className={cn("w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all", isLoading ? 'opacity-70 cursor-not-allowed' : '')}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
              {isLoading ? '送信中...' : '登録を申請する'}
            </motion.button>
            <p className="mt-6 text-center text-[10px] font-bold text-slate-400 leading-relaxed">
              登録申請後、運営による審査が行われます。<br/>審査完了まで数日かかる場合があります。
            </p>
          </div>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100/50">
          <p className="text-xs text-slate-400 font-bold mb-3">すでにアカウントをお持ちですか？</p>
          <Link href="/florists/login">
            <span className="inline-block px-8 py-3 bg-white text-pink-500 border-2 border-pink-100 font-black rounded-full hover:bg-pink-50 hover:border-pink-300 transition-all text-sm shadow-sm">
              ログイン画面へ
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}