'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  FiCamera, FiMessageSquare, FiHeart, FiUser, FiZoomIn, FiX, FiLoader 
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext'; // パスは環境に合わせて調整してください

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- スケルトンローディング ---
const GallerySkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
    <div className="h-64 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="flex gap-2 items-center">
         <div className="w-8 h-8 rounded-full bg-gray-200" />
         <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  </div>
);

// --- 画像拡大モーダル ---
const ImageModal = ({ src, alt, onClose }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 transition-opacity animate-fadeIn" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <FiX size={32} />
            </button>
            <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full h-full">
                    <Image 
                        src={src} 
                        alt={alt} 
                        fill 
                        className="object-contain"
                        sizes="100vw"
                    />
                </div>
            </div>
            <p className="absolute bottom-6 text-white/80 text-sm font-medium pointer-events-none">
                背景をクリックして閉じる
            </p>
        </div>
    );
};

// ===========================================
// ★★★ フィードカードコンポーネント ★★★
// ===========================================
function GalleryCard({ item, userId, onImageClick }) {
    // 完了写真の1枚目を使用、なければダミー
    const mainImage = item.completionImageUrls?.[0];
    const latestPost = item.successPosts?.[0];
    const [isLiked, setIsLiked] = useState(false); // 本来はAPIから取得
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 10); // ダミー数

    // いいねハンドラ (楽観的UI)
    const handleLike = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        if (!isLiked) toast.success("いいねしました！");
    };

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
            
            {/* 1. 写真エリア */}
            <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden cursor-pointer">
                {mainImage ? (
                    <>
                        <Image 
                            src={mainImage} 
                            alt={`${item.title} 完成写真`} 
                            fill 
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                            className="group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            onClick={() => onImageClick(mainImage)}
                        />
                        {/* ホバー時のオーバーレイ */}
                        <div 
                            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none"
                        >
                            <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                                <FiZoomIn /> 拡大する
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-slate-50">
                        <FiCamera size={32} />
                    </div>
                )}
                
                {/* 完了バッジ */}
                <div className="absolute top-3 right-3">
                    <span className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        COMPLETED
                    </span>
                </div>
            </div>

            {/* 2. コンテンツエリア */}
            <div className="p-4 flex flex-col flex-grow">
                {/* 企画タイトル */}
                <Link href={`/projects/${item.id}`} className="block mb-3">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {item.title}
                    </h3>
                </Link>

                {/* メッセージ抜粋 */}
                {latestPost && (
                    <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs text-gray-600 relative mt-auto">
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-50 rotate-45 transform"></div>
                        <p className="line-clamp-2 italic">"{latestPost.content}"</p>
                    </div>
                )}

                {/* フッター情報 */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                            <FiUser size={12}/>
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[100px]">
                            {item.planner?.handleName || '匿名企画者'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleLike}
                            className={`flex items-center gap-1 text-xs font-bold transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
                        >
                            <FiHeart size={16} className={isLiked ? "fill-pink-500" : ""} />
                            {likeCount}
                        </button>
                        <Link href={`/projects/${item.id}`} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-sky-500 transition-colors">
                            <FiMessageSquare size={16}/>
                            {item.successPosts?.length || 0}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
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
    
    // データ取得
    const fetchFeed = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/gallery/feed`); 
            if (!response.ok) throw new Error('ギャラリーデータの取得に失敗しました');
            const data = await response.json();
            setFeedItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Feed fetch error:", error);
            toast.error("読み込みに失敗しました");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
            
            {/* 1. ヒーローセクション */}
            <header className="relative bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-pink-50 rounded-full mb-4">
                        <FiCamera className="text-pink-500 text-2xl"/>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        FLASTAL 実績ギャラリー
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        ファンと花屋さんが力を合わせて作り上げた、最高のフラワースタンドたち。<br/>
                        企画者からの感謝のメッセージと共に紹介します。
                    </p>
                    
                    <div className="mt-8">
                        <Link href="/projects" className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-full shadow-sm text-white bg-pink-600 hover:bg-pink-700 transition-colors">
                            進行中の企画を探す
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. ギャラリーグリッド */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <GallerySkeleton key={i} />)}
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCamera className="text-gray-300 text-3xl"/>
                        </div>
                        <p className="text-xl font-bold text-gray-700 mb-2">まだ実績がありません</p>
                        <p className="text-gray-500">新しい企画が完了すると、ここに表示されます。</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
                        {feedItems.map((item) => (
                            <GalleryCard 
                                key={item.id} 
                                item={item} 
                                userId={user?.id}
                                onImageClick={(src) => setModalImage({ src, alt: item.title })}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* 画像モーダル */}
            {modalImage && (
                <ImageModal 
                    src={modalImage.src} 
                    alt={modalImage.alt} 
                    onClose={() => setModalImage(null)} 
                />
            )}
        </div>
    );
}