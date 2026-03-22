'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { 
  ArrowLeft, Save, MapPin, CheckCircle2, X, Image as ImageIcon, Plus, Loader2, Edit3, Settings, Camera
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
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

export default function VenueEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { authenticatedFetch } = useAuth();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    venueName: '', address: '', accessInfo: '',
    isStandAllowed: true, isBowlAllowed: true, retrievalRequired: true,
    imageUrls: []
  });

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/venues/${id}`);
        if (!response.ok) throw new Error('データ取得失敗');
        const data = await response.json();
        setFormData({
          venueName: data.venueName || '',
          address: data.address || '',
          accessInfo: data.accessInfo || '',
          isStandAllowed: data.isStandAllowed ?? true,
          isBowlAllowed: data.isBowlAllowed ?? true,
          retrievalRequired: data.retrievalRequired ?? true,
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : []
        });
      } catch (error) {
        toast.error('会場情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVenueData();
  }, [id]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const toastId = toast.loading('画像をアップロード中...');

    try {
      const uploadPromises = files.map(async (file) => {
        const fileFormData = new FormData();
        fileFormData.append('image', file);

        const res = await authenticatedFetch(`${API_URL}/api/tools/upload-image`, {
          method: 'POST', body: fileFormData,
        });

        if (!res.ok) throw new Error('アップロード失敗');
        const data = await res.json();
        return data.url;
      });

      const newUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
      toast.success('画像をアップロードしました', { id: toastId });
    } catch (error) {
      toast.error('画像のアップロードに失敗しました', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/venues/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || '更新に失敗しました');
      }

      toast.success('会場情報を更新しました！');
      router.push(`/venues/dashboard/${id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
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
              <Link href={`/venues/dashboard/${id}`} className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-slate-400 hover:text-emerald-600">
                  <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                  <Edit3 size={24} className="text-emerald-500"/> 会場情報の編集
              </h1>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <GlassCard className="space-y-6">
            <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
                <MapPin className="text-emerald-500" size={20}/> 基本情報
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">会場名 <span className="text-emerald-500">*</span></label>
                <input type="text" required value={formData.venueName} onChange={(e) => setFormData({...formData, venueName: e.target.value})} className="w-full p-4 bg-white/60 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-800" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">住所 <span className="text-emerald-500">*</span></label>
                <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-4 bg-white/60 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-800" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <ImageIcon className="text-sky-500" size={20}/> 会場写真
            </h2>
            <p className="text-xs font-bold text-slate-500 mb-4">施設の入り口や、過去にフラスタが設置された様子の画像をアップロードしてください。</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm group">
                  <img src={url} alt={`Venue ${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <label className={cn("aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 bg-slate-50 hover:border-emerald-400 hover:text-emerald-500 transition-all cursor-pointer text-slate-400", uploading ? 'opacity-50 cursor-not-allowed' : '')}>
                {uploading ? <Loader2 className="animate-spin" size={24}/> : <><Camera size={24}/><span className="text-[10px] font-black uppercase tracking-widest">Add Image</span></>}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple disabled={uploading}/>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
                <Settings className="text-indigo-500" size={20}/> アクセス・受入設定
            </h2>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">搬入・受取に関する補足情報</label>
              <textarea rows="4" value={formData.accessInfo} onChange={(e) => setFormData({...formData, accessInfo: e.target.value})} placeholder="例：搬入口は建物北側です。回収は翌日午前中までにお願いします。" className="w-full p-4 bg-white/60 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 resize-none leading-relaxed"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-colors">
                <span className="text-sm font-black text-emerald-800">スタンド花の受入</span>
                <input type="checkbox" checked={formData.isStandAllowed} onChange={(e) => setFormData({...formData, isStandAllowed: e.target.checked})} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-colors">
                <span className="text-sm font-black text-emerald-800">楽屋花（籠花）の受入</span>
                <input type="checkbox" checked={formData.isBowlAllowed} onChange={(e) => setFormData({...formData, isBowlAllowed: e.target.checked})} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
              </label>
            </div>
          </GlassCard>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
             <Link href={`/venues/dashboard/${id}`} className="w-full sm:w-auto text-center px-8 py-4 font-black text-slate-500 bg-white border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                変更せずに戻る
             </Link>
             <motion.button 
               whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(16,185,129,0.3)" }} whileTap={{ scale: 0.98 }}
               type="submit" disabled={saving || uploading} 
               className="w-full flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-full transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2 text-lg"
             >
                {(saving || uploading) ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                {saving ? '保存中...' : '設定を保存する'}
             </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}