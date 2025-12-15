// src/app/admin/components/FloristFeeModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiSave, FiAward, FiRefreshCw, FiPercent } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

export default function FloristFeeModal({ floristId, onClose, onFeeUpdated }) {
    const [florist, setFlorist] = useState(null);
    const [customFeeRate, setCustomFeeRate] = useState(''); // 表示用はパーセンテージ
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // 全体設定（例: 10%）はバックエンドから取得するが、ここでは仮置き
    const [platformFeeRate, setPlatformFeeRate] = useState(null); 

    const fetchFloristData = useCallback(async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            
            // 1. 花屋の個別設定を取得
            const floristRes = await fetch(`${API_URL}/api/admin/florists/${floristId}/fee`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!floristRes.ok) throw new Error('花屋データの取得に失敗しました。');
            const floristData = await floristRes.json();
            setFlorist(floristData);

            // 2. 全体手数料率を取得 (参考情報として)
            const settingsRes = await fetch(`${API_URL}/api/admin/settings`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const settingsData = settingsRes.ok ? await settingsRes.json() : {};
            setPlatformFeeRate(settingsData.platformFeeRate || 0.10); // 失敗時はデフォルト 0.10

            // customFeeRate (小数) をパーセンテージ文字列に変換してセット
            if (floristData.customFeeRate !== null) {
                setCustomFeeRate((floristData.customFeeRate * 100).toFixed(2));
            } else {
                setCustomFeeRate(''); // 個別設定がない場合は空欄
            }

        } catch (error) {
            toast.error(error.message);
            onClose();
        } finally {
            setLoading(false);
        }
    }, [floristId, onClose]);

    useEffect(() => {
        fetchFloristData();
    }, [fetchFloristData]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('設定を保存中...');
        
        let newRate = null;
        if (customFeeRate !== '') {
            const rateFloat = parseFloat(customFeeRate) / 100; // %を小数に変換
            if (isNaN(rateFloat) || rateFloat < 0 || rateFloat > 1) {
                toast.error('手数料率は0%から100%の間で設定してください。', { id: toastId });
                setIsSaving(false);
                return;
            }
            newRate = rateFloat;
        }

        try {
            const token = getAuthToken();
            
            const res = await fetch(`${API_URL}/api/admin/florists/${floristId}/fee`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ customFeeRate: newRate })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || '個別手数料の更新に失敗しました。');
            }

            toast.success('個別手数料を更新しました。', { id: toastId });
            onFeeUpdated();
            onClose();

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isUsingCustom = florist?.customFeeRate !== null;
    const effectiveFee = isUsingCustom 
        ? florist.customFeeRate 
        : platformFeeRate;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-8 shadow-2xl flex items-center gap-3">
                    <FiRefreshCw className="animate-spin" /> 読み込み中...
                </div>
            </div>
        );
    }
    
    if (!florist) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <FiX size={20} />
                </button>
                
                <form onSubmit={handleSave} className="p-6 space-y-5">
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2 border-b pb-3">
                        <FiAward /> {florist.platformName || '花屋'} の個別手数料設定
                    </h3>
                    
                    {/* 現在の有効な手数料 */}
                    <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                        <p className="text-sm font-bold text-sky-800 mb-1">現在の有効手数料率</p>
                        <p className="text-3xl font-extrabold text-sky-600">
                            {(effectiveFee * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs text-sky-700 mt-2">
                           {isUsingCustom ? '※ この花屋に設定された個別料金' : `※ 全体設定料金（${(platformFeeRate * 100).toFixed(2)}%）を使用`}
                        </p>
                    </div>

                    {/* 個別手数料入力 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            個別手数料率 (%) <span className="text-xs font-normal text-gray-500">(空欄で全体設定に戻ります)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={customFeeRate}
                                onChange={(e) => setCustomFeeRate(e.target.value)}
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder={(platformFeeRate * 100).toFixed(2)} // 全体手数料をプレースホルダーに
                                className="w-full p-3 border-2 rounded-lg text-lg pr-12 focus:border-pink-500"
                            />
                            <FiPercent className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                            キャンセル
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="px-4 py-2 bg-pink-500 text-white text-sm font-bold rounded-lg hover:bg-pink-600 disabled:opacity-50 flex items-center gap-1"
                        >
                            {isSaving ? <FiRefreshCw className="animate-spin"/> : <FiSave />}
                            設定を保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}