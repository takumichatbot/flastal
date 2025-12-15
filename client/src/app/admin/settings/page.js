// src/app/admin/settings/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiSave, FiAlertTriangle, FiMail, FiPercent, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

export default function AdminSettingsPage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!isAuthenticated || user?.role !== 'ADMIN') return;
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/settings`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!res.ok) throw new Error('設定の取得に失敗しました。');
            setSettings(await res.json());
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
        fetchSettings();
    }, [authLoading, isAuthenticated, user, router, fetchSettings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('設定を保存中...');
        try {
            const token = getAuthToken();
            const payload = {
                // 手数料はパーセンテージ(%)を小数(rate)に変換して送信
                platformFeeRate: settings.platformFeeRate, 
                approvalEmailSubject: settings.approvalEmailSubject,
                approvalEmailBody: settings.approvalEmailBody,
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
            const updatedSettings = await res.json();
            setSettings(updatedSettings);
            toast.success('設定を保存しました。', { id: toastId });

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || authLoading || !settings) {
        return <div className="p-8 text-center">読み込み中...</div>;
    }

    // 小数点表示のヘルパー関数
    const feeDisplay = (settings.platformFeeRate * 100).toFixed(2);
    
    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ システム設定管理</h1>
            
            <form onSubmit={handleSave} className="bg-white p-8 rounded-xl shadow-lg space-y-8">
                
                {/* 1. 手数料設定 */}
                <div className="border p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FiPercent /> 全体手数料設定
                    </h2>
                    <div className="flex items-center gap-4">
                        <label htmlFor="platformFeeRate" className="text-sm font-medium text-gray-700 w-1/3">基本手数料率 (顧客/企画全体)</label>
                        <div className="relative w-2/3">
                            <input 
                                type="number" 
                                name="platformFeeRate" 
                                id="platformFeeRate"
                                value={settings.platformFeeRate}
                                onChange={(e) => setSettings(prev => ({ ...prev, platformFeeRate: parseFloat(e.target.value) || 0 }))}
                                step="0.01" 
                                min="0.00"
                                max="0.99"
                                required
                                className="w-full p-3 border-2 rounded-lg text-lg pr-12 focus:border-pink-500"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">※ 0.10 と入力すると 10% が手数料として徴収されます。花屋に個別設定がない場合に適用されます。</p>
                </div>
                
                {/* 2. メールテンプレート設定 */}
                <div className="border p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FiMail /> メールテンプレート (アカウント承認)
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="approvalEmailSubject" className="block text-sm font-medium text-gray-700">件名</label>
                            <input 
                                type="text" 
                                name="approvalEmailSubject" 
                                id="approvalEmailSubject"
                                value={settings.approvalEmailSubject}
                                onChange={handleChange}
                                required
                                className="w-full mt-1 p-2 border rounded-lg focus:border-pink-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="approvalEmailBody" className="block text-sm font-medium text-gray-700">本文</label>
                            <textarea
                                name="approvalEmailBody" 
                                id="approvalEmailBody"
                                rows="8"
                                value={settings.approvalEmailBody}
                                onChange={handleChange}
                                required
                                className="w-full mt-1 p-2 border rounded-lg focus:border-pink-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">※ プレースホルダー（例: {`{{handleName}}`}）の利用は実装状況によります。</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400"
                    >
                        {isSaving ? <FiRefreshCw className="animate-spin"/> : <FiSave />}
                        設定を保存
                    </button>
                </div>
            </form>
        </div>
    );
}