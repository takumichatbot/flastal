'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Loader2, RefreshCw, Info, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ProjectCancelModal({ isOpen, onClose, project, onCancelComplete }) {
    const [actualMaterialCost, setActualMaterialCost] = useState(0);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // キャンセル料のフェーズ判定
    const policyPhase = useMemo(() => {
        if (!project?.deliveryDateTime) return null;
        
        const deliveryDate = new Date(project.deliveryDateTime);
        const now = new Date();
        const diffTime = deliveryDate.getTime() - now.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) return { phase: 1, label: '7日前まで', feeRate: 0, desc: '実費のみ精算' };
        // ※仕様書に「6日前」の記載がないため、ここでは6日前〜4日前を50%と定義しています。
        if (diffDays >= 4 && diffDays <= 6) return { phase: 2, label: '6日前〜4日前', feeRate: 0.5, desc: '総額の50%' };
        return { phase: 3, label: '3日前〜当日', feeRate: 1, desc: '総額の100%（返還なし）' };
    }, [project]);

    // 精算の計算
    const settlement = useMemo(() => {
        const collected = project?.collectedAmount || 0;
        let cost = 0;

        if (policyPhase?.phase === 1) {
            cost = Math.min(actualMaterialCost, collected);
        } else if (policyPhase?.phase === 2) {
            cost = Math.floor(collected * 0.5);
        } else if (policyPhase?.phase === 3) {
            cost = collected;
        }

        const refundTotal = collected - cost;
        return { collected, cost, refundTotal };
    }, [project, actualMaterialCost, policyPhase]);

    const handleCancelSubmit = async () => {
        if (!isConfirmed) return;
        setIsSubmitting(true);
        const toastId = toast.loading('中止および精算処理を実行中...');

        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/projects/${project.id}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ actualMaterialCost })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '処理に失敗しました');

            toast.success('企画を中止し、精算処理を完了しました。', { id: toastId });
            onCancelComplete();
            onClose();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[150] p-4 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh] border border-white"
            >
                <div className="p-6 border-b border-slate-100 bg-rose-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center"><AlertTriangle size={24} /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">企画の中止と精算</h2>
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Cancellation Policy</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm transition-colors"><X size={20}/></button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                    
                    {/* 現在のフェーズ表示 */}
                    {policyPhase && (
                        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold flex items-center gap-2"><Calendar size={16} className="text-amber-400" /> 現在のキャンセル適用期間</p>
                                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-md">{policyPhase.label}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                お届け日（{new Date(project.deliveryDateTime).toLocaleDateString()}）から逆算し、現在は<strong>「{policyPhase.desc}」</strong>がキャンセル料として発生する期間です。
                            </p>
                        </div>
                    )}

                    {/* 実費入力（7日前以前の場合のみ表示） */}
                    {policyPhase?.phase === 1 && (
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                発生した実費（パネル代・デザイン代等）
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">¥</span>
                                <input 
                                    type="number" 
                                    value={actualMaterialCost}
                                    onChange={(e) => setActualMaterialCost(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-800 focus:bg-white focus:border-rose-400 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1">※お花屋さんと相談した「仕入れ済みの実費」のみ入力してください。</p>
                        </div>
                    )}

                    {/* 精算プレビュー */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                            <span>現在の支援総額</span>
                            <span>{settlement.collected.toLocaleString()} pt</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-rose-500">
                            <span>キャンセル料（{policyPhase?.desc}）</span>
                            <span>- {settlement.cost.toLocaleString()} pt</span>
                        </div>
                        <div className="h-px bg-slate-200 my-1" />
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-slate-800">支援者への返還ポイント総額</span>
                            <span className="text-xl font-black text-emerald-500">
                                {settlement.refundTotal.toLocaleString()} <span className="text-xs">pt</span>
                            </span>
                        </div>
                    </div>

                    {/* 同意チェック */}
                    <label className="flex items-start gap-3 p-4 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500" />
                        <span className="text-xs font-bold text-slate-600 leading-relaxed">
                            上記のキャンセルポリシーと精算内容を理解し、企画の中止を実行することに同意します。※返金はすべてFLASTALポイントで行われます。
                        </span>
                    </label>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm">閉じる</button>
                    <button 
                        onClick={handleCancelSubmit} disabled={!isConfirmed || isSubmitting || !policyPhase}
                        className="flex-[2] py-4 bg-rose-500 text-white rounded-xl font-black shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-600 transition-all flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <RefreshCw size={20}/>} 企画を中止して精算する
                    </button>
                </div>
            </motion.div>
        </div>
    );
}