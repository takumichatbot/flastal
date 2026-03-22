'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { 
  Save, Camera, ArrowLeft, Zap, Check, MapPin, 
  Phone, Globe, User, Image as ImageIcon, Trash2, Loader2, Sparkles, Building
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STYLE_TAGS = [
  'かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン',
  'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'ニュアンスカラー',
  'バルーン装飾', 'ペーパーフラワー', '布・リボン装飾', 'キャラクター/モチーフ',
  '大型/連結', '卓上/楽屋花', 'リーズナブル'
];

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// 🎨 Glassmorphism Components
const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-8", className)}>
    {children}
  </div>
);

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

export default function FloristProfileEditPage() {
  const { user, isLoading: authLoading, authenticatedFetch, logout } = useAuth();
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors, isSubmitting } 
  } = useForm();
  
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [iconUrl, setIconUrl] = useState('');
  
  const [isPortfolioUploading, setIsPortfolioUploading] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  
  const iconInputRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'FLORIST') {
      router.push('/florists/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/api/florists/profile`);
        
        if (res.ok) {
          const f = await res.json();
          setValue('shopName', f.shopName || '');
          setValue('platformName', f.platformName || '');
          setValue('contactName', f.contactName || '');
          setValue('address', f.address || '');
          setValue('phoneNumber', f.phoneNumber || '');
          setValue('website', f.website || '');
          setValue('portfolio', f.portfolio || '');
          setValue('acceptsRushOrders', f.acceptsRushOrders || false);
          
          setSelectedTags(f.specialties || []);
          setPortfolioImages(f.portfolioImages || []);
          setIconUrl(f.iconUrl || '');
        } else if (res.status === 401) {
          logout();
        }
      } catch (error) {
        console.error(error);
        toast.error('プロフィールの読み込みに失敗しました');
      } finally {
        setLoadingData(false);
      }
    };
    fetchProfile();
  }, [user, authLoading, authenticatedFetch, setValue, router, logout]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const uploadFile = async (file) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/tools/s3-upload-url`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      
      if (!res.ok) throw new Error('アップロード用URLの取得に失敗しました');
      const { uploadUrl, fileUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadRes.ok) throw new Error('S3への保存に失敗しました');

      return { url: fileUrl };
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsIconUploading(true);
    const toastId = toast.loading('アイコンを更新中...');
    try {
      const data = await uploadFile(file);
      setIconUrl(data.url);
      toast.success('アイコンを変更しました', { id: toastId });
    } catch (error) {
      toast.error('失敗しました: ' + error.message, { id: toastId });
    } finally {
      setIsIconUploading(false);
    }
  };

  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (portfolioImages.length + files.length > 6) return toast.error('最大6枚です');
    setIsPortfolioUploading(true);
    const toastId = toast.loading('アップロード中...');
    try {
      for (const file of files) {
        const data = await uploadFile(file);
        setPortfolioImages(prev => [...prev, data.url]);
      }
      toast.success('追加しました', { id: toastId });
    } catch (error) {
      toast.error('失敗しました: ' + error.message, { id: toastId });
    } finally {
      setIsPortfolioUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          iconUrl: iconUrl,
          specialties: selectedTags,
          portfolioImages: portfolioImages
        }),
      });
      if (!res.ok) throw new Error('更新失敗');
      toast.success('保存しました');
      router.push('/florists/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || loadingData) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="animate-spin text-pink-500" size={40} />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-sky-50/50 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 pt-8">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-white/80 backdrop-blur-md p-4 rounded-full shadow-sm border border-white">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <Link href="/florists/dashboard" className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-pink-600 shadow-sm border border-slate-100 transition-colors shrink-0">
                    <ArrowLeft size={20}/>
                </Link>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                    <Building className="text-emerald-500" size={24}/> プロフィール編集
                </h1>
            </div>
            <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || isIconUploading || isPortfolioUploading}
                className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-slate-900 text-white font-black rounded-full hover:bg-slate-800 shadow-lg transition-all disabled:opacity-50"
            >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>}
                変更を保存
            </motion.button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 基本情報 */}
            <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100">
                    <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                        <User className="text-sky-500" size={20}/> 基本情報
                    </h2>
                </div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-10">
                        <div className="flex flex-col items-center gap-3">
                            <div 
                                className="relative w-32 h-32 rounded-[2rem] border-4 border-white shadow-xl bg-slate-100 overflow-hidden cursor-pointer group rotate-3 hover:rotate-0 transition-transform"
                                onClick={() => iconInputRef.current.click()}
                            >
                                {iconUrl ? <Image src={iconUrl} alt="Icon" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={48} /></div>}
                                <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white backdrop-blur-sm">
                                    <Camera size={24} className="mb-1"/>
                                    <span className="text-[10px] font-black tracking-widest uppercase">Change</span>
                                </div>
                            </div>
                            <input type="file" ref={iconInputRef} accept="image/*" onChange={handleIconUpload} className="hidden" />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">活動名 (ユーザーに公開) <span className="text-pink-500">*</span></label>
                                <input type="text" {...register('platformName', { required: true })} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-800" placeholder="FLASTAL 花子" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">店舗名 (正式名称・非公開)</label>
                                <input type="text" {...register('shopName')} className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed font-bold" readOnly />
                                <p className="text-[10px] font-bold text-slate-400 mt-2">※ 正式名称の変更は運営への申請が必要です</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">担当者名</label>
                                    <input type="text" {...register('contactName')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-800" placeholder="山田 太郎" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Phone size={12}/> 電話番号</label>
                                    <input type="tel" {...register('phoneNumber')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-800 font-mono" placeholder="03-1234-5678" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* 店舗詳細・Web */}
            <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100">
                    <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                        <MapPin className="text-pink-500" size={20}/> 店舗詳細・Web
                    </h2>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">住所</label>
                       <input type="text" {...register('address')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all font-bold text-slate-800" placeholder="〒000-0000 東京都渋谷区..." />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Globe size={12}/> ウェブサイト / SNS</label>
                       <input type="url" {...register('website')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all font-bold text-slate-800" placeholder="https://instagram.com/..." />
                    </div>
                </div>
            </GlassCard>

            {/* お急ぎ便対応 */}
            <GlassCard className="bg-gradient-to-r from-amber-50 to-orange-50 !border-amber-200 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-4 bg-amber-400 text-white rounded-2xl shadow-lg shrink-0 rotate-3">
                            <Zap size={28}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-amber-900 mb-1">お急ぎ便 (Rush Order) 対応</h3>
                            <p className="text-xs font-bold text-amber-700/80 leading-relaxed">
                                直前の依頼も受け付けますか？ オンにするとお急ぎ検索で上位に表示されます。
                            </p>
                        </div>
                    </div>
                    <label className="inline-flex items-center cursor-pointer group shrink-0">
                        <input type="checkbox" {...register('acceptsRushOrders')} className="sr-only peer" />
                        <div className="relative w-16 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-400 after:content-[''] after:absolute after:top-1 after:start-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-inner"></div>
                        <span className="ms-3 text-sm font-black text-amber-800">対応を受け付ける</span>
                    </label>
                </div>
                <Zap className="absolute -bottom-10 -right-10 text-[10rem] text-amber-400 opacity-10 rotate-12 pointer-events-none" />
            </GlassCard>

            {/* 特徴タグ */}
            <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100">
                    <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                        <Check className="text-emerald-500" size={20}/> 特徴タグ
                    </h2>
                </div>
                <div className="p-8">
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        {STYLE_TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={cn(
                                  "px-5 py-2.5 rounded-full text-xs font-black border transition-all",
                                  selectedTags.includes(tag) 
                                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' 
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* 制作実績と自己紹介 */}
            <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100">
                    <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                        <ImageIcon className="text-purple-500" size={20}/> 制作実績 & 自己紹介
                    </h2>
                </div>
                <div className="p-8 space-y-8">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Portfolio Images (Max 6)</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {portfolioImages.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-[1.5rem] overflow-hidden border-2 border-white shadow-sm group">
                                    <Image src={url} alt="work" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setPortfolioImages(prev => prev.filter((_, idx) => idx !== i))}
                                            className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg hover:scale-110"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {portfolioImages.length < 6 && (
                                <label className="aspect-square border-2 border-dashed border-slate-300 bg-slate-50 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-purple-300 hover:text-purple-500 transition-all text-slate-400 group shadow-inner">
                                    {isPortfolioUploading ? <Loader2 className="animate-spin text-purple-500 mb-2" size={28}/> : <Camera className="mb-2 group-hover:scale-110 transition-transform" size={32}/>}
                                    <span className="text-[10px] font-black tracking-widest uppercase">Add Image</span>
                                    <input type="file" multiple accept="image/*" onChange={handlePortfolioUpload} disabled={isPortfolioUploading} className="hidden"/>
                                </label>
                            )}
                        </div>
                    </div>
                    <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Self Introduction</label>
                         <textarea 
                            {...register('portfolio')} 
                            rows="6" 
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-slate-800 resize-none" 
                            placeholder="こだわりの内容を自由に記載してください。"
                         ></textarea>
                    </div>
                </div>
            </GlassCard>
        </form>
      </div>
    </div>
  );
}