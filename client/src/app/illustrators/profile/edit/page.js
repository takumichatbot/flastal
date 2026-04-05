'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Lucide Icons
import { 
    PenTool, Image as ImageIcon, Loader2, Save, 
    User, Sparkles, X, Plus, Link as LinkIcon, 
    Coins, Clock, RefreshCw, CheckCircle2, ChevronLeft, Brush, AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ===========================================
// 🎨 UI COMPONENTS
// ===========================================
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-amber-300 rounded-full mix-blend-multiply filter blur-[2px] opacity-20"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -100], x: [null, (Math.random() - 0.5) * 50], opacity: [0.1, 0.4, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(245,158,11,0.05)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

const InputLabel = ({ icon: Icon, title, subtitle, required }) => (
  <div className="flex items-end gap-2 mb-3 pl-2">
    {Icon && <Icon className="text-amber-500 mb-0.5" size={18} />}
    <label className="block text-sm md:text-base font-black text-slate-700 tracking-tight">
      {title} {required && <span className="text-amber-500 ml-1">*</span>}
    </label>
    {subtitle && <span className="text-[10px] text-slate-400 font-bold mb-0.5">{subtitle}</span>}
  </div>
);

const GlassInput = (props) => (
  <input 
    {...props}
    className={cn(
      "w-full px-5 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl",
      "focus:outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100/50",
      "transition-all font-bold text-slate-800 placeholder:text-slate-300",
      props.className
    )}
  />
);

const GlassTextarea = (props) => (
  <textarea 
    {...props}
    className={cn(
      "w-full px-5 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl resize-none",
      "focus:outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100/50",
      "transition-all font-bold text-slate-800 placeholder:text-slate-300 leading-relaxed",
      props.className
    )}
  />
);

// ===========================================
// MAIN COMPONENT
// ===========================================
export default function IllustratorProfileEdit() {
  const { user, isLoading: authLoading, authenticatedFetch, fetchUser } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  const [isPortfolioUploading, setIsPortfolioUploading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState({
    handleName: '',
    bio: '',
    socialLink: '',
    basePrice: '',
    deliveryDays: '',
    retakeCount: '2',
    isAcceptingRequests: true,
    tags: '',
    iconUrl: '',
    portfolioUrls: []
  });

  // 初期データの取得（UserとIllustratorProfileのデータ）
  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/illustrators/login');
        return;
    }
    
    if (user && user.role === 'ILLUSTRATOR' && !dataLoaded) {
        const loadProfile = async () => {
            try {
                // ※バックエンドのAPI仕様に合わせて取得（存在しない場合はUser情報から埋める）
                const res = await authenticatedFetch(`${API_URL}/api/illustrators/profile`);
                if (res.ok) {
                    const profileData = await res.json();
                    setFormData({
                        handleName: user.handleName || profileData.name || '',
                        bio: profileData.bio || '',
                        socialLink: profileData.socialLink || '',
                        basePrice: profileData.basePrice?.toString() || '5000',
                        deliveryDays: profileData.deliveryDays?.toString() || '14',
                        retakeCount: profileData.retakeCount?.toString() || '2',
                        isAcceptingRequests: profileData.isAcceptingRequests !== false, // デフォルトtrue
                        tags: Array.isArray(profileData.tags) ? profileData.tags.join('、') : (profileData.tags || ''),
                        iconUrl: user.iconUrl || profileData.iconUrl || '',
                        portfolioUrls: profileData.portfolioUrls || []
                    });
                } else {
                    // プロフィール未作成の場合
                    setFormData(prev => ({
                        ...prev,
                        handleName: user.handleName || '',
                        iconUrl: user.iconUrl || ''
                    }));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setDataLoaded(true);
            }
        };
        loadProfile();
    }
  }, [user, authLoading, authenticatedFetch, router, dataLoaded]);

  // S3への画像アップロード共通処理
  const uploadImageToS3 = async (file) => {
    try {
        const res = await authenticatedFetch('/api/tools/s3-upload-url', {
            method: 'POST',
            body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });
        if (!res.ok) throw new Error('署名付きURLの取得に失敗しました');
        const { uploadUrl, fileUrl } = await res.json();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.onload = () => {
                if (xhr.status === 200) resolve(fileUrl);
                else reject(new Error('S3へのアップロードに失敗しました'));
            };
            xhr.onerror = () => reject(new Error('ネットワークエラーが発生しました'));
            xhr.send(file);
        });
    } catch (error) {
        throw error;
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsIconUploading(true);
    const toastId = toast.loading('アイコンをアップロード中...');
    try {
      const url = await uploadImageToS3(file);
      setFormData(prev => ({ ...prev, iconUrl: url }));
      
      // ユーザー自体のアイコンも即座に更新
      await authenticatedFetch(`${API_URL}/api/users/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ iconUrl: url })
      });
      fetchUser();
      
      toast.success('アイコンを更新しました！', { id: toastId });
    } catch (error) {
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsIconUploading(false);
    }
  };

  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (formData.portfolioUrls.length + files.length > 12) {
        return toast.error('ポートフォリオは最大12枚までです');
    }

    setIsPortfolioUploading(true);
    const toastId = toast.loading(`${files.length}枚の画像をアップロード中...`);
    const uploadedUrls = [];
    try {
        for (const file of files) {
            const url = await uploadImageToS3(file);
            uploadedUrls.push(url);
        }
        setFormData(prev => ({ ...prev, portfolioUrls: [...prev.portfolioUrls, ...uploadedUrls] }));
        toast.success('ポートフォリオに追加しました！', { id: toastId });
    } catch (error) {
        toast.error('一部の画像のアップロードに失敗しました', { id: toastId });
    } finally {
        setIsPortfolioUploading(false);
        e.target.value = '';
    }
  };

  const removePortfolioImage = (indexToRemove) => {
      setFormData(prev => ({
          ...prev,
          portfolioUrls: prev.portfolioUrls.filter((_, idx) => idx !== indexToRemove)
      }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.handleName) return toast.error('活動名は必須です');

    setIsSubmitting(true);
    const toastId = toast.loading('プロフィールを保存中...');

    try {
      const payload = {
          name: formData.handleName,
          bio: formData.bio,
          socialLink: formData.socialLink,
          basePrice: parseInt(formData.basePrice, 10) || 5000,
          deliveryDays: parseInt(formData.deliveryDays, 10) || 14,
          retakeCount: parseInt(formData.retakeCount, 10) || 2,
          isAcceptingRequests: formData.isAcceptingRequests,
          tags: formData.tags.split(/[,、\s]+/).filter(t => t.trim()), // コンマやスペースで配列化
          iconUrl: formData.iconUrl,
          portfolioUrls: formData.portfolioUrls
      };

      const res = await authenticatedFetch(`${API_URL}/api/illustrators/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      // User側のhandleNameも更新しておく
      await authenticatedFetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handleName: formData.handleName })
      });
      fetchUser();

      toast.success('プロフィールを更新しました！✨', { id: toastId });
      setTimeout(() => { router.push('/illustrators/dashboard'); }, 1000);

    } catch (error) { 
        toast.error(error.message, { id: toastId }); 
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading || !dataLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-amber-50/50"><Loader2 className="animate-spin text-amber-500 w-12 h-12" /></div>;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 min-h-screen py-16 font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-200/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
        
        <div className="mb-6">
            <Link href="/illustrators/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors shadow-sm border border-white">
                <ChevronLeft size={16}/> ダッシュボードに戻る
            </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-3xl shadow-lg border border-amber-100 mb-6 text-amber-500 rotate-3">
            <Brush size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mb-3">プロフィール編集</h1>
          <p className="text-slate-500 font-bold text-sm">あなたの得意なことや条件をアピールして、依頼を増やしましょう！🎨</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* --- 受付ステータス --- */}
          <GlassCard className="bg-gradient-to-r from-amber-400 to-orange-500 !p-6 md:!p-8 text-white border-none shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                  <h3 className="font-black text-xl mb-1 flex items-center gap-2"><Sparkles size={20}/> 依頼の受付状況</h3>
                  <p className="text-xs font-bold text-amber-100">現在、新しいイラスト作成のオファーを受け付けますか？</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" name="isAcceptingRequests" checked={formData.isAcceptingRequests} onChange={handleChange} className="sr-only peer" />
                <div className="w-16 h-8 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-400 shadow-inner"></div>
                <span className="ml-3 text-sm font-black w-16">{formData.isAcceptingRequests ? '受付中' : '停止中'}</span>
              </label>
          </GlassCard>

          {/* --- 基本情報 --- */}
          <GlassCard>
            <InputLabel icon={User} title="基本情報" subtitle="あなたについて教えてください" required />
            
            <div className="flex flex-col sm:flex-row gap-8 mt-6">
                <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-slate-50 shadow-md group">
                        {formData.iconUrl ? (
                            <Image src={formData.iconUrl} alt="Icon" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={40}/></div>
                        )}
                        <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
                            {isIconUploading ? <Loader2 className="animate-spin text-white" size={24}/> : <ImageIcon className="text-white" size={24}/>}
                            <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} disabled={isIconUploading} />
                        </label>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">アイコンを変更</span>
                </div>

                <div className="flex-1 space-y-5">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">活動名 / ペンネーム <span className="text-amber-500">*</span></label>
                        <GlassInput type="text" name="handleName" required value={formData.handleName} onChange={handleChange} placeholder="例: 神絵師ナナ" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">自己紹介</label>
                        <GlassTextarea name="bio" value={formData.bio} onChange={handleChange} rows="4" placeholder="得意なジャンル、過去の実績、フラスタパネルへの想いなどを書きましょう！" />
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">ポートフォリオ・SNSリンク</label>
                        <LinkIcon className="absolute left-4 top-10 text-slate-400" size={16} />
                        <GlassInput type="url" name="socialLink" value={formData.socialLink} onChange={handleChange} placeholder="https://twitter.com/..." className="pl-12" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">得意なタグ (カンマ区切り)</label>
                        <GlassInput type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="例: 可愛い, デフォルメ, 厚塗り, アイドル" />
                    </div>
                </div>
            </div>
          </GlassCard>

          {/* --- 料金・条件 --- */}
          <GlassCard>
            <InputLabel icon={Coins} title="制作条件・料金" subtitle="企画者がオファーを出す際の目安になります" required />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">基本料金 (pt)</label>
                    <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                        <GlassInput type="number" name="basePrice" required min="1000" value={formData.basePrice} onChange={handleChange} placeholder="5000" className="pl-12" />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">pt〜</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">基本納期 (日数)</label>
                    <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={18} />
                        <GlassInput type="number" name="deliveryDays" required min="1" value={formData.deliveryDays} onChange={handleChange} placeholder="14" className="pl-12" />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">日</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">無料リテイク回数</label>
                    <div className="relative">
                        <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                        <GlassInput type="number" name="retakeCount" required min="0" value={formData.retakeCount} onChange={handleChange} placeholder="2" className="pl-12" />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">回</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-5 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16}/>
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                    基本料金は目安です。実際の依頼内容（等身大パネル、複数人など）によって、チャット内で企画者と相談し、最終的な見積もり金額を決定できます。<br/>
                    <span className="text-amber-500 font-black">※報酬はすべて1pt=1円としてFlastalポイントで付与されます。</span>
                </p>
            </div>
          </GlassCard>

          {/* --- ポートフォリオ --- */}
          <GlassCard>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <InputLabel icon={ImageIcon} title="ポートフォリオ画像" subtitle="過去の作品や絵柄がわかる画像を登録してください（最大12枚）" />
                <label className="px-5 py-2.5 bg-amber-100 text-amber-600 rounded-full text-xs font-black hover:bg-amber-200 transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
                    {isPortfolioUploading ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14}/>} 画像を追加
                    <input type="file" multiple accept="image/*" onChange={handlePortfolioUpload} disabled={isPortfolioUploading} className="hidden" />
                </label>
            </div>

            {formData.portfolioUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.portfolioUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-[1.5rem] overflow-hidden group shadow-sm border-2 border-slate-100 bg-slate-50">
                            <Image src={url} alt={`Portfolio ${index}`} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button type="button" onClick={() => removePortfolioImage(index)} className="absolute top-2 right-2 w-8 h-8 bg-white text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:scale-110 shadow-md">
                                <X size={16}/>
                            </button>
                        </div>
                    ))}
                    {formData.portfolioUrls.length < 12 && (
                        <label className="aspect-square border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer transition-colors group">
                            <Plus className="text-slate-300 group-hover:text-amber-400 mb-2" size={24}/>
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-amber-500">アップロード</span>
                            <input type="file" multiple accept="image/*" onChange={handlePortfolioUpload} disabled={isPortfolioUploading} className="hidden" />
                        </label>
                    )}
                </div>
            ) : (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2rem]">
                    <ImageIcon className="mx-auto text-slate-300 mb-3" size={48}/>
                    <p className="text-sm font-bold text-slate-500 mb-1">ポートフォリオ画像がありません</p>
                    <p className="text-xs font-medium text-slate-400">最低でも1〜2枚登録することをおすすめします！</p>
                </div>
            )}
          </GlassCard>
          
          {/* --- SUBMIT --- */}
          <div className="pt-6 pb-12">
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(245,158,11,0.3)" }} 
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isSubmitting || isIconUploading || isPortfolioUploading} 
              className={cn(
                "w-full px-8 py-5 md:py-6 font-black text-white bg-gradient-to-r from-amber-400 to-orange-500 rounded-[2rem] shadow-xl text-lg md:text-xl flex items-center justify-center gap-3 transition-all",
                (isSubmitting || isIconUploading || isPortfolioUploading) && "opacity-60 cursor-not-allowed"
              )}
            >
              {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> 保存しています...</> : <><Save size={24} /> プロフィールを更新する</>}
            </motion.button>
          </div>

        </form>
      </div>
    </div>
  );
}