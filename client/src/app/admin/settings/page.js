// src/app/admin/settings/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiMail, FiPercent, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ★ 新しいコンポーネントをインポート
import EmailTemplateManager from '@/components/admin/EmailTemplateManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

export default function AdminSettingsPage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('email'); // デフォルトをメール設定にする
    
    // 全体設定（手数料など）用のState
    const [generalSettings, setGeneralSettings] = useState(null);
    const [loadingGeneral, setLoadingGeneral] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);

    // --- 全体設定の取得ロジック ---
    const fetchGeneralSettings = useCallback(async () => {
        if (!isAuthenticated || user?.role !== 'ADMIN') return;
        setLoadingGeneral(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/settings`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!res.ok) throw new Error('設定の取得に失敗しました。');
            setGeneralSettings(await res.json());
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoadingGeneral(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません。');
            router.push('/admin');
            return;
        }
        // Generalタブが開かれたときにロードしても良いが、初期ロードしておく
        fetchGeneralSettings();
    }, [authLoading, isAuthenticated, user, router, fetchGeneralSettings]);

    // --- 全体設定の保存ロジック ---
    const handleSaveGeneral = async (e) => {
        e.preventDefault();
        setSavingGeneral(true);
        const toastId = toast.loading('設定を保存中...');
        try {
            const token = getAuthToken();
            const payload = {
                platformFeeRate: generalSettings.platformFeeRate,
                // 旧メール設定フィールドは送信しない（またはそのまま維持）
                // approvalEmailSubject: generalSettings.approvalEmailSubject, 
            };

            const res = await fetch(`${API_URL}/api/admin/settings`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || '保存に失敗しました。');
            }
            const updated = await res.json();
            setGeneralSettings(updated);
            toast.success('全体設定を保存しました。', { id: toastId });

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setSavingGeneral(false);
        }
    };

    if (authLoading) return <div className="p-8 text-center">権限確認中...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans text-slate-600">
            <div className="max-w-6xl mx-auto">
                
                {/* ヘッダー */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="p-2 bg-white rounded-full shadow hover:bg-gray-50 text-gray-600 transition-colors">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">システム設定</h1>
                        <p className="text-sm text-gray-500">手数料やメール通知の設定を管理します</p>
                    </div>
                </div>

                {/* タブ切り替え */}
                <div className="flex gap-2 sm:gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('email')}
                        className={`flex items-center px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'email' 
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <FiMail className="mr-2"/> メールテンプレート設定
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'general' 
                            ? 'border-pink-600 text-pink-600 bg-pink-50' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <FiSettings className="mr-2"/> 全体設定 (手数料等)
                    </button>
                </div>

                {/* コンテンツエリア */}
                <div className="animate-fadeIn">
                    
                    {/* --- タブ1: メールテンプレート --- */}
                    {activeTab === 'email' && (
                        <div>
                            <div className="bg-white p-6 rounded-t-xl shadow-sm border border-b-0 border-gray-200">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                    <FiMail className="mr-2 text-indigo-500"/> 通知メールの文面管理
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    システムから自動送信されるメールの件名や本文を編集できます。
                                </p>
                            </div>
                            {/* 新しいコンポーネントを表示 */}
                            <EmailTemplateManager />
                        </div>
                    )}

                    {/* --- タブ2: 全体設定 (手数料) --- */}
                    {activeTab === 'general' && (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                <FiPercent className="mr-2 text-pink-500"/> 手数料・システム設定
                            </h2>
                            
                            {loadingGeneral || !generalSettings ? (
                                <p className="text-center py-10 text-gray-400">読み込み中...</p>
                            ) : (
                                <form onSubmit={handleSaveGeneral} className="space-y-8">
                                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="md:w-1/3">
                                                <label htmlFor="platformFeeRate" className="text-sm font-bold text-gray-700 block">
                                                    基本手数料率
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    全企画に適用されるデフォルトの手数料率です。
                                                </p>
                                            </div>
                                            <div className="md:w-2/3 relative">
                                                <input 
                                                    type="number" 
                                                    name="platformFeeRate" 
                                                    id="platformFeeRate"
                                                    value={generalSettings.platformFeeRate}
                                                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformFeeRate: parseFloat(e.target.value) || 0 }))}
                                                    step="0.01" 
                                                    min="0.00"
                                                    max="0.99"
                                                    required
                                                    className="w-full p-3 border border-gray-300 rounded-lg text-lg pr-12 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                                />
                                                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-right text-gray-400 mt-2">
                                            例: 0.10 = 10%, 0.05 = 5%
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <button 
                                            type="submit" 
                                            disabled={savingGeneral}
                                            className="flex items-center gap-2 px-8 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400 shadow-md"
                                        >
                                            {savingGeneral ? <FiRefreshCw className="animate-spin"/> : <FiSave />}
                                            設定を保存
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}