// src/app/components/VenueLogisticsWiki.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiAlertTriangle, FiClock, FiMapPin, FiCheckCircle, FiXCircle, FiInfo, FiMessageSquare, FiUser, FiHeart, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

import VenueLogisticsPostModal from './VenueLogisticsPostModal'; // ★ 新規作成したモーダルをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

/**
 * VenueLogisticsWiki コンポーネント
 * 会場IDに基づき、過去の搬入実績やレギュレーション情報を表示する
 * * @param {object} props
 * @param {string} props.venueId - 表示する会場のID
 * @param {string} props.venueName - 表示する会場の名前 (UI表示用)
 * @param {boolean} props.isFloristView - お花屋さんアカウントで閲覧しているか (投稿ボタン表示用)
 */
export default function VenueLogisticsWiki({ venueId, venueName, isFloristView = false }) {
    const [logistics, setLogistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPostModal, setShowPostModal] = useState(false); // 投稿モーダル状態

    const fetchLogistics = useCallback(async () => {
        if (!venueId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) {
                 // 認証トークンがない場合は、アクセス拒否フラグを立てて終了
                setLogistics({ status: 'ACCESS_DENIED' });
                return;
            }

            // ★ バックエンドAPIから会場ロジスティクス情報を取得
            const res = await fetch(`${API_URL}/api/venues/${venueId}/logistics`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                if (res.status === 403) {
                    setLogistics({ status: 'ACCESS_DENIED' });
                } else if (res.status === 404) {
                    setLogistics([]); // データがない場合は空配列
                } else {
                    throw new Error('会場情報の取得に失敗しました。');
                }
            } else {
                setLogistics(await res.json());
            }
        } catch (error) {
            console.error("会場情報 Wiki 取得エラー:", error);
            setLogistics({ status: 'ERROR', message: error.message });
        } finally {
            setLoading(false);
        }
    }, [venueId]);

    useEffect(() => {
        fetchLogistics();
    }, [fetchLogistics]);

    if (!venueId) {
        return null;
    }

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-xl shadow border border-gray-100 text-center">
                <div className="animate-pulse text-gray-400">会場の過去事例 (Wiki) を読み込み中...</div>
            </div>
        );
    }
    
    // エラーまたはアクセス拒否の場合の表示
    if (logistics.status === 'ACCESS_DENIED') {
        return (
            <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-800 shadow-sm">
                <p className="font-bold flex items-center"><FiXCircle className="mr-2"/> アクセス拒否</p>
                <p className="text-sm">この会場の過去の搬入事例は、お花屋さんアカウントでログインしている場合のみ閲覧・投稿が可能です。</p>
            </div>
        );
    }

    const pastExamples = Array.isArray(logistics) ? logistics : [];
    
    return (
        <>
            <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-pink-500">
                
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-extrabold text-gray-800 flex items-center">
                        <FiMessageSquare className="mr-2 text-pink-500"/> {venueName || '会場'} 搬入事例 Wiki
                    </h3>
                    {isFloristView && (
                        <button 
                            onClick={() => setShowPostModal(true)}
                            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 shadow-md flex items-center transition-colors"
                        >
                            <FiPlus className="mr-1"/> 事例を投稿する
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {pastExamples.length > 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="font-semibold text-gray-700 flex items-center mb-3">
                                <FiClock className="mr-2 text-pink-500"/> 過去の設置・搬入報告 ({pastExamples.length}件)
                            </p>
                            <ul className="pl-0 text-gray-700 space-y-3">
                                {pastExamples.map((example, index) => (
                                    <li key={index} className="text-sm p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                        <p className="font-bold text-base mb-1">{example.title}</p>
                                        <p className="text-gray-700 whitespace-pre-wrap">{example.description}</p>
                                        
                                        {example.imageUrls && example.imageUrls.length > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {example.imageUrls.map((url, i) => (
                                                    <img key={i} src={url} alt={`事例画像${i}`} className="w-12 h-12 object-cover rounded"/>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2 pt-2 border-t border-dashed">
                                            <span className="flex items-center">
                                                <FiUser className="mr-1"/> 
                                                {example.contributor?.platformName || example.contributorId || '匿名提供者'}
                                            </span>
                                            <span className="flex items-center hover:text-pink-600 cursor-pointer">
                                                <FiHeart className="mr-1"/> 
                                                役に立った: {example.helpfulCount || 0}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center">
                            <p className="text-gray-500 text-sm">まだ、この会場の現場事例は登録されていません。</p>
                            {isFloristView && <p className="text-xs text-pink-600 mt-1">あなたが最初の事例を共有しませんか？</p>}
                        </div>
                    )}
                </div>
                
                <p className="text-xs text-right text-gray-400 mt-4">※この情報は、過去のお花屋さんによる現場経験の共有に基づいています。</p>
            </div>
            
            {/* 投稿モーダル */}
            {showPostModal && (
                <VenueLogisticsPostModal
                    venueId={venueId}
                    venueName={venueName}
                    onClose={() => setShowPostModal(false)}
                    onPostSuccess={fetchLogistics} // 投稿後にリストを再取得
                />
            )}
        </>
    );
}