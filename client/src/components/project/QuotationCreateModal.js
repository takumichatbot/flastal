// src/components/project/QuotationCreateModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, FileText, Send, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function QuotationCreateModal({ projectId, onClose, onSuccess }) {
    const { authenticatedFetch } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 見積もりの明細リスト
    const [items, setItems] = useState([
        { id: 'item-1', itemName: 'フラワースタンド制作費', amount: '' }
    ]);

    // お花屋さんの配送設定を取得して初期セットする
    useEffect(() => {
        const fetchDeliverySettings = async () => {
            try {
                const res = await authenticatedFetch(`${API_URL}/api/florists/me/delivery-settings`);
                if (res.ok) {
                    const settings = await res.json();
                    
                    const newItems = [...items];
                    
                    // 基本配送料が設定されていれば追加
                    if (settings.baseFee > 0) {
                        newItems.push({ id: 'delivery', itemName: `配送料（${settings.baseArea}）`, amount: settings.baseFee });
                    }

                    // 回収費が「別途請求（PAID）」であれば追加
                    if (settings.collectionType === 'PAID' && settings.collectionFee > 0) {
                        newItems.push({ id: 'collection', itemName: 'スタンド回収費', amount: settings.collectionFee });
                    }
                    
                    setItems(newItems);
                }
            } catch (error) {
                console.error("Failed to fetch delivery settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeliverySettings();
    }, [authenticatedFetch]);

    const handleAddItem = () => {
        setItems([...items, { id: Math.random().toString(), itemName: '', amount: '' }]);
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // バリデーション
        const validItems = items.filter(item => item.itemName.trim() !== '' && item.amount !== '');
        if (validItems.length === 0) {
            return toast.error('最低1つの項目と金額を入力してください');
        }

        setIsSubmitting(true);
        const toastId = toast.loading('見積もりを送信中...');

        try {
            const res = await authenticatedFetch(`${API_URL}/api/florists/quotations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    items: validItems
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || '送信に失敗しました');
            }

            toast.success('見積もりを提出しました！', { id: toastId });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-[100] p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white">
                
                <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                            <FileText className="text-sky-500" size={24} /> 見積書の作成・提出
                        </h2>
                        <p className="text-xs font-bold text-slate-500 mt-1">企画者に正式な金額を提示します</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
                </div>
                
                <div className="p-5 md:p-8 overflow-y-auto bg-white flex-1 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-sky-500" size={32}/></div>
                    ) : (
                        <form id="quotationForm" onSubmit={handleSubmit} className="space-y-4">
                            
                            <div className="bg-sky-50 rounded-xl p-4 flex items-start gap-3 border border-sky-100">
                                <Info className="text-sky-500 shrink-0 mt-0.5" size={18} />
                                <div className="text-xs font-medium text-sky-800 leading-relaxed">
                                    <p className="font-bold mb-1">配送料・回収費が自動入力されています</p>
                                    マイページの設定に基づき自動反映しています。エリアや条件（深夜料金など）に応じて金額や項目名を自由に変更してください。
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                                    <div className="flex-[2]">項目名</div>
                                    <div className="flex-1 text-right pr-12">金額 (pt)</div>
                                </div>

                                {items.map((item, index) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <input 
                                            type="text" 
                                            value={item.itemName} 
                                            onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                                            placeholder="例: フラスタ制作費" 
                                            required
                                            className="flex-[2] p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none text-sm font-bold transition-all"
                                        />
                                        <div className="flex-1 relative">
                                            <input 
                                                type="number" 
                                                value={item.amount} 
                                                onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                                                placeholder="0" 
                                                required
                                                className="w-full pl-3 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none text-sm font-black text-right transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">pt</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={items.length === 1}
                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                type="button" 
                                onClick={handleAddItem}
                                className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 text-sm mt-2"
                            >
                                <Plus size={16} /> 項目を追加する
                            </button>

                            <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex justify-between items-center">
                                <span className="font-black text-slate-600">お見積り合計</span>
                                <span className="text-3xl font-black text-slate-800 tracking-tight">
                                    {totalAmount.toLocaleString()} <span className="text-base text-slate-500">pt</span>
                                </span>
                            </div>

                        </form>
                    )}
                </div>

                <div className="p-5 md:p-6 bg-white border-t border-slate-100">
                    <button 
                        type="submit" 
                        form="quotationForm" 
                        disabled={isSubmitting || isLoading} 
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        見積もりを提出する
                    </button>
                </div>

            </motion.div>
        </div>
    );
}