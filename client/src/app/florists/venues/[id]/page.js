'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
  MapPin, Info, Plus, ThumbsUp, ArrowLeft, Camera, 
  Truck, CheckCircle2, ExternalLink, User, X, Loader2, Send
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const JpText = ({ children, className }) => <span className={cn("inline-block", className)}>{children}</span>;

// ふわふわ浮かぶパーティクル（清潔感のあるスカイ〜インディゴ）
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-sky-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(56,189,248,0.05)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

// 簡易的な画像拡大モーダル
const SimpleImageModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="relative max-w-4xl max-h-screen w-full h-full flex items-center justify-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20 backdrop-blur-md">
          <X size={24} />
        </button>
        <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={src} alt="Enlarged" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
      </div>
    </div>
  );
};

export default function VenueLogisticsPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [venue, setVenue] = useState(null);
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalImage, setModalImage] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', imageUrls: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const token = getAuthToken();
    try {
      const [venueRes, logisticsRes] = await Promise.all([
        fetch(`${API_URL}/api/venues/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/venues/${id}/logistics`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (venueRes.ok) setVenue(await venueRes.json());
      if (logisticsRes.ok) setLogistics(await logisticsRes.json());
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'FLORIST') {
      router.push('/florists/login');
      return;
    }
    fetchData();
  }, [id, user, authLoading, router, fetchData]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (formData.imageUrls.length + files.length > 4) {
      return toast.error('画像は一度に4枚まで投稿できます');
    }

    setIsUploading(true);
    const token = getAuthToken();
    
    try {
      const uploadPromises = files.map(async (file) => {
          const fileData = new FormData();
          fileData.append('image', file);
          const res = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fileData
          });
          if (!res.ok) throw new Error('Upload failed');
          return await res.json();
      });

      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.url);
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      toast.success(`${files.length}枚の画像を追加しました`);
    } catch (e) {
      toast.error('画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return toast.error('タイトルと詳細を入力してください');
    
    setIsSubmitting(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/venues/${id}/logistics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('投稿失敗');
      
      toast.success('情報を共有しました！ご協力ありがとうございます🌸');
      setShowForm(false);
      setFormData({ title: '', description: '', imageUrls: [] });
      fetchData(); 
    } catch (e) {
      toast.error('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (infoId) => {
    const token = getAuthToken();
    setLogistics(prev => prev.map(item => 
      item.id === infoId ? { ...item, helpfulCount: (item.helpfulCount || 0) + 1 } : item
    ));

    try {
        await fetch(`${API_URL}/api/logistics/${infoId}/helpful`, {
            method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('「役に立った」を送りました');
    } catch (e) {
        console.error(e);
    }
  };

  const removeImage = (index) => {
      setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  if (loading || authLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
            <Loader2 className="animate-spin text-sky-500" size={40} />
        </div>
      );
  }

  if (!venue) return <div className="p-20 text-center text-slate-400 font-bold text-lg bg-slate-50 min-h-screen">会場が見つかりません</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 to-sky-50/50 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none z-0" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 pt-8">
        
        {/* ナビゲーション */}
        <div className="mb-6 flex items-center justify-between">
            <Link href="/florists/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-indigo-600 hover:bg-white shadow-sm border border-white transition-all">
                <ArrowLeft size={16}/> ダッシュボードへ戻る
            </Link>
        </div>

        {/* ヘッダーカード */}
        <GlassCard className="!p-0 overflow-hidden mb-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-sky-500 opacity-90 z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 z-0"></div>
            
            <div className="relative z-10 p-8 md:p-12 text-white">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                             <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-widest border border-white/30 shadow-sm">
                                <Truck size={14}/> 搬入情報Wiki
                             </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tighter drop-shadow-md">{venue.venueName}</h1>
                        <p className="flex items-center text-sky-100 text-sm font-bold">
                            <MapPin className="mr-2 shrink-0"/> {venue.address}
                        </p>
                    </div>
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.venueName + ' ' + venue.address)}`} 
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white text-indigo-600 px-6 py-3.5 rounded-full font-black text-sm shadow-xl hover:scale-105 transition-all whitespace-nowrap"
                    >
                        <ExternalLink size={16}/> 地図アプリで開く
                    </a>
                </div>
            </div>

            {venue.accessInfo && (
                <div className="relative z-10 p-6 md:p-8 bg-white border-t border-slate-100">
                    <h3 className="text-xs font-black text-amber-500 flex items-center gap-1.5 mb-3 uppercase tracking-widest">
                        <Info size={16}/> 会場からの公式アクセス情報
                    </h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                        {venue.accessInfo}
                    </p>
                </div>
            )}
        </GlassCard>

        {/* 投稿フォームエリア */}
        <div className="mb-12">
            {!showForm ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(true)} 
                    className="w-full py-6 md:py-8 bg-white/60 backdrop-blur-md border-2 border-dashed border-indigo-200 rounded-[2.5rem] text-indigo-600 font-black hover:bg-white hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3"
                >
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 shadow-inner">
                        <Plus size={28} />
                    </div>
                    <span className="text-lg">新しい搬入情報を共有する</span>
                    <span className="text-xs text-indigo-400 font-bold">駐車場、搬入口、注意点などをみんなにシェア🌸</span>
                </motion.button>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-indigo-100 relative">
                    <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors"><X size={18}/></button>
                    
                    <h3 className="font-black text-xl mb-2 text-slate-800">情報を共有する</h3>
                    <p className="text-xs font-bold text-slate-500 mb-8">あなたの情報が、他の花屋さんの助けになります✨</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">タイトル <span className="text-pink-500">*</span></label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="例: 搬入口の段差について / 控え室へのルート" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">詳細情報 <span className="text-pink-500">*</span></label>
                            <textarea required rows="5" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="例: 裏口のシャッターは10時に開きます。台車はスロープあり。担当者の〇〇さんに声をかけるとスムーズです。" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none font-bold text-slate-700 leading-relaxed" />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">写真 <span className="lowercase font-bold">(任意・最大4枚)</span></label>
                            <div className="flex flex-wrap gap-4">
                                {formData.imageUrls.map((url, i) => (
                                    <div key={i} className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                                        <Image src={url} alt="Uploaded" fill className="object-cover"/>
                                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                                            <X size={14}/>
                                        </button>
                                    </div>
                                ))}
                                
                                {formData.imageUrls.length < 4 && (
                                    <label className={cn("w-24 h-24 border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all shadow-inner text-slate-400", isUploading ? 'opacity-50 cursor-not-allowed' : '')}>
                                        {isUploading ? <Loader2 className="animate-spin" size={24} /> : <><Camera size={24} className="mb-1"/><span className="text-[10px] font-black uppercase tracking-widest">Add</span></>}
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading}/>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100/50">
                            <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-full hover:bg-slate-200 transition-colors">キャンセル</button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting || isUploading} className="w-full flex-1 py-4 bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-black rounded-full shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? <><Loader2 className="animate-spin" size={18}/> 送信中...</> : <><Send size={18}/> 情報を投稿する</>}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            )}
        </div>

        {/* タイムライン */}
        <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 mb-6">
                <h2 className="font-black text-slate-800 text-xl flex items-center gap-2">
                    <Truck className="text-indigo-500" size={24}/> 共有された情報 <span className="text-slate-400 text-sm font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{logistics.length}件</span>
                </h2>
            </div>
            
            {logistics.length === 0 ? (
                <GlassCard className="text-center py-24 text-slate-400 font-bold border-2 border-dashed border-white">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 text-slate-300">
                        <Truck size={36}/>
                    </div>
                    <p className="text-lg text-slate-600 mb-1">まだ情報がありません</p>
                    <p className="text-sm">最初の投稿者になって、みんなを助けましょう！</p>
                </GlassCard>
            ) : (
                <div className="grid gap-6 md:gap-8">
                    {logistics.map(info => (
                        <div key={info.id} className={cn("bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] shadow-sm border transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]", info.isOfficial ? 'border-amber-300 ring-4 ring-amber-50' : 'border-white')}>
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-2xl border-2 border-white shadow-md bg-slate-100 overflow-hidden relative">
                                        {info.contributor?.iconUrl ? (
                                            <Image src={info.contributor.iconUrl} alt="User" fill className="object-cover"/>
                                        ) : (
                                            <div className="w-full h-full text-slate-300 flex items-center justify-center"><User size={24}/></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-black text-lg text-slate-800 leading-tight">{info.title}</h3>
                                            {info.isOfficial && (
                                                <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-md font-black flex items-center gap-1 uppercase tracking-widest border border-amber-200">
                                                    <CheckCircle2 size={10}/> 公式
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            <span>{info.contributor?.platformName || '匿名ユーザー'}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span>{new Date(info.createdAt).toLocaleDateString('ja-JP')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50/80 p-5 md:p-6 rounded-[1.5rem] mb-6 border border-slate-100">
                                <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed font-medium"><JpText>{info.description}</JpText></p>
                            </div>
                            
                            {info.imageUrls && info.imageUrls.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {info.imageUrls.map((url, i) => (
                                        <div key={i} className="relative w-28 h-28 rounded-[1.5rem] overflow-hidden border-2 border-white shadow-sm cursor-zoom-in group hover:shadow-md transition-all" onClick={() => setModalImage(url)}>
                                            <Image src={url} alt="Logistics info" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-slate-100/50">
                                <button onClick={() => handleHelpful(info.id)}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-black text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all active:scale-95 shadow-sm"
                                >
                                    <ThumbsUp size={16} className={info.helpfulCount > 0 ? "text-indigo-500 fill-indigo-100" : ""}/> 
                                    <span>役に立った</span>
                                    {info.helpfulCount > 0 && <span className="bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full text-[10px] ml-1 shadow-inner">{info.helpfulCount}</span>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {modalImage && <SimpleImageModal src={modalImage} onClose={() => setModalImage(null)} />}
      </div>
    </div>
  );
}