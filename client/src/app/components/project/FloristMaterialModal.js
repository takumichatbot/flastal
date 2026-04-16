'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Loader2, Save, FileText, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristMaterialModal({ isOpen, onClose, project, onUpdate }) {
    const [materialCost, setMaterialCost] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // モーダルを開いた時に、既存のデータをセットする
    useEffect(() => {
        if (isOpen && project) {
            setMaterialCost(project.materialCost?.toString() || '');
            setMaterialDescription(project.materialDescription || '');
        }
    }, [isOpen, project]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading('実費情報を保存中...');

        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/projects/${project.id}/material-cost`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    materialCost: parseInt(materialCost, 10) || 0,
                    materialDescription: materialDescription.trim()
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || '保存に失敗しました');
            }

            toast.success('実費情報を更新しました', { id: toastId });
            onUpdate(); // 親コンポーネントのデータを再取得
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
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] border border-white"
            >
                {/* ヘッダー */}
                <div className="p-6 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">実費・コストの入力</h2>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Material Cost</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* フォーム部分 */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                        
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-sm text-amber-800">
                            <Info size={20} className="shrink-0 text-amber-500 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold">万が一、企画が中止になった際の精算用データです。</p>
                                <p className="text-xs text-amber-700/80">現在までに発生している仕入れ代金や作業費を入力しておくと、中止時にこの金額が優先して支払われます。こまめな更新をおすすめします。</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                現在発生している実費総額 (pt/円)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">¥</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={materialCost}
                                    onChange={(e) => setMaterialCost(e.target.value)}
                                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FileText size={16} />
                                内訳・備考（任意）
                            </label>
                            <textarea 
                                rows="4"
                                value={materialDescription}
                                onChange={(e) => setMaterialDescription(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-sm text-slate-700 focus:bg-white focus:border-amber-400 outline-none transition-all resize-none leading-relaxed"
                                placeholder="例：特殊なバルーンの発注代（15,000円）、特注パネルの印刷代（8,000円）など"
                            />
                        </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 mt-auto">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            キャンセル
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-3.5 bg-amber-500 text-white rounded-xl font-black shadow-lg shadow-amber-500/20 disabled:opacity-50 hover:bg-amber-600 transition-all flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                            実費情報を保存する
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}