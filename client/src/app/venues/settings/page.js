'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, CheckCircle2, Loader2, Settings } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-teal-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(16,185,129,0.05)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

export default function VenueSettingsPage() {
  const { user, isAuthenticated, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    venueName: '', address: '',
    isStandAllowed: true, isBowlAllowed: true,
    standRegulation: '', bowlRegulation: '',
    retrievalRequired: true, imageUrls: [] 
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'VENUE') return;
    
    fetch(`${API_URL}/api/venues/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setFormData({ ...data, imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [] });
        setLoading(false);
      })
      .catch(() => {
        toast.error('情報の読み込みに失敗しました');
        setLoading(false);
      });
  }, [user, isAuthenticated]);

  const addImageUrl = () => setFormData({ ...formData, imageUrls: [...formData.imageUrls, ""] });
  const updateImageUrl = (index, value) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData({ ...formData, imageUrls: newUrls });
  };
  const removeImageUrl = (index) => {
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newUrls });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/venues/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('設定を保存しました');
        router.push(`/venues/dashboard/${user.id}`);
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      toast.error('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-50/50"><Loader2 className="animate-spin text-emerald-500 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-sky-50/50 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/venues/dashboard/${user.id}`} className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-slate-400 hover:text-emerald-600">
                  <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                  <Settings size={24} className="text-emerald-500"/> レギュレーション設定
              </h1>
            </div>
            <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleSubmit} disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-full text-sm font-black shadow-lg hover:shadow-emerald-200 transition-all w-full sm:w-auto disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
              保存する
            </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <GlassCard className="space-y-6">
            <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20}/> 基本受入設定
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <label className={cn("flex items-center p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all", formData.isStandAllowed ? 'border-emerald-400 bg-emerald-50/50 shadow-sm' : 'border-slate-100 bg-white/50 hover:bg-slate-50')}>
                <input type="checkbox" checked={formData.isStandAllowed} onChange={(e) => setFormData({...formData, isStandAllowed: e.target.checked})} className="w-5 h-5 mr-3 accent-emerald-500" />
                <span className="font-black text-slate-700">スタンド花 受入許可</span>
              </label>
              <label className={cn("flex items-center p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all", formData.isBowlAllowed ? 'border-emerald-400 bg-emerald-50/50 shadow-sm' : 'border-slate-100 bg-white/50 hover:bg-slate-50')}>
                <input type="checkbox" checked={formData.isBowlAllowed} onChange={(e) => setFormData({...formData, isBowlAllowed: e.target.checked})} className="w-5 h-5 mr-3 accent-emerald-500" />
                <span className="font-black text-slate-700">楽屋花 受入許可</span>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <Settings className="text-sky-500" size={20}/> 詳細レギュレーション
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">スタンド花の規定 (サイズ・時間など)</label>
                <textarea value={formData.standRegulation} onChange={(e) => setFormData({...formData, standRegulation: e.target.value})} className="w-full p-4 bg-white/60 border-2 border-slate-100 rounded-2xl min-h-[120px] focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-50 outline-none transition-all font-bold text-slate-700 resize-none leading-relaxed" placeholder="例: 高さ180cmまで、当日10時〜12時着指定" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">楽屋花の規定</label>
                <textarea value={formData.bowlRegulation || ''} onChange={(e) => setFormData({...formData, bowlRegulation: e.target.value})} className="w-full p-4 bg-white/60 border-2 border-slate-100 rounded-2xl min-h-[100px] focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-50 outline-none transition-all font-bold text-slate-700 resize-none leading-relaxed" placeholder="例: 卓上サイズのみ受け入れ可能" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">回収ルール</label>
                <select value={formData.retrievalRequired} onChange={(e) => setFormData({...formData, retrievalRequired: e.target.value === 'true'})} className="w-full p-4 bg-white/60 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-50 outline-none transition-all appearance-none cursor-pointer font-bold text-slate-800">
                  <option value="true">回収必須 (お花屋さんが持ち帰る)</option>
                  <option value="false">会場側で処分可能</option>
                </select>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <ImageIcon className="text-purple-500" size={20}/> 会場写真 (画像URL指定)
            </h2>
            <p className="text-xs font-bold text-slate-500">会場の外観、ロビー、過去の設置例などの画像URLを入力してください。</p>
            
            <div className="space-y-4">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-1 relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input type="url" value={url} onChange={(e) => updateImageUrl(index, e.target.value)} placeholder="https://example.com/image.jpg" className="w-full pl-10 pr-4 py-4 bg-white/60 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-sm text-slate-700" />
                  </div>
                  <button type="button" onClick={() => removeImageUrl(index)} className="w-14 h-14 shrink-0 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm">
                    <Trash2 size={20}/>
                  </button>
                </div>
              ))}
            </div>
            
            <button type="button" onClick={addImageUrl} className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-black hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50/50 transition-all">
              <Plus size={18}/> 写真のURLを追加する
            </button>

            {formData.imageUrls.some(url => url) && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                {formData.imageUrls.map((url, index) => url && (
                  <div key={index} className="relative aspect-square rounded-[1.5rem] overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preview ${index}`} className="object-cover w-full h-full" onError={(e) => e.target.style.display='none'} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
             <Link href={`/venues/dashboard/${user?.id}`} className="w-full sm:w-auto text-center px-8 py-4 font-black text-slate-500 bg-white border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                変更せずに戻る
             </Link>
             <motion.button 
               whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(16,185,129,0.3)" }} whileTap={{ scale: 0.98 }}
               type="submit" disabled={isSubmitting} 
               className="w-full flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-full transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2 text-lg"
             >
                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                {isSubmitting ? '保存中...' : '設定を保存する'}
             </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}