// src/app/admin/components/FloristFeeModal.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
    FiX, FiSave, FiAward, FiRefreshCw, FiPercent, 
    FiCheckCircle, FiAlertTriangle, FiToggleLeft, FiToggleRight, FiTrendingUp 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

export default function FloristFeeModal({ floristId, onClose, onFeeUpdated }) {
    const [florist, setFlorist] = useState(null);
    const [platformFeeRate, setPlatformFeeRate] = useState(0.10); // デフォルト10%
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // フォーム状態
    const [useCustomRate, setUseCustomRate] = useState(false); // 個別設定を使うか？
    const [inputRate, setInputRate] = useState(''); // 入力値 (0-100)

    // データ取得
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            
            // 並列取得で高速化
            const [floristRes, settingsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/florists/${floristId}/fee`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!floristRes.ok) throw new Error('花屋データの取得に失敗しました。');
            
            const floristData = await floristRes.json();
            const settingsData = settingsRes.ok ? await settingsRes.json() : {};

            setFlorist(floristData);
            setPlatformFeeRate(settingsData.platformFeeRate || 0.10);

            // 初期状態のセット
            if (floristData.customFeeRate !== null) {
                setUseCustomRate(true);
                setInputRate((floristData.customFeeRate * 100).toFixed(1).replace(/\.0$/, ''));
            } else {
                setUseCustomRate(false);
                setInputRate('');
            }

        } catch (error) {
            toast.error(error.message);
            onClose();
        } finally {
            setLoading(false);
        }
    }, [floristId, onClose]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 保存処理
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('設定を保存中...');

        try {
            let newRate = null; // nullなら全体設定に戻る

            if (useCustomRate) {
                const rateFloat = parseFloat(inputRate);
                if (isNaN(rateFloat) || rateFloat < 0 || rateFloat > 100) {
                    throw new Error('手数料率は0%から100%の間で設定してください。');
                }
                newRate = rateFloat / 100; // %を小数に変換
            }

            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/florists/${floristId}/fee`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ customFeeRate: newRate })
            });

            if (!res.ok) throw new Error('更新に失敗しました。');

            toast.success('手数料設定を更新しました。', { id: toastId });
            onFeeUpdated(); // 親コンポーネントへ通知
            onClose();

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    // 計算ロジック
    const globalRatePercent = (platformFeeRate * 100).toFixed(1).replace(/\.0$/, '');
    
    // 表示上の現在適用レート
    const effectiveRatePercent = useCustomRate 
        ? (parseFloat(inputRate) || 0) 
        : parseFloat(globalRatePercent);

    // シミュレーション用: 5万円の売り上げがあった場合の手数料
    const simulationAmount = 50000;
    const simulationFee = Math.floor(simulationAmount * (effectiveRatePercent / 100));

    if (loading) return <LoadingSpinner />;
    if (!florist) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* ヘッダー */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <FiAward className="text-pink-500" /> 手数料設定の変更
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">対象: {florist.platformName || florist.shopName || florist.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <FiX size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* 1. 設定モード選択 (トグル) */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 block">適用するルールを選択</label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* 全体設定モード */}
                            <div 
                                onClick={() => setUseCustomRate(false)}
                                className={`cursor-pointer border-2 rounded-xl p-4 transition-all relative ${!useCustomRate ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold ${!useCustomRate ? 'text-blue-700' : 'text-slate-600'}`}>全体設定</span>
                                    {!useCustomRate && <FiCheckCircle className="text-blue-500" />}
                                </div>
                                <div className="text-2xl font-bold text-slate-800">{globalRatePercent}<span className="text-sm font-normal text-slate-500 ml-1">%</span></div>
                                <p className="text-xs text-slate-500 mt-1">システム全体の標準レート</p>
                            </div>

                            {/* 個別設定モード */}
                            <div 
                                onClick={() => setUseCustomRate(true)}
                                className={`cursor-pointer border-2 rounded-xl p-4 transition-all relative ${useCustomRate ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold ${useCustomRate ? 'text-pink-700' : 'text-slate-600'}`}>個別設定</span>
                                    {useCustomRate && <FiCheckCircle className="text-pink-500" />}
                                </div>
                                <div className="flex items-baseline">
                                    <span className="text-2xl font-bold text-slate-800">
                                        {inputRate || '---'}
                                    </span>
                                    <span className="text-sm font-normal text-slate-500 ml-1">%</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">この花屋だけの特別レート</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. 数値入力エリア (個別設定時のみ表示) [Image of slide down animation] */}
                    {useCustomRate && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                特別手数料率を指定 (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={inputRate}
                                    onChange={(e) => setInputRate(e.target.value)}
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="例: 5.0"
                                    autoFocus
                                    className="w-full p-3 pl-4 border-2 border-pink-200 rounded-lg text-lg focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                />
                                <FiPercent className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            </div>

                            {/* 警告メッセージ */}
                            {parseFloat(inputRate) > 30 && (
                                <p className="text-amber-600 text-xs mt-2 flex items-center">
                                    <FiAlertTriangle className="mr-1"/> 注意: 標準よりかなり高い設定です
                                </p>
                            )}
                            {parseFloat(inputRate) === 0 && (
                                <p className="text-green-600 text-xs mt-2 flex items-center">
                                    <FiCheckCircle className="mr-1"/> 手数料無料設定になります
                                </p>
                            )}
                        </div>
                    )}

                    {/* 3. シミュレーション表示 */}
                    <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                            <FiTrendingUp className="mr-1" /> 収益シミュレーション
                        </h4>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">売上 50,000円 の場合</span>
                            <div className="text-right">
                                <span className="block text-xs text-slate-400">徴収する手数料</span>
                                <span className="text-lg font-bold text-slate-800">
                                    ¥{simulationFee.toLocaleString()} 
                                    <span className="text-xs font-normal text-slate-500 ml-1">({effectiveRatePercent}%)</span>
                                </span>
                            </div>
                        </div>
                    </div>

                </form>

                {/* フッター */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`
                            px-6 py-2.5 text-sm font-bold text-white rounded-lg flex items-center gap-2 shadow-lg transition-all
                            ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:shadow-pink-500/30'}
                        `}
                    >
                        {isSaving ? <FiRefreshCw className="animate-spin"/> : <FiSave />}
                        {useCustomRate ? '個別設定を保存' : '全体設定に戻す'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ローディング用サブコンポーネント
function LoadingSpinner() {
    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-700 font-bold">データを読み込み中...</span>
            </div>
        </div>
    );
}