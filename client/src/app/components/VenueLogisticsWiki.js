// src/app/components/VenueLogisticsWiki.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiAlertTriangle, FiClock, FiMapPin, FiCheckCircle, FiXCircle, FiInfo, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

/**
 * VenueLogisticsWiki コンポーネント
 * 会場IDに基づき、過去の搬入実績やレギュレーション情報を表示する
 * * @param {object} props
 * @param {string} props.venueId - 表示する会場のID
 * @param {string} props.venueName - 表示する会場の名前 (UI表示用)
 * @param {boolean} props.isFloristView - お花屋さんアカウントで閲覧しているか (投稿ボタン表示用)
 */
export default function VenueLogisticsWiki({ venueId, venueName, isFloristView = false }) {
    const [logistics, setLogistics] = useState([]); // 過去事例の配列
    const [loading, setLoading] = useState(true);
    const [showPostModal, setShowPostModal] = useState(false); // 投稿モーダル

    const fetchLogistics = useCallback(async () => {
        if (!venueId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // ★ Webhookで実装した API から会場ロジスティクス情報を取得
            const res = await fetch(`${API_URL}/api/venues/${venueId}/logistics`, {
                 // お花屋さん（または管理者）しかアクセスできない API のため、認証が必要
                 headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')?.replace(/"/g, '')}` }
            });
            
            if (!res.ok) {
                // 403 (権限なし) の場合は、その旨を表示する
                if (res.status === 403) {
                    setLogistics({ status: 'ACCESS_DENIED' });
                } else if (res.status === 404) {
                    setLogistics({ status: 'NO_DATA' });
                } else {
                    throw new Error('会場情報の取得に失敗しました。');
                }
            } else {
                const data = await res.json();
                setLogistics(data); // 過去事例の配列
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
        return <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl flex items-center shadow-sm"><FiAlertTriangle className="mr-2"/> 会場情報が未設定です。</div>;
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
                <p className="text-sm">この会場の過去の搬入事例は、お花屋さんアカウントでのログインが必要です。</p>
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
                    {/* 過去事例のリスト */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-700 flex items-center mb-2">
                            <FiClock className="mr-2 text-pink-500"/> 過去の搬入・設置報告 ({pastExamples.length}件)
                        </p>
                        {pastExamples.length > 0 ? (
                            <ul className="pl-0 text-gray-700 space-y-3">
                                {pastExamples.map((example, index) => (
                                    <li key={index} className="text-sm p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                        <p className="font-bold text-base mb-1">{example.title}</p>
                                        <p className="text-gray-700 whitespace-pre-wrap">{example.description}</p>
                                        
                                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2 pt-2 border-t border-dashed">
                                            <span className="flex items-center">
                                                <FiUser className="mr-1"/> 
                                                {example.contributor?.platformName || example.contributorId || '匿名提供者'}
                                            </span>
                                            <span className="flex items-center">
                                                <FiHeart className="mr-1"/> 
                                                役に立った: {example.helpfulCount || 0}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm">まだ、この会場の現場事例は登録されていません。</p>
                        )}
                    </div>
                </div>
                
                <p className="text-xs text-right text-gray-400 mt-4">※この情報は、過去のお花屋さんによる現場経験の共有に基づいています。</p>
            </div>
            
            {/* 投稿モーダル (省略 - 複雑化を避けるため簡易表示) */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="font-bold text-lg mb-4">事例を投稿する</h3>
                        <p className="text-sm text-gray-700">（投稿フォームのロジックは省略されています）</p>
                        <button onClick={() => setShowPostModal(false)} className="mt-4 px-4 py-2 bg-gray-200 rounded">閉じる</button>
                    </div>
                </div>
            )}
        </>
    );
}