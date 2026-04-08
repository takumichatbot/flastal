'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Truck, MapPin, Plus, Trash2, Save, AlertCircle, 
    Info, Package, Clock, RefreshCw
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function FloristDeliverySettings() {
    const { user, isAuthenticated, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // --- フォームステート ---
    const [baseArea, setBaseArea] = useState('東京都23区内');
    const [baseFee, setBaseFee] = useState(3000);
    const [collectionType, setCollectionType] = useState('INCLUDED'); 
    const [collectionFee, setCollectionFee] = useState(2000); 
    const [areaFees, setAreaFees] = useState([]);
    const [conditionFees, setConditionFees] = useState([]);

    // --- 初期データの取得 ---
    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'FLORIST') return;

        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
                const res = await fetch(`${API_URL}/api/florists/me/delivery-settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBaseArea(data.baseArea || '東京都23区内');
                    setBaseFee(data.baseFee ?? 3000);
                    setCollectionType(data.collectionType || 'INCLUDED');
                    setCollectionFee(data.collectionFee ?? 0);
                    setAreaFees(data.areaFees || []);
                    setConditionFees(data.conditionFees || []);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast.error('設定の読み込みに失敗しました');
            } finally {
                setIsFetching(false);
            }
        };

        fetchSettings();
    }, [isAuthenticated, user, loading]);

    // --- リスト操作 ---
    const addAreaFee = () => setAreaFees([...areaFees, { id: generateId(), areaName: '', extraFee: 0 }]);
    const updateAreaFee = (id, field, value) => setAreaFees(areaFees.map(a => a.id === id ? { ...a, [field]: value } : a));
    const removeAreaFee = (id) => setAreaFees(areaFees.filter(a => a.id !== id));

    const addConditionFee = () => setConditionFees([...conditionFees, { id: generateId(), conditionName: '', extraFee: 0 }]);
    const updateConditionFee = (id, field, value) => setConditionFees(conditionFees.map(c => c.id === id ? { ...c, [field]: value } : c));
    const removeConditionFee = (id) => setConditionFees(conditionFees.filter(c => c.id !== id));

    // --- 保存処理 ---
    const handleSave = async () => {
        setIsLoading(true);
        const toastId = toast.loading('設定を保存しています...');
        
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const payload = {
                baseArea, baseFee, collectionType, 
                collectionFee: collectionType === 'PAID' ? collectionFee : 0,
                areaFees, conditionFees
            };

            const res = await fetch(`${API_URL}/api/florists/me/delivery-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('保存エラー');
            
            toast.success('配送料金の設定を保存しました！', { id: toastId });
        } catch (error) {
            toast.error('保存に失敗しました', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching || loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-sky-500" /></div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Truck className="text-sky-500" size={28} />
                    配送料金・回収費の設定
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                    フラスタの配達や回収にかかる基本料金と、エリアや条件に応じた追加料金を設定できます。<br/>
                    ここで設定した内容は、ユーザーが注文する際の見積もりに自動的に反映されます。
                </p>
            </div>

            <div className="space-y-8">
                
                {/* === 1. 基本設定セクション === */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200"
                >
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <MapPin className="text-sky-500" size={20} /> 基本配送エリアと料金
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">基本配送エリア</label>
                            <input 
                                type="text" 
                                value={baseArea}
                                onChange={(e) => setBaseArea(e.target.value)}
                                placeholder="例: 東京都23区内"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                            />
                            <p className="text-xs text-slate-400 mt-1">追加料金なしで配達できるメインのエリアです。</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">基本配送料（円）</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={baseFee}
                                    onChange={(e) => setBaseFee(Number(e.target.value))}
                                    className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono text-lg"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">円</span>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-4">
                            <label className="block text-sm font-bold text-slate-700 mb-3">イベント終了後のフラスタ回収費</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${collectionType === 'INCLUDED' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-200 bg-white'}`}>
                                    <input type="radio" name="collectionType" value="INCLUDED" checked={collectionType === 'INCLUDED'} onChange={() => setCollectionType('INCLUDED')} className="sr-only" />
                                    <span className="font-bold text-slate-700 mb-1">配送料に含む</span>
                                    <span className="text-xs text-slate-500">（追加請求なし）</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${collectionType === 'FREE' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-200 bg-white'}`}>
                                    <input type="radio" name="collectionType" value="FREE" checked={collectionType === 'FREE'} onChange={() => setCollectionType('FREE')} className="sr-only" />
                                    <span className="font-bold text-slate-700 mb-1">完全無料</span>
                                    <span className="text-xs text-slate-500">（送料・回収ともに無料）</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${collectionType === 'PAID' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-200 bg-white'}`}>
                                    <input type="radio" name="collectionType" value="PAID" checked={collectionType === 'PAID'} onChange={() => setCollectionType('PAID')} className="sr-only" />
                                    <span className="font-bold text-slate-700 mb-1">別途請求する</span>
                                    <span className="text-xs text-slate-500">（金額を指定）</span>
                                </label>
                            </div>
                            
                            {collectionType === 'PAID' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">回収費（円）</label>
                                    <div className="relative max-w-xs">
                                        <input 
                                            type="number" 
                                            value={collectionFee}
                                            onChange={(e) => setCollectionFee(Number(e.target.value))}
                                            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">円</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* === 2. エリア別追加料金セクション === */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200"
                >
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="text-rose-500" size={20} /> エリア別追加料金
                        </h2>
                        <button 
                            onClick={addAreaFee}
                            className="flex items-center gap-1 text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
                        >
                            <Plus size={16} /> 追加する
                        </button>
                    </div>

                    <div className="space-y-3">
                        {areaFees.length === 0 ? (
                            <p className="text-center text-slate-400 py-6 text-sm font-medium">追加料金の発生するエリアはありません</p>
                        ) : (
                            areaFees.map((area, index) => (
                                <div key={area.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div className="flex-1 w-full">
                                        <input 
                                            type="text" placeholder="例: 神奈川県（横浜・川崎）"
                                            value={area.areaName} onChange={(e) => updateAreaFee(area.id, 'areaName', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <span className="text-slate-500 font-bold">+</span>
                                        <input 
                                            type="number" placeholder="金額"
                                            value={area.extraFee} onChange={(e) => updateAreaFee(area.id, 'extraFee', Number(e.target.value))}
                                            className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm text-right"
                                        />
                                        <span className="text-slate-500 text-sm font-bold mr-2">円</span>
                                        <button onClick={() => removeAreaFee(area.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* === 3. サイズ・条件別追加料金セクション === */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200"
                >
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Package className="text-amber-500" size={20} /> サイズ・条件別の追加料金
                        </h2>
                        <button 
                            onClick={addConditionFee}
                            className="flex items-center gap-1 text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
                        >
                            <Plus size={16} /> 追加する
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {conditionFees.length === 0 ? (
                            <p className="text-center text-slate-400 py-6 text-sm font-medium">条件別の追加料金はありません</p>
                        ) : (
                            conditionFees.map((cond, index) => (
                                <div key={cond.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div className="flex-1 w-full">
                                        <input 
                                            type="text" placeholder="例: 2段フラスタ以上（大型運搬）"
                                            value={cond.conditionName} onChange={(e) => updateConditionFee(cond.id, 'conditionName', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <span className="text-slate-500 font-bold">+</span>
                                        <input 
                                            type="number" placeholder="金額"
                                            value={cond.extraFee} onChange={(e) => updateConditionFee(cond.id, 'extraFee', Number(e.target.value))}
                                            className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm text-right"
                                        />
                                        <span className="text-slate-500 text-sm font-bold mr-2">円</span>
                                        <button onClick={() => removeConditionFee(cond.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

            </div>

            {/* === 保存ボタン === */}
            <div className="mt-8 flex justify-center sticky bottom-8 z-10">
                <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? <RefreshCw className="animate-spin" size={24} /> : <Save size={24} />}
                    {isLoading ? '保存中...' : 'この設定で保存する'}
                </button>
            </div>

        </div>
    );
}