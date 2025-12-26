'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiInfo, FiGlobe, FiPhone, FiSave, FiArrowLeft, 
  FiCheckCircle, FiXCircle, FiHelpCircle, FiSearch, FiLoader, FiSend
} from 'react-icons/fi';

const BACKEND_URL = 'https://flastal-backend.onrender.com/api/venues';

export default function AddVenuePage() {
  const router = useRouter();
  // token を直接取り出さず、必要な時に localStorage から取得する安全な方法に変更
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
    
    // トークン取得の安全な処理
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
            // router.push ではなく物理的なリフレッシュを伴う移動で不整合をリセット
            window.location.href = '/venues';
        }, 1000);

    } catch (error) {
        console.error('Submit Error:', error);
        toast.error(error.message || '通信エラーが発生しました');
        setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <FiLoader className="animate-spin text-pink-500 size-10" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 pt-28">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-8 flex justify-between items-center px-2">
            <button onClick={() => router.back()} className="group flex items-center text-sm font-bold text-slate-400 hover:text-pink-500 transition-all">
                <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform"/> 戻る
            </button>
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase">Venue Submission</span>
        </div>

        <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-3 italic">
                        <FiMapPin className="text-pink-500" /> 会場情報を追加
                    </h2>
                    <p className="mt-3 text-slate-400 text-xs font-bold tracking-widest leading-relaxed">
                        あなたの知識が、誰かの「贈りたい」を支える力になります。
                    </p>
                </div>
            </div>
            
            <div className="p-8 md:p-14 space-y-12">
                <div className="bg-pink-50/50 border border-pink-100/50 p-6 rounded-[2rem] flex items-start gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-sm text-pink-500">
                        <FiInfo size={20} />
                    </div>
                    <p className="text-xs text-pink-900/70 leading-relaxed font-bold">
                        ご投稿いただいた情報は運営チームにて内容を確認（承認）した後、公式データベースへ掲載されます。
                    </p>
                </div>

                <section className="space-y-8">
                    <div className="flex items-center gap-3 text-slate-400">
                        <span className="h-px flex-1 bg-slate-100"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Basic Info / 基本情報</span>
                        <span className="h-px flex-1 bg-slate-100"></span>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 transition-colors">会場・施設名 <span className="text-pink-500 ml-1">●</span></label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={vName}
                                    onChange={(e) => setVName(e.target.value)}
                                    className="flex-1 rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-5 focus:bg-white focus:border-pink-200 outline-none transition-all font-bold text-lg placeholder:text-slate-300"
                                    placeholder="例：東京ガーデンシアター"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleGoogleSearch} 
                                    className="px-6 bg-slate-900 text-white rounded-2xl hover:bg-pink-600 transition-all shadow-lg active:scale-95"
                                >
                                    <FiSearch size={22}/>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">所在地</label>
                                <input
                                    type="text"
                                    value={vAddr}
                                    onChange={(e) => setVAddr(e.target.value)}
                                    className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-5 focus:bg-white focus:border-pink-200 outline-none transition-all font-bold"
                                    placeholder="都道府県から入力"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">公式電話番号</label>
                                <input
                                    type="text" 
                                    value={vPhone}
                                    onChange={(e) => setVPhone(e.target.value)}
                                    className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-5 focus:bg-white focus:border-pink-200 outline-none transition-all font-bold"
                                    placeholder="ハイフンなしで入力"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">公式サイト URL</label>
                            <input
                                type="text" 
                                value={vWeb}
                                onChange={(e) => setVWeb(e.target.value)}
                                className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-5 focus:bg-white focus:border-pink-200 outline-none transition-all font-bold"
                                placeholder="example.com"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="flex items-center gap-3 text-slate-400">
                        <span className="h-px flex-1 bg-slate-100"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Regulations / 規約目安</span>
                        <span className="h-px flex-1 bg-slate-100"></span>
                    </div>

                    <div className="space-y-6">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">フラスタの受入れ実績</label>
                        <div className="flex gap-4 p-2 bg-slate-50 rounded-3xl">
                            <button
                                type="button"
                                onClick={() => setIsStandAllowed(true)}
                                className={`flex-1 py-5 rounded-[1.25rem] flex items-center justify-center gap-3 font-black transition-all ${isStandAllowed ? 'bg-white text-green-600 shadow-xl scale-[1.02]' : 'text-slate-300 hover:text-slate-400'}`}
                            >
                                <FiCheckCircle size={20}/> 許可実績あり
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsStandAllowed(false)}
                                className={`flex-1 py-5 rounded-[1.25rem] flex items-center justify-center gap-3 font-black transition-all ${!isStandAllowed ? 'bg-white text-red-500 shadow-xl scale-[1.02]' : 'text-slate-300 hover:text-slate-400'}`}
                            >
                                <FiXCircle size={20}/> 全面禁止
                            </button>
                        </div>
                        
                        <div className="relative">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">詳細ルール・備考</label>
                            <textarea
                                rows="6"
                                value={vRegs}
                                onChange={(e) => setVRegs(e.target.value)}
                                className="w-full rounded-[2rem] border-2 border-slate-50 bg-slate-50 px-8 py-6 focus:bg-white focus:border-pink-200 outline-none transition-all font-bold leading-relaxed"
                                placeholder="搬入・回収の時間指定、サイズ制限などをご記入ください。"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <div className="pt-10 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="group w-full py-7 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[2rem] font-black text-xl shadow-[0_20px_40px_rgba(244,114,182,0.3)] active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <FiLoader className="animate-spin mr-3 size-6"/>
                        ) : (
                            <><FiSend className="mr-3 transition-transform"/> 会場情報を送信する</>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      <style jsx global>{`
        body { background-color: #fafafa; }
      `}</style>
    </div>
  );
}