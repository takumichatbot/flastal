'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactからTwitterとInstagramを削除
import { ArrowLeft, Calendar, Camera, Cpu, Edit3, Globe, Image as ImageIcon, Info, Loader2, MapPin, Plus, Save, Sparkles, Trash2, Type, X } from 'lucide-react';

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
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(79,70,229,0.05)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

function EditEventContent() {
  const { user, isAuthenticated, loading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const params = useParams(); 
  const eventId = params.id;

  const [isMounted, setIsMounted] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [venues, setVenues] = useState([]);
  
  const [imageUrls, setImageUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const { register, handleSubmit, setValue, reset, formState: { isSubmitting, errors } } = useForm();

  useEffect(() => {
    if (!isMounted || authLoading) return;
    if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
      router.push('/organizers/login');
      return;
    }

    const loadData = async () => {
      try {
        const venueRes = await fetch(`${API_URL}/api/venues`);
        if (venueRes.ok) {
            const vData = await venueRes.json();
            setVenues(Array.isArray(vData) ? vData : (vData.venues || []));
        }

        const eventRes = await authenticatedFetch(`/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error('イベント情報の取得に失敗しました');
        const eventData = await eventRes.json();

        reset({
            title: eventData.title,
            eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString().split('T')[0] : '', 
            venueId: eventData.venueId,
            description: eventData.description,
            genre: eventData.genre,
            officialWebsite: eventData.officialWebsite,
            twitterUrl: eventData.twitterUrl,
            instagramUrl: eventData.instagramUrl
        });
        setImageUrls(eventData.imageUrls || []);

      } catch (e) {
        toast.error('データの読み込みに失敗しました');
        router.push('/organizers/dashboard');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [isMounted, authLoading, isAuthenticated, user, router, eventId, authenticatedFetch, reset]);

  const handleAiAnalyze = async () => {
    if (!aiInputText.trim()) return toast.error('テキストを入力してください');
    setIsAnalyzing(true);
    const toastId = toast.loading('AIが解析中...');

    try {
      const res = await authenticatedFetch(`${API_URL}/api/events/analyze`, {
        method: 'POST', body: JSON.stringify({ text: aiInputText })
      });
      if (!res.ok) throw new Error('解析に失敗しました');
      const data = await res.json();

      if (data.title) setValue('title', data.title);
      if (data.eventDate) setValue('eventDate', data.eventDate);
      if (data.venueId) setValue('venueId', data.venueId);
      if (data.description) setValue('description', data.description);
      if (data.genre) setValue('genre', data.genre);
      if (data.officialWebsite) setValue('officialWebsite', data.officialWebsite);
      if (data.twitterUrl) setValue('twitterUrl', data.twitterUrl);

      toast.success('AI解析結果を反映しました', { id: toastId });
      setShowAiModal(false);
      setAiInputText('');
    } catch (error) {
      toast.error('解析できませんでした', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadToS3 = async (file) => {
    const res = await authenticatedFetch('/api/tools/s3-upload-url', {
      method: 'POST', body: JSON.stringify({ fileName: file.name, fileType: file.type })
    });
    if (!res.ok) throw new Error('署名取得失敗');
    const { uploadUrl, fileUrl } = await res.json();

    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return fileUrl;
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    const toastId = toast.loading('画像をアップロード中...');
    try {
      const newUrls = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) continue;
        const url = await uploadToS3(file);
        newUrls.push(url);
      }
      setImageUrls(prev => [...prev, ...newUrls]);
      toast.success('完了', { id: toastId });
    } catch (err) {
      toast.error('アップロード失敗', { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const onSubmit = async (data) => {
    const toastId = toast.loading('更新中...');
    try {
      const formattedDate = new Date(`${data.eventDate}T00:00:00`).toISOString();
      const res = await authenticatedFetch(`/api/events/${eventId}`, {
        method: 'PATCH', 
        body: JSON.stringify({ ...data, imageUrls: imageUrls, eventDate: formattedDate }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      toast.success('イベント情報を更新しました！', { id: toastId });
      router.push('/organizers/dashboard');
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleDelete = async () => {
    if(!confirm('本当にこのイベントを削除しますか？\nこの操作は取り消せません。')) return;
    const toastId = toast.loading('削除中...');
    try {
        const res = await authenticatedFetch(`/api/events/${eventId}`, { method: 'DELETE' });
        if(!res.ok) throw new Error('削除失敗');
        toast.success('削除しました', { id: toastId });
        router.push('/organizers/dashboard');
    } catch(err) {
        toast.error('削除できませんでした', { id: toastId });
    }
  };

  if (!isMounted || authLoading || loadingData) {
      return <div className="flex items-center justify-center min-h-screen bg-indigo-50/50"><Loader2 className="animate-spin text-indigo-500 w-12 h-12" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 to-purple-50/50 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      
      <div className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/organizers/dashboard" className="p-2 hover:bg-indigo-50 rounded-full transition-colors text-slate-400 hover:text-indigo-600">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2"><Edit3 size={24} className="text-indigo-500"/> イベント編集</h1>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAiModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-5 py-2.5 rounded-full text-sm font-black shadow-md hover:shadow-lg transition-all"
                >
                    <Cpu size={16}/> AI解析
                </motion.button>
                <button onClick={handleDelete} className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full transition-colors shadow-sm shrink-0" title="イベントを削除">
                    <Trash2 size={18} />
                </button>
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <GlassCard className="space-y-8">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Type className="text-indigo-500" size={24}/>
                    <h2 className="text-xl font-black text-slate-800">基本情報</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">イベント名 <span className="text-pink-500">*</span></label>
                      <input type="text" {...register('title', { required: '必須' })} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 outline-none transition-all font-bold text-slate-800 text-lg"/>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">開催日 <span className="text-pink-500">*</span></label>
                          <input type="date" {...register('eventDate', { required: '必須' })} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 outline-none transition-all font-bold text-slate-800 cursor-pointer"/>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ジャンル</label>
                          <select {...register('genre')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 outline-none transition-all font-bold text-slate-800 cursor-pointer appearance-none">
                              <option value="IDOL">アイドル</option><option value="VTUBER">VTuber</option><option value="MUSIC">音楽・バンド</option><option value="ANIME">アニメ・声優</option><option value="STAGE">舞台・演劇</option><option value="OTHER">その他</option>
                          </select>
                      </div>
                  </div>

                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">会場 <span className="text-pink-500">*</span></label>
                      <select {...register('venueId', { required: '必須' })} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 outline-none transition-all font-bold text-slate-800 cursor-pointer appearance-none">
                          <option value="">会場を選択してください</option>
                          {venues.map(v => <option key={v.id} value={v.id}>{v.venueName}</option>)}
                      </select>
                  </div>
                </div>
          </GlassCard>

          <GlassCard className="space-y-8">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <ImageIcon className="text-purple-500" size={24}/>
                    <h2 className="text-xl font-black text-slate-800">メディア・詳細情報</h2>
                </div>

                <div className="space-y-6">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">イベント画像 (複数追加可)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 mb-2">
                          {imageUrls.map((url, idx) => (
                              <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-sm group border-2 border-white">
                                  <img src={url} className="w-full h-full object-cover" alt="Preview" />
                                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"><X size={14} /></button>
                                  {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-indigo-500/90 backdrop-blur-sm text-white text-[10px] text-center py-1 font-black uppercase tracking-widest">Cover</div>}
                              </div>
                          ))}
                          <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all cursor-pointer text-slate-400">
                              {isUploading ? <Loader2 className="animate-spin mb-2" size={28} /> : <><Camera className="mb-2" size={28} /><span className="text-[10px] font-black uppercase tracking-widest">Add Image</span></>}
                              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploading}/>
                          </label>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Globe size={14}/> 公式サイトURL</label>
                        <input type="url" {...register('officialWebsite')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-300 outline-none transition-all font-bold text-slate-800" />
                    </div>
                    <div>
                        {/* TwitterアイコンをGlobeに変更 */}
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Globe size={14}/> X (Twitter) URL</label>
                        <input type="url" {...register('twitterUrl')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-sky-300 outline-none transition-all font-bold text-slate-800" />
                    </div>
                  </div>

                  <div>
                      {/* InstagramアイコンをImageIconに変更 */}
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><ImageIcon size={14}/> Instagram URL</label>
                      <input type="url" {...register('instagramUrl')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-pink-300 outline-none transition-all font-bold text-slate-800" />
                  </div>

                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Info size={14}/> イベント詳細</label>
                      <textarea {...register('description')} rows="5" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-300 outline-none transition-all font-bold text-slate-800 resize-none leading-relaxed"></textarea>
                  </div>
                </div>
          </GlassCard>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12">
             <Link href="/organizers/dashboard" className="w-full sm:w-auto text-center px-8 py-4 font-black text-slate-500 bg-white border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                変更せずに戻る
             </Link>
             <motion.button 
               whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(79,70,229,0.3)" }} whileTap={{ scale: 0.98 }}
               type="submit" disabled={isSubmitting || isUploading} 
               className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-full transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2 text-base md:text-lg flex-1"
             >
                {(isSubmitting || isUploading) ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                {(isSubmitting || isUploading) ? (isUploading ? '画像をアップロード中...' : '保存中...') : '変更内容を保存する'}
             </motion.button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
                <h3 className="font-black flex items-center gap-2 text-lg relative z-10"><Cpu size={20}/> 情報の上書き解析</h3>
                <button onClick={() => setShowAiModal(false)} className="relative z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"><X size={18} /></button>
              </div>
              <div className="p-8">
                <p className="text-xs font-bold text-slate-500 mb-4 leading-relaxed">新しいテキストを貼り付けると、AIが解析してフォームの内容を上書きします。</p>
                <textarea className="w-full h-40 p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none text-sm font-medium resize-none text-slate-800" value={aiInputText} onChange={(e) => setAiInputText(e.target.value)}></textarea>
                <button onClick={handleAiAnalyze} disabled={isAnalyzing} className="w-full mt-6 py-4 bg-slate-900 text-white font-black rounded-full hover:bg-slate-800 transition-all shadow-lg flex justify-center items-center gap-2">
                  {isAnalyzing ? <><Loader2 className="animate-spin" size={18}/> 解析中...</> : <><Sparkles size={18}/> 解析して上書き</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-50/50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-12 h-12" /></div>}>
      <EditEventContent />
    </Suspense>
  );
}