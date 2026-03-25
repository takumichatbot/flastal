'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
    X, Save, Award, RefreshCw, Percent, 
    CheckCircle2, AlertTriangle, TrendingUp, Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

function cn(...classes) { return classes.filter(Boolean).join(' '); }

export default function FloristFeeModal({ floristId, onClose, onFeeUpdated }) {
    const [florist, setFlorist] = useState(null);
    const [platformFeeRate, setPlatformFeeRate] = useState(0.10); 
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [useCustomRate, setUseCustomRate] = useState(false); 
    const [inputRate, setInputRate] = useState(''); 

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const [floristRes, settingsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/florists/${floristId}/fee`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!floristRes.ok) throw new Error('花屋データの取得に失敗しました。');
            
            const floristData = await floristRes.json();
            const settingsData = settingsRes.ok ? await settingsRes.json() : {};

            setFlorist(floristData);
            setPlatformFeeRate(settingsData.platformFeeRate || 0.10);

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

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('設定を保存中...');

        try {
            let newRate = null; 
            if (useCustomRate) {
                const rateFloat = parseFloat(inputRate);
                if (isNaN(rateFloat) || rateFloat < 0 || rateFloat > 100) throw new Error('手数料率は0%から100%の間で設定してください。');
                newRate = rateFloat / 100; 
            }

            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/florists/${floristId}/fee`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ customFeeRate: newRate })
            });

            if (!res.ok) throw new Error('更新に失敗しました。');

            toast.success('手数料設定を更新しました。', { id: toastId });
            onFeeUpdated(); 
            onClose();

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const globalRatePercent = (platformFeeRate * 100).toFixed(1).replace(/\.0$/, '');
    const effectiveRatePercent = useCustomRate ? (parseFloat(inputRate) || 0) : parseFloat(globalRatePercent);
    const simulationAmount = 50000;
    const simulationFee = Math.floor(simulationAmount * (effectiveRatePercent / 100));

    if (loading) return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Loader2 className="animate-spin text-pink-500 size-12"/>
        </div>
    );
    if (!florist) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh] border border-white">
                
                <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-xl text-slate-800 flex items-center gap-2 tracking-tighter">
                            <Award className="text-pink-500" /> 手数料の個別設定
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Target: {florist.platformName || florist.shopName || florist.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white shadow-sm hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">適用するルールを選択</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div onClick={() => setUseCustomRate(false)} className={cn("cursor-pointer border-2 rounded-[1.5rem] p-5 transition-all relative overflow-hidden group", !useCustomRate ? 'border-sky-400 bg-sky-50 shadow-md' : 'border-slate-100 bg-white hover:bg-slate-50')}>
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", !useCustomRate ? 'text-sky-600' : 'text-slate-400')}>全体設定</span>
                                    {!useCustomRate && <CheckCircle2 size={16} className="text-sky-500" />}
                                </div>
                                <div className="text-3xl font-black text-slate-800 tracking-tighter relative z-10">{globalRatePercent}<span className="text-sm font-bold text-slate-400 ml-1">%</span></div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 relative z-10">システム標準レート</p>
                                {!useCustomRate && <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-sky-200/50 rounded-full blur-xl z-0"></div>}
                            </div>

                            <div onClick={() => setUseCustomRate(true)} className={cn("cursor-pointer border-2 rounded-[1.5rem] p-5 transition-all relative overflow-hidden group", useCustomRate ? 'border-pink-400 bg-pink-50 shadow-md' : 'border-slate-100 bg-white hover:bg-slate-50')}>
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", useCustomRate ? 'text-pink-600' : 'text-slate-400')}>個別設定</span>
                                    {useCustomRate && <CheckCircle2 size={16} className="text-pink-500" />}
                                </div>
                                <div className="flex items-baseline relative z-10">
                                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{inputRate || '---'}</span>
                                    <span className="text-sm font-bold text-slate-400 ml-1">%</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 relative z-10">この花屋専用の特別レート</p>
                                {useCustomRate && <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-pink-200/50 rounded-full blur-xl z-0"></div>}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {useCustomRate && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">特別手数料率を指定 (%)</label>
                                <div className="relative">
                                    <input type="number" value={inputRate} onChange={(e) => setInputRate(e.target.value)} step="0.1" min="0" max="100" placeholder="例: 5.0" autoFocus
                                        className="w-full p-4 pl-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-black text-slate-800 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all"
                                    />
                                    <Percent className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 size-5" />
                                </div>
                                {parseFloat(inputRate) > 30 && <p className="text-amber-500 text-[10px] font-black mt-2 flex items-center gap-1 uppercase tracking-widest"><AlertTriangle size={12}/> 標準よりかなり高い設定です</p>}
                                {parseFloat(inputRate) === 0 && <p className="text-emerald-500 text-[10px] font-black mt-2 flex items-center gap-1 uppercase tracking-widest"><CheckCircle2 size={12}/> 手数料無料設定になります</p>}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 shadow-inner">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                            <TrendingUp size={14} className="text-sky-500" /> 収益シミュレーション
                        </h4>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-600">売上 50,000円 の場合</span>
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">徴収する手数料</span>
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                    ¥{simulationFee.toLocaleString()} 
                                    <span className="text-xs font-bold text-slate-400 ml-1">({effectiveRatePercent}%)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-4 text-sm font-black text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-colors shadow-sm">
                        キャンセル
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={isSaving}
                        className={cn("px-8 py-4 text-sm font-black text-white rounded-full flex items-center gap-2 shadow-lg transition-all", isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-pink-600')}
                    >
                        {isSaving ? <Loader2 className="animate-spin size-4"/> : <Save size={16}/>}
                        {useCustomRate ? '個別設定を保存' : '全体設定に戻す'}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}