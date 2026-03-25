'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
  Camera, MessageSquare, Heart, User, ZoomIn, X, Loader2, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// cn関数
function cn(...classes) { 
  return classes.filter(Boolean).join(' '); 
}

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6", className)}>
    {children}
  </div>
);

// --- スケルトンローディング ---
const GallerySkeleton = () => (
  <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] shadow-sm border border-white overflow-hidden h-full flex flex-col animate-pulse p-4">
    <div className="h-64 bg-slate-200/50 rounded-[2rem]" />
    <div className="p-4 mt-2 space-y-3">
      <div className="flex gap-2 items-center">
         <div className="w-8 h-8 rounded-full bg-slate-200/50" />
         <div className="h-4 bg-slate-200/50 rounded-full w-1/2" />
      </div>
      <div className="h-4 bg-slate-200/50 rounded-full w-full" />
    </div>
  </div>
);

// --- 画像拡大モーダル ---
const ImageModal = ({ src, alt, onClose }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 transition-opacity" onClick={onClose}>
            <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors border border-white/20">
                <X size={24} />
            </button>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full h-full">
                    <Image src={src} alt={alt} fill className="object-contain drop-shadow-2xl rounded-2xl" sizes="100vw" />
                </div>
            </motion.div>
            <p className="absolute bottom-8 text-white/80 text-xs font-black uppercase tracking-widest pointer-events-none">
                背景をクリックして閉じる
            </p>
        </div>
    );
};

// ===========================================
// ★★★ フィードカードコンポーネント ★★★
// ===========================================
function GalleryCard({ item, userId, onImageClick }) {
    const mainImage = item.imageUrl;
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 10); 

    const handleLike = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        if (!isLiked) toast.success("いいねしました！");
    };

    const CardWrapper = ({ children }) => {
        if (item.link) return <Link href={item.link} className="block h-full group">{children}</Link>;
        return <div className="block h-full group cursor-default">{children}</div>;
    };

    return (
        <CardWrapper>
            <GlassCard className="!p-4 sm:!p-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(244,114,182,0.15)] hover:border-pink-200 flex flex-col h-full">
                
                <div className="relative aspect-[4/5] bg-slate-100 rounded-[2rem] overflow-hidden cursor-zoom-in shadow-inner" onClick={(e) => {
                    if(item.link) e.preventDefault(); 
                    onImageClick(mainImage);
                }}>
                    {mainImage ? (
                        <>
                            <Image src={mainImage} alt={item.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-700 ease-in-out" />
                            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                <span className="bg-white/90 backdrop-blur-md text-slate-800 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-lg tracking-widest uppercase">
                                    <ZoomIn size={16}/> 拡大する
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                            <Camera size={32} />
                        </div>
                    )}
                    
                    <div className="absolute top-3 right-3">
                        {item.type === 'PROJECT' ? (
                            <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest border border-emerald-400">
                                COMPLETED
                            </span>
                        ) : (
                            <span className="bg-pink-500/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest border border-pink-400">
                                FAN POST
                            </span>
                        )}
                    </div>
                </div>

                <div className="pt-5 flex flex-col flex-grow px-2">
                    <h3 className="font-black text-slate-800 text-base leading-snug line-clamp-2 group-hover:text-pink-600 transition-colors mb-3">
                        {item.title}
                    </h3>

                    {item.comment && (
                        <div className="bg-slate-50/80 p-4 rounded-2xl mb-5 text-xs text-slate-600 relative mt-auto border border-slate-100 shadow-inner">
                            <p className="line-clamp-2 font-medium leading-relaxed italic">&quot;{item.comment}&quot;</p>
                        </div>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                                {item.user?.iconUrl ? (
                                    <img src={item.user.iconUrl} alt="" className="w-full h-full object-cover"/>
                                ) : (
                                    <User size={14}/>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 truncate max-w-[100px] uppercase tracking-wider">
                                {item.user?.handleName || '匿名'}
                            </span>
                        </div>

                        <button onClick={handleLike} className={cn("flex items-center gap-1.5 text-xs font-black transition-colors px-3 py-1.5 rounded-full shadow-sm", isLiked ? 'text-pink-600 bg-pink-50 border border-pink-100' : 'text-slate-400 bg-white border border-slate-100 hover:text-pink-500 hover:border-pink-200')}>
                            <Heart size={14} className={isLiked ? "fill-pink-500 text-pink-500" : ""} />
                            {likeCount}
                        </button>
                    </div>
                </div>
            </GlassCard>
        </CardWrapper>
    );
}

// ===========================================
// ★★★ メインページコンポーネント ★★★
// ===========================================
export default function GalleryPage() {
    const { user } = useAuth();
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalImage, setModalImage] = useState(null);
    
    const fetchFeed = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/gallery/feed`); 
            if (!response.ok) throw new Error('ギャラリーデータの取得に失敗しました');
            const data = await response.json();
            setFeedItems(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("読み込みに失敗しました");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50/50 to-sky-50/50 font-sans text-slate-800 relative overflow-hidden pb-24">
            <FloatingParticles />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

            <header className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center z-10 max-w-4xl mx-auto">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[2rem] mb-6 shadow-lg border border-pink-100 rotate-3">
                    <Camera className="text-pink-500" size={36}/>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 tracking-tighter">
                    FLASTAL 実績ギャラリー
                </h1>
                <p className="text-slate-500 text-sm md:text-base font-bold leading-relaxed max-w-2xl mx-auto mb-10">
                    ファンと花屋さんが力を合わせて作り上げた、最高のフラワースタンドたち。<br/>
                    企画者からの感謝のメッセージと共に紹介します。
                </p>
                
                <Link href="/projects">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-transparent text-base font-black rounded-full shadow-xl text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-pink-200 transition-all">
                        <Sparkles size={18}/> 進行中の企画を探す
                    </motion.button>
                </Link>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                        {[...Array(8)].map((_, i) => <GallerySkeleton key={i} />)}
                    </div>
                ) : feedItems.length === 0 ? (
                    <GlassCard className="text-center py-32 border-2 border-dashed border-white">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                            <Camera size={40}/>
                        </div>
                        <p className="text-2xl font-black text-slate-800 mb-2">まだ実績がありません</p>
                        <p className="text-slate-500 font-bold text-sm">新しい企画が完了すると、ここに表示されます🌸</p>
                    </GlassCard>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                        <AnimatePresence>
                            {feedItems.map((item) => (
                                <GalleryCard 
                                    key={item.id} 
                                    item={item} 
                                    userId={user?.id}
                                    onImageClick={(src) => setModalImage({ src, alt: item.title })}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            <AnimatePresence>
                {modalImage && (
                    <ImageModal src={modalImage.src} alt={modalImage.alt} onClose={() => setModalImage(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}