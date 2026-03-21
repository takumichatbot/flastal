'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// lucide-react に統一
import { 
  Save, X, Image as ImageIcon, Edit3, ArrowLeft, Loader2, Sparkles, Paintbrush, FileText
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// 背景のふわふわ浮かぶパーティクル
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

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

const GlassInput = (props) => (
  <input 
    {...props}
    className={cn(
      "w-full px-5 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl",
      "focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50",
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
      "focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50",
      "transition-all font-bold text-slate-800 placeholder:text-slate-300 leading-relaxed",
      props.className
    )}
  />
);

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { id: projectId } = params; 
  const { user, loading: authLoading } = useAuth(); 

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    designDetails: '',
    size: '',
    flowerTypes: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!projectId || authLoading) return;
    
    if (!user) {
      toast.error('ログインが必要です');
      router.push('/login');
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}`);
        if (!res.ok) throw new Error('企画情報の読み込みに失敗しました');
        const data = await res.json();
        
        if (String(data.plannerId) !== String(user.id)) {
          toast.error('編集権限がありません');
          router.push(`/projects/${projectId}`);
          return;
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          designDetails: data.designDetails || '',
          size: data.size || '',
          flowerTypes: data.flowerTypes || '',
        });
      } catch (error) {
        console.error(error);
        toast.error('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('画像をアップロード中...');
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData,
      });
      if (!res.ok) throw new Error('アップロード失敗');
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('画像を更新しました', { id: toastId });
    } catch (error) {
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const toastId = toast.loading('保存中...');
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    
    try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}`, { 
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData), 
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || '更新に失敗しました');
        }

        toast.success('企画を更新しました！', { id: toastId });
        router.push(`/projects/${projectId}`); 

    } catch (error) {
        console.error(error);
        toast.error(error.message, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading || authLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-pink-50/50">
            <Loader2 className="animate-spin text-pink-500 w-12 h-12" />
        </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-50 to-sky-50 min-h-screen font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      {/* ヘッダーエリア */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/projects/${projectId}`} className="p-2 hover:bg-pink-50 rounded-full transition-colors text-slate-400 hover:text-pink-500">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Edit3 className="text-pink-500" size={20}/> 企画の編集
                </h1>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleSubmit} 
                disabled={isSubmitting || isUploading}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-full font-black text-sm disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                保存する
              </motion.button>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 基本情報 */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
                <FileText className="text-pink-500" size={20}/>
                <h2 className="text-xl font-black text-slate-800">基本情報</h2>
            </div>
            <div className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-black text-slate-700 mb-2">企画タイトル <span className="text-pink-500">*</span></label>
                    <GlassInput type="text" name="title" id="title" value={formData.title} onChange={handleChange} required placeholder="企画のタイトル" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-black text-slate-700 mb-2">企画の詳しい説明 <span className="text-pink-500">*</span></label>
                    <GlassTextarea name="description" id="description" value={formData.description} onChange={handleChange} rows="8" required placeholder="企画への想いや詳細を記入してください" />
                </div>
            </div>
          </GlassCard>
          
          {/* メイン画像 */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
                <ImageIcon className="text-sky-500" size={20}/>
                <h2 className="text-xl font-black text-slate-800">メイン画像</h2>
            </div>
            <div className="space-y-4">
                <div className="relative w-full aspect-video md:aspect-[21/9] bg-white/50 rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 group cursor-pointer hover:border-pink-300 transition-colors shadow-inner">
                    {formData.imageUrl ? (
                        <Image src={formData.imageUrl} alt="プレビュー" fill className="object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 group-hover:text-pink-400 transition-colors">
                            <ImageIcon size={48} className="mb-3"/>
                            <span className="text-sm font-black">画像が設定されていません</span>
                        </div>
                    )}
                    
                    {/* アップロードオーバーレイ */}
                    <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white font-black backdrop-blur-sm">
                        <Edit3 size={32} className="mb-2"/>
                        <span>クリックして変更</span>
                        <input type="file" onChange={handleImageUpload} disabled={isUploading} className="hidden" accept="image/*"/>
                    </label>
                </div>
                {isUploading && <p className="text-sm text-pink-500 font-bold animate-pulse text-center flex justify-center items-center gap-2"><Loader2 className="animate-spin" size={16}/> 画像をアップロード中...</p>}
            </div>
          </GlassCard>

          {/* デザインの希望 */}
          <GlassCard>
             <div className="flex items-center gap-2 mb-6">
                <Paintbrush className="text-purple-500" size={20}/>
                <h2 className="text-xl font-black text-slate-800">デザイン・お花の希望</h2>
             </div>
             <div className="space-y-6">
                 <div>
                    <label htmlFor="designDetails" className="block text-sm font-black text-slate-700 mb-2">デザインの雰囲気</label>
                    <GlassTextarea name="designDetails" id="designDetails" value={formData.designDetails} onChange={handleChange} rows="3" placeholder="例: 青と白を基調としたクールな雰囲気"></GlassTextarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="size" className="block text-sm font-black text-slate-700 mb-2">希望サイズ</label>
                        <GlassInput type="text" name="size" id="size" value={formData.size} onChange={handleChange} placeholder="例: 180cm x 90cm" />
                    </div>
                    <div>
                        <label htmlFor="flowerTypes" className="block text-sm font-bold text-slate-700 mb-2">使いたいお花</label>
                        <GlassInput type="text" name="flowerTypes" id="flowerTypes" value={formData.flowerTypes} onChange={handleChange} placeholder="例: 青いバラ、ユリ" />
                    </div>
                </div>
             </div>
          </GlassCard>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12">
            <Link href={`/projects/${projectId}`} className="w-full sm:w-auto text-center px-8 py-4 font-black text-slate-500 bg-white border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                変更せずに戻る
            </Link>
            <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isSubmitting || isUploading} 
                className="w-full py-4 font-black text-white bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="animate-spin" size={20}/> 保存中...</> : <><Sparkles size={20}/> 変更内容を保存する</>}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}