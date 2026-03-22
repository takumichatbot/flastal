'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Truck, Plus, ArrowLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(79,70,229,0.05)] rounded-[2.5rem] p-6 md:p-8", className)}>
    {children}
  </div>
);

export default function VenueLogisticsPage() {
  const { id } = useParams();
  const { user, authenticatedFetch, isAuthenticated, loading: authLoading } = useAuth();
  const [logistics, setLogistics] = useState([]);
  const [newInfo, setNewInfo] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLogistics = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/api/venues/${id}/logistics`);
      const data = await res.json();
      setLogistics(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/venues/${id}/logistics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInfo)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('情報を追加しました');
        setNewInfo({ title: '', description: '' });
        fetchLogistics();
      } else {
        toast.error(data.message || '追加に失敗しました。');
      }
    } catch (e) {
      toast.error('通信エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-50/50">
        <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 to-sky-50/50 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-8">
        <Link href={`/venues/dashboard/${id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-indigo-600 shadow-sm border border-white transition-all mb-8">
          <ArrowLeft size={16}/> ダッシュボードに戻る
        </Link>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
             <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 flex items-center gap-2 tracking-tighter">
               <Truck className="text-indigo-500" size={28}/> 搬入・物流設定
             </h1>
             <p className="text-sm text-slate-500 leading-relaxed font-bold">
               お花屋さん向けの情報を登録します。搬入口の詳しい場所や、駐車場所などを共有することで当日の混乱を防げます🌸
             </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* 入力フォーム */}
            {isAuthenticated && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard>
                  <h3 className="font-black text-slate-800 mb-6 text-lg">新しい情報の追加</h3>
                  <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">タイトル</label>
                        <input 
                            type="text" 
                            placeholder="例: 裏口搬入口の場所" 
                            value={newInfo.title} 
                            onChange={e => setNewInfo({...newInfo, title: e.target.value})} 
                            className="w-full p-4 bg-white/50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">詳細な説明</label>
                        <textarea 
                            placeholder="詳細な説明..." 
                            value={newInfo.description} 
                            onChange={e => setNewInfo({...newInfo, description: e.target.value})} 
                            className="w-full p-4 bg-white/50 border-2 border-slate-100 rounded-2xl min-h-[120px] focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none font-bold text-slate-700 leading-relaxed" 
                            required 
                        />
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        type="submit" disabled={isSubmitting}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 mt-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>}
                        {isSubmitting ? '送信中...' : '情報を公開する'}
                    </motion.button>
                  </form>
                </GlassCard>
              </motion.div>
            )}

            {/* 共有された情報一覧 */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 px-2 flex items-center gap-2 text-lg">
                <Truck className="text-indigo-500" size={20}/> 現在の搬入情報 <span className="text-sm font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">{logistics.length}件</span>
              </h3>
              
              <AnimatePresence>
                {logistics.length > 0 ? logistics.map((info, i) => (
                  <motion.div key={info.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <GlassCard className="!p-6 md:!p-8 transition-all hover:shadow-[0_10px_30px_rgba(79,70,229,0.1)]">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <h4 className="font-black text-slate-800 text-lg leading-snug">{info.title}</h4>
                          {info.contributor && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-black uppercase tracking-widest shrink-0 border border-slate-200 flex items-center gap-1">
                              <User size={10}/> {info.contributor.shopName || 'Florist'}
                            </span>
                          )}
                        </div>
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">{info.description}</p>
                        </div>
                      </GlassCard>
                  </motion.div>
                )) : (
                  <GlassCard className="text-center py-16 text-slate-400 font-bold border-2 border-dashed border-white">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                          <Truck size={28}/>
                      </div>
                      <p>まだ登録された情報はありません</p>
                  </GlassCard>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}