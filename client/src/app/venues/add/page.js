'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { 
  MapPin, Info, Globe, Phone, Send, ArrowLeft, 
  CheckCircle2, XCircle, Search, Loader2, Building2
} from 'lucide-react';

const BACKEND_URL = 'https://flastal-backend.onrender.com/api/venues';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-pink-300 rounded-full mix-blend-multiply filter blur-[2px] opacity-20"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.1, 0.4, 0.1], scale: [1, 2, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

export default function AddVenuePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  const [vName, setVName] = useState('');
  const [vAddr, setVAddr] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vWeb, setVWeb] = useState('');
  const [vRegs, setVRegs] = useState('');
  const [isStandAllowed, setIsStandAllowed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
        toast.error('ログインが必要です');
        router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleGoogleSearch = () => {
    if (!vName) return toast.error('会場名を入力してください');
    const query = encodeURIComponent(`${vName} 公式サイト フラスタ 規約`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    if (!vName.trim()) return toast.error('会場名を入力してください');

    setIsSubmitting(true);
    
    let activeToken = '';
    if (typeof window !== 'undefined') {
        const rawToken = localStorage.getItem('authToken');
        activeToken = rawToken ? rawToken.replace(/"/g, '') : '';
    }

    let finalWebsite = (vWeb || '').trim();
    if (finalWebsite && !finalWebsite.toLowerCase().startsWith('http')) {
        finalWebsite = `https://${finalWebsite}`;
    }

    const payload = {
        venueName: vName.trim(),
        address: vAddr.trim(),
        phoneNumber: vPhone.trim(),
        website: finalWebsite,
        isStandAllowed: isStandAllowed,
        regulations: vRegs.trim(),
        submittedBy: user?.id 
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 401) {
            toast.error('セッションが切れました。再度ログインしてください。');
            if (logout) logout();
            router.push('/login');
            return;
        }

        if (!response.ok) {
            throw new Error(`エラー (${response.status})`);
        }

        toast.success('会場情報を送信しました！運営の承認をお待ちください🎉', {
            duration: 6000,
            icon: '📩'
        });
        
        setTimeout(() => {
            window.location.href = '/venues';
        }, 1000);

    } catch (error) {
        toast.error(error.message || '通信エラーが発生しました');
        setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-pink-50/50">
            <Loader2 className="animate-spin text-pink-500 size-10" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 to-sky-50/50 font-sans text-slate-800 relative overflow-hidden pb-24 pt-12 md:pt-20">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="mb-6 flex justify-between items-center px-2">
            <button onClick={() => router.back()} className="group flex items-center text-sm font-black text-slate-400 hover:text-pink-500 transition-all bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm border border-white">
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform"/> 戻る
            </button>
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Venue Submission</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_8px_30px_rgba(244,114,182,0.1)] overflow-hidden border border-white">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-3">
                        <MapPin className="text-pink-400" size={36} /> 会場情報を追加
                    </h2>
                    <p className="mt-4 text-slate-300 text-xs font-bold tracking-widest leading-relaxed">
                        あなたの知識が、誰かの「贈りたい」を支える力になります✨
                    </p>
                </div>
            </div>
            
            <div className="p-6 md:p-10 space-y-10">
                <div className="bg-pink-50/80 border border-pink-100 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm text-pink-500 shrink-0">
                        <Info size={20} />
                    </div>
                    <p className="text-xs text-pink-900/80 leading-relaxed font-bold">
                        ご投稿いただいた情報は運営チームにて内容を確認（承認）した後、公式データベースへ掲載されます。
                    </p>
                </div>

                <section className="space-y-6">
                    <div className="flex items-center gap-3 text-slate-300">
                        <span className="h-px flex-1 bg-slate-200"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Basic Info</span>
                        <span className="h-px flex-1 bg-slate-200"></span>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-2">会場・施設名 <span className="text-pink-500">*</span></label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input type="text" value={vName} onChange={(e) => setVName(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-white/50 pl-12 pr-6 py-4 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all font-black text-lg text-slate-800 placeholder:text-slate-300" placeholder="例：東京ガーデンシアター" />
                                </div>
                                <button type="button" onClick={handleGoogleSearch} className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                                    <Search size={18}/> 検索して調べる
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-2">所在地</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input type="text" value={vAddr} onChange={(e) => setVAddr(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-white/50 pl-12 pr-6 py-4 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all font-bold text-slate-800" placeholder="都道府県から入力" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-2">公式電話番号</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input type="tel" value={vPhone} onChange={(e) => setVPhone(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-white/50 pl-12 pr-6 py-4 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all font-bold font-mono text-slate-800" placeholder="ハイフンなしで入力" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-2">公式サイト URL</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input type="url" value={vWeb} onChange={(e) => setVWeb(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-white/50 pl-12 pr-6 py-4 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all font-bold text-slate-800" placeholder="https://example.com" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3 text-slate-300">
                        <span className="h-px flex-1 bg-slate-200"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Regulations</span>
                        <span className="h-px flex-1 bg-slate-200"></span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block pl-2">フラスタの受入れ実績</label>
                            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-slate-50/80 rounded-[2rem] border border-slate-100">
                                <button type="button" onClick={() => setIsStandAllowed(true)}
                                    className={cn("flex-1 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black transition-all", isStandAllowed ? 'bg-white text-emerald-600 shadow-md border border-emerald-100 scale-100' : 'text-slate-400 hover:bg-slate-100 scale-95')}
                                >
                                    <CheckCircle2 size={20}/> 許可実績あり
                                </button>
                                <button type="button" onClick={() => setIsStandAllowed(false)}
                                    className={cn("flex-1 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black transition-all", !isStandAllowed ? 'bg-white text-rose-500 shadow-md border border-rose-100 scale-100' : 'text-slate-400 hover:bg-slate-100 scale-95')}
                                >
                                    <XCircle size={20}/> 全面禁止
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-2">詳細ルール・備考</label>
                            <textarea rows="5" value={vRegs} onChange={(e) => setVRegs(e.target.value)} className="w-full rounded-[2rem] border-2 border-slate-100 bg-white/50 px-6 py-5 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all font-bold text-slate-700 leading-relaxed resize-none" placeholder="搬入・回収の時間指定、サイズ制限などをご記入ください。"></textarea>
                        </div>
                    </div>
                </section>

                <div className="pt-8 border-t border-slate-100">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleFinalSubmit} disabled={isSubmitting}
                        className="group w-full py-5 md:py-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-black text-lg md:text-xl shadow-[0_10px_30px_rgba(244,114,182,0.3)] transition-all flex justify-center items-center disabled:opacity-50 gap-3"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin size-6"/> : <Send size={20}/>}
                        {isSubmitting ? '送信中...' : '会場情報を送信する'}
                    </motion.button>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}