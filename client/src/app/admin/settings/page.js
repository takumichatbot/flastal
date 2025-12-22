// src/app/admin/settings/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiMail, FiPercent, FiRefreshCw, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// メールテンプレート管理コンポーネント (別ファイルに切り出すことを推奨しますが、ここでは同一ファイル内に記述またはインポート想定)
// import EmailTemplateManager from '@/components/admin/EmailTemplateManager'; 

// 簡易的なEmailTemplateManagerのモック (実際は components/admin/EmailTemplateManager.js に作成推奨)
const EmailTemplateManager = () => (
    <div className="bg-white p-8 rounded-b-xl shadow-sm border border-gray-200 border-t-0 text-center py-20">
        <FiMail className="mx-auto text-4xl text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-700">メールテンプレート管理機能</h3>
        <p className="text-gray-500 mb-4">承認メールや却下メールの文面をここで編集できます。</p>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            テンプレートエディタを開く
        </button>
    </div>
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

export default function AdminSettingsPage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('general'); // 初期タブ: general (手数料)
    
    // 全体設定（手数料など）
    const [generalSettings, setGeneralSettings] = useState(null);
    const [loadingGeneral, setLoadingGeneral] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);
    
    // 手数料率の表示用ステート (例: 10)
    const [displayFeeRate, setDisplayFeeRate] = useState(''); 

    // --- 全体設定の取得 ---
    const fetchGeneralSettings = useCallback(async () => {
        if (!isAuthenticated || user?.role !== 'ADMIN') return;
        setLoadingGeneral(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/settings`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            
            if (!res.ok) throw new Error('設定データの取得に失敗しました');
            
            const data = await res.json();
            setGeneralSettings(data);
            
            // DB値(例: 0.1) を 表示用(例: 10) に変換
            if (data.platformFeeRate !== undefined) {
                setDisplayFeeRate((data.platformFeeRate * 100).toFixed(1).replace(/\.0$/, ''));
            } else {
                setDisplayFeeRate('10'); // デフォルト
            }

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
        fetchGeneralSettings();
    }, [authLoading, isAuthenticated, user, router, fetchGeneralSettings]);

    // --- 全体設定の保存 ---
    const handleSaveGeneral = async (e) => {
        e.preventDefault();
        
        // バリデーション
        const rateFloat = parseFloat(displayFeeRate);
        if (isNaN(rateFloat) || rateFloat < 0 || rateFloat > 100) {
            toast.error('手数料率は 0% ～ 100% の間で設定してください');
            return;
        }

        setSavingGeneral(true);
        const toastId = toast.loading('設定を保存中...');

        try {
            const token = getAuthToken();
            const payload = {
                // 表示用(10) を DB値(0.1) に変換して送信
                platformFeeRate: rateFloat / 100,
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
                throw new Error(data.message || '保存に失敗しました');
            }
            
            const updated = await res.json();
            setGeneralSettings(updated);
            toast.success('全体設定を保存しました', { id: toastId });

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setSavingGeneral(false);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><FiRefreshCw className="animate-spin text-3xl text-gray-400"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-700">
            <div className="max-w-5xl mx-auto">
                
                {/* ヘッダー */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiSettings className="text-gray-600"/> システム設定
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">プラットフォーム全体の手数料率や、自動送信メールの管理を行います。</p>
                    </div>
                </div>

                {/* タブナビゲーション */}
                <div className="flex gap-2 mb-0 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-all border-b-0 relative top-[1px] z-10 ${
                        activeTab === 'general' 
                            ? 'bg-white text-pink-600 border border-gray-200 shadow-sm' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent'
                        }`}
                    >
                        <FiPercent /> 手数料・基本設定
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('email')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-all border-b-0 relative top-[1px] z-10 ${
                        activeTab === 'email' 
                            ? 'bg-white text-indigo-600 border border-gray-200 shadow-sm' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent'
                        }`}
                    >
                        <FiMail /> メールテンプレート
                    </button>
                </div>

                {/* --- タブ1: 全体設定 (手数料) --- */}
                {activeTab === 'general' && (
                    <div className="bg-white p-8 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                                <FiPercent size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">手数料設定</h2>
                                <p className="text-xs text-gray-500">この設定は、個別に手数料が設定されていないすべての花屋に適用されます。</p>
                            </div>
                        </div>
                        
                        {loadingGeneral || !generalSettings ? (
                            <div className="py-20 text-center text-gray-400">読み込み中...</div>
                        ) : (
                            <form onSubmit={handleSaveGeneral} className="max-w-2xl">
                                <div className="space-y-6">
                                    {/* 手数料率入力 */}
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <label htmlFor="platformFeeRate" className="block text-sm font-bold text-gray-700 mb-2">
                                            基本プラットフォーム手数料率
                                        </label>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-40">
                                                <input 
                                                    type="number" 
                                                    id="platformFeeRate"
                                                    value={displayFeeRate}
                                                    onChange={(e) => setDisplayFeeRate(e.target.value)}
                                                    step="0.1" 
                                                    min="0"
                                                    max="100"
                                                    required
                                                    className="w-full p-3 border border-gray-300 rounded-lg text-2xl font-bold text-right pr-10 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all"
                                                />
                                                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">%</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                <p>売上に対するパーセンテージ。</p>
                                                <p className="text-xs text-gray-400 mt-1">※ 10%の場合、100,000円の売上で10,000円の手数料</p>
                                            </div>
                                        </div>

                                        {parseFloat(displayFeeRate) > 30 && (
                                            <div className="mt-4 flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm">
                                                <FiAlertTriangle className="mt-0.5 shrink-0"/>
                                                <p>注意: 手数料率が30%を超えています。これは一般的な市場価格よりかなり高い設定です。</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={savingGeneral}
                                        className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingGeneral ? <FiRefreshCw className="animate-spin"/> : <FiSave />}
                                        設定を保存する
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* --- タブ2: メールテンプレート --- */}
                {activeTab === 'email' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white p-6 rounded-tr-xl border border-gray-200 border-b-0 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <FiMail className="text-indigo-500"/> メールテンプレート管理
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    システムから自動送信される通知メールの件名や本文を編集します。
                                </p>
                            </div>
                        </div>
                        {/* テンプレートマネージャー (実際は別ファイル推奨) */}
                        <EmailTemplateManager />
                    </div>
                )}
            </div>
        </div>
    );
}