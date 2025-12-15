// src/app/admin/florists/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { FiAward, FiDollarSign, FiEdit, FiRefreshCw } from 'react-icons/fi';
import FloristFeeModal from '../components/FloristFeeModal'; // ★ モーダルをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

export default function AdminFloristsPage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [florists, setFlorists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [targetFloristId, setTargetFloristId] = useState(null); // モーダル表示用
    
    // データ取得関数
    const fetchFlorists = useCallback(async () => {
        if (!isAuthenticated || user?.role !== 'ADMIN') return;
        setLoading(true);
        try {
            const token = getAuthToken();
            // ★ バックエンドにすべての花屋リストを取得するAPIが必要です
            // (例: /api/admin/florists/all)
            const res = await fetch(`${API_URL}/api/admin/florists/all`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!res.ok) throw new Error('花屋リストの取得に失敗しました。');
            
            // ★ customFeeRate が含まれる状態でリストを取得できることを想定
            setFlorists(await res.json());
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません。');
            router.push('/admin');
            return;
        }
        fetchFlorists();
    }, [authLoading, isAuthenticated, user, router, fetchFlorists]);

    // モーダルを閉じる/更新するハンドラ
    const handleFeeUpdated = () => {
        setTargetFloristId(null);
        fetchFlorists(); // リストを再取得して最新の手数料を反映
    };
    
    // ロード中UI
    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <FiRefreshCw className="animate-spin w-8 h-8 text-pink-500" />
            </div>
        );
    }
    
    if (!isAuthenticated || user?.role !== 'ADMIN') return null;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <FiAward className="text-pink-500"/> お花屋さん管理・手数料設定
                </h1>
                <button onClick={fetchFlorists} disabled={loading} className="flex items-center gap-2 text-sm text-pink-600 font-semibold hover:underline">
                    <FiRefreshCw className={loading ? "animate-spin" : ""}/>
                    リスト更新
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">花屋ID / プラットフォーム名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">承認ステータス</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">個別手数料率</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {florists.map((florist) => (
                            <tr key={florist.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <span className="block">{florist.platformName}</span>
                                    <span className="text-xs text-gray-500">{florist.id}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{florist.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        florist.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {florist.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                    {florist.customFeeRate !== null ? (
                                        <span className="text-pink-600 flex items-center">
                                            {(florist.customFeeRate * 100).toFixed(2)}% <FiDollarSign size={14} className="ml-1"/>
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 italic">全体設定を使用</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => setTargetFloristId(florist.id)}
                                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1"
                                    >
                                        <FiEdit size={14}/> 手数料設定
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* モーダル表示 */}
            {targetFloristId && (
                <FloristFeeModal 
                    floristId={targetFloristId} 
                    onClose={() => setTargetFloristId(null)} 
                    onFeeUpdated={handleFeeUpdated}
                />
            )}
        </div>
    );
}