'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiClock, FiMapPin, FiMessageSquare, FiUser, FiHeart, FiPlus, FiLock, FiTruck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

import VenueLogisticsPostModal from './VenueLogisticsPostModal';
import ImageModal from './ImageModal'; // 作成済みの画像拡大モーダル

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

/**
 * VenueLogisticsWiki コンポーネント
 * - デザイン刷新: カード型レイアウト、ブラーエフェクト
 * - 機能追加: いいね機能、画像拡大
 */
export default function VenueLogisticsWiki({ venueId, venueName, isFloristView = false }) {
    const [logistics, setLogistics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    
    // モーダル管理
    const [showPostModal, setShowPostModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const fetchLogistics = useCallback(async () => {
        if (!venueId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const token = getAuthToken();
            
            // トークンがない、または閲覧権限がない場合の処理はAPIレスポンスで判定
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(`${API_URL}/api/venues/${venueId}/logistics`, { headers });
            
            if (res.status === 403 || res.status === 401) {
                setAccessDenied(true);
            } else if (!res.ok) {
                // 404などは空配列として扱う
                setLogistics([]);
            } else {
                setAccessDenied(false);
                const data = await res.json();
                setLogistics(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Wiki取得エラー:", error);
            // エラー時は静かに空表示にするか、トーストを出す
        } finally {
            setLoading(false);
        }
    }, [venueId]);

    useEffect(() => {
        fetchLogistics();
    }, [fetchLogistics]);

    // 「役に立った」ボタンの処理 (Optimistic UI)
    const handleHelpful = async (logId) => {
        const token = getAuthToken();
        if (!token) return toast.error('ログインが必要です');

        // 1. UIを先に更新
        setLogistics(prev => prev.map(log => {
            if (log.id === logId) {
                // 簡易的なトグルロジック（実際はサーバー側でユーザー重複チェック等がある前提）
                return { ...log, helpfulCount: (log.helpfulCount || 0) + 1, isHelpful: true };
            }
            return log;
        }));

        try {
            await fetch(`${API_URL}/api/venues/logistics/${logId}/helpful`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // 成功時は何もしない（UIは更新済み）
        } catch (error) {
            // 失敗したら元に戻す（再取得）
            fetchLogistics();
            toast.error('エラーが発生しました');
        }
    };

    if (!venueId) return null;

    // --- Loading State ---
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                <div className="space-y-3">
                    <div className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>
                    <div className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>
                </div>
            </div>
        );
    }
    
    // --- Access Denied State (Blur Effect) ---
    if (accessDenied) {
        return (
            <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 filter blur-sm select-none opacity-50">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <FiTruck /> {venueName} 搬入情報Wiki
                    </h3>
                    <div className="mt-4 space-y-4">
                         {/* ダミーコンテンツ */}
                        <div className="bg-gray-100 h-24 rounded-lg"></div>
                        <div className="bg-gray-100 h-24 rounded-lg"></div>
                    </div>
                </div>
                
                {/* ロックオーバーレイ */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 z-10 p-6 text-center">
                    <div className="bg-rose-100 text-rose-600 p-4 rounded-full mb-3">
                        <FiLock size={24} />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">お花屋さん専用コンテンツ</h4>
                    <p className="text-sm text-gray-600 mb-4 max-w-sm">
                        この会場の搬入経路や過去の事例（Wiki）を閲覧するには、<br/>
                        お花屋さんアカウントでのログインが必要です。
                    </p>
                    <a href="/login" className="px-6 py-2 bg-rose-600 text-white font-bold rounded-full hover:bg-rose-700 transition-colors shadow-lg">
                        ログインして閲覧
                    </a>
                </div>
            </div>
        );
    }

    // --- Main Content ---
    return (
        <>
            {/* 画像拡大モーダル */}
            {selectedImage && (
                <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FiTruck className="text-rose-400"/> 搬入・現場Wiki 
                        </h3>
                        <p className="text-slate-300 text-xs mt-1 flex items-center gap-1">
                            <FiMapPin size={10} /> {venueName}
                        </p>
                    </div>
                    {isFloristView && (
                        <button 
                            onClick={() => setShowPostModal(true)}
                            className="text-xs bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            <FiPlus size={14} /> 情報を共有する
                        </button>
                    )}
                </div>

                {/* Content List */}
                <div className="p-6 bg-slate-50 min-h-[200px]">
                    {logistics.length > 0 ? (
                        <div className="space-y-4">
                            {logistics.map((log) => (
                                <div key={log.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-rose-200 transition-colors">
                                    {/* 投稿ヘッダー */}
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-gray-800 text-base">
                                            {log.title}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                                            <FiClock size={10}/> {new Date(log.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* 本文 */}
                                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-4">
                                        {log.description}
                                    </div>

                                    {/* 画像グリッド */}
                                    {log.imageUrls && log.imageUrls.length > 0 && (
                                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                            {log.imageUrls.map((url, i) => (
                                                <div 
                                                    key={i} 
                                                    className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-100 cursor-zoom-in group"
                                                    onClick={() => setSelectedImage(url)}
                                                >
                                                    <img src={url} alt="現場写真" className="w-full h-full object-cover transition-transform group-hover:scale-110"/>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* フッター（投稿者 & いいね） */}
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                                <FiUser />
                                            </div>
                                            <span className="font-medium truncate max-w-[120px]">
                                                {log.contributor?.storeName || log.contributor?.handleName || '匿名フローリスト'}
                                            </span>
                                        </div>

                                        <button 
                                            onClick={() => handleHelpful(log.id)}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                                                log.isHelpful 
                                                ? 'bg-rose-100 text-rose-600' 
                                                : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
                                            }`}
                                        >
                                            <FiHeart className={log.isHelpful ? 'fill-rose-600' : ''} />
                                            参考になった ({log.helpfulCount || 0})
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                            <div className="bg-slate-100 p-3 rounded-full mb-3 text-slate-400">
                                <FiMessageSquare size={24} />
                            </div>
                            <p className="text-slate-500 font-bold text-sm">まだ情報が共有されていません</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                この会場での搬入経験はありませんか？<br/>
                                あなたの知識が他の花屋さんの助けになります。
                            </p>
                            {isFloristView && (
                                <button 
                                    onClick={() => setShowPostModal(true)}
                                    className="mt-4 text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <FiPlus /> 最初の事例を投稿する
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="px-5 py-3 bg-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <FiAlertCircle /> 投稿内容は個人の経験に基づくものであり、現在の会場規則と異なる場合があります。
                </div>
            </div>
            
            {/* 投稿モーダル */}
            {showPostModal && (
                <VenueLogisticsPostModal
                    venueId={venueId}
                    venueName={venueName}
                    onClose={() => setShowPostModal(false)}
                    onPostSuccess={fetchLogistics}
                />
            )}
        </>
    );
}