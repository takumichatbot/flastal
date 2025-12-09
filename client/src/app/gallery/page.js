'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiCamera, FiMessageSquare, FiHeart, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext'; // いいね機能のために使用

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// ===========================================
// ★★★ メインコンポーネント (GalleryPage) ★★★
// ===========================================
export default function GalleryPage() {
    const { user } = useAuth();
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 💡 総いいね数やコメント数表示は、データモデルにフィールド追加が必要なため、今回はスキップします。

    const fetchFeed = useCallback(async () => {
        setLoading(true);
        try {
            // ステップ 1 で追加した新しい API を使用
            const response = await fetch(`${API_URL}/api/gallery/feed`); 
            if (!response.ok) throw new Error('ギャラリーデータの取得に失敗しました');
            const data = await response.json();
            setFeedItems(data);
        } catch (error) {
            console.error("Feed fetch error:", error);
            toast.error("作品集の読み込みに失敗しました。");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    if (loading) return <div className="min-h-screen text-center py-20">読み込み中...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <header className="max-w-4xl mx-auto px-4 mb-10">
                <h1 className="text-4xl font-extrabold text-gray-800 flex items-center gap-3">
                    <FiCamera className="text-pink-500"/> FLASTAL 実績ギャラリー
                </h1>
                <p className="text-gray-600 mt-2">
                    過去に成功・完了した企画のハイライトと、企画者からの感謝のメッセージを公開しています。
                </p>
                <div className="mt-4">
                    <Link href="/projects" className="text-sm text-sky-600 font-semibold hover:underline">
                        → 進行中の企画を探す
                    </Link>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4">
                
                {feedItems.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
                        <p className="text-gray-500 font-bold mb-2">まだ公開された実績がありません</p>
                        <p className="text-sm text-gray-400">新しい企画の完了をお待ちください。</p>
                    </div>
                )}

                {/* 💡 フィード形式のレイアウト (インスタグラムのタイムラインを意識) */}
                <div className="space-y-12">
                    {feedItems.map((item) => (
                        <FeedCard 
                            key={item.id} 
                            item={item} 
                            userId={user?.id}
                            // ★ いいね機能はサーバーで実装が必要ですが、今回はUIのみ準備
                            // onLikeToggle={handleLikeToggle} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}


// ===========================================
// ★★★ フィードカードコンポーネント ★★★
// ===========================================

function FeedCard({ item, userId }) {
    
    // 完了写真の1枚目を使用
    const mainImage = item.completionImageUrls?.[0];
    
    // 最新の成功ストーリー（裏話・お礼）を取得
    const latestPost = item.successPosts?.[0];

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeInUp">
            
            {/* ヘッダー: 企画者情報 */}
            <div className="flex items-center p-4 border-b">
                <FiUser className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 p-1.5 mr-3"/>
                <div>
                    <Link href={`/projects/${item.id}`} className="font-bold text-gray-800 hover:text-pink-600 transition-colors">
                        {item.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                        企画者: {item.planner.handleName} / {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">完了</div>
            </div>

            {/* 1. 写真エリア (インスタの投稿画像) */}
            <div className="aspect-[4/3] bg-gray-200 relative">
                {mainImage ? (
                    <img 
                        src={mainImage} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">写真がありません</div>
                )}
            </div>

            {/* 2. アクションとコメント */}
            <div className="p-4">
                
                {/* 2.1 アクションバー (いいねボタンのダミー) */}
                <div className="flex items-center gap-4 mb-3">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-pink-500 transition-colors">
                        {/* 💡 ここにいいねの状態管理ロジックが入る */}
                        <FiHeart size={24} className="fill-transparent"/>
                        <span className="font-bold text-sm">99</span> {/* ダミーいいね数 */}
                    </button>
                    <Link href={`/projects/${item.id}#success-posts`} className="flex items-center gap-1 text-gray-500 hover:text-sky-500 transition-colors">
                        <FiMessageSquare size={24}/>
                        <span className="font-bold text-sm">{item.successPosts?.length || 0}</span>
                    </Link>
                </div>
                
                {/* 2.2 成功ストーリー (キャプション) */}
                <div className="text-sm">
                    {latestPost ? (
                        <p className="mb-2">
                            <span className="font-bold mr-1">{latestPost.user.handleName}</span>
                            <span className="text-gray-700 line-clamp-3">
                                {latestPost.content}
                            </span>
                        </p>
                    ) : (
                        <p className="text-gray-500 italic">まだ成功ストーリーは投稿されていません。</p>
                    )}
                    
                    <Link href={`/projects/${item.id}`} className="text-sky-600 font-bold hover:underline mt-1 block">
                        → 企画の詳細・全コメントを見る
                    </Link>
                </div>
            </div>
        </div>
    );
}