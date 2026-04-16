'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Truck, ArrowLeft, Save, Loader2, MapPin, 
    Clock, PackageCheck, AlertCircle, Plus, Trash2, Undo2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// 東京23区や主要エリアのプリセット
const PRESET_AREAS = [
    '東京23区内', '東京都下（23区外）', '神奈川県（横浜市・川崎市）', 
    '神奈川県（その他）', '埼玉県', '千葉県'
];

export default function FloristDeliverySettings() {
    const { user, authenticatedFetch, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- フォーム状態 ---
    // 1. 基本設定
    const [baseRecoveryFee, setBaseRecoveryFee] = useState(0); // 基本回収費
    const [lateNightFee, setLateNightFee] = useState(0); // 深夜早朝割増料金
    // 2. エリア別配送料金 [{ areaName: '東京23区', fee: 0 }, ...]
    const [deliveryAreas, setDeliveryAreas] = useState([]); 
    // 3. その他オプション
    const [acceptsGoods, setAcceptsGoods] = useState(true); // 持ち込みグッズの対応可否
    const [acceptsPanelReturn, setAcceptsPanelReturn] = useState(true); // パネル返送の対応可否
    const [panelReturnFee, setPanelReturnFee] = useState(0); // パネル返送時の手数料・梱包費
    const [deliveryNotes, setDeliveryNotes] = useState(''); // その他の備考

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'FLORIST') {
                router.push('/florists/login');
                return;
            }
            fetchSettings();
        }
    }, [authLoading, user, router]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await authenticatedFetch(`${API_URL}/api/florists/delivery-settings`);
            
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setBaseRecoveryFee(data.baseRecoveryFee || 0);
                    setLateNightFee(data.lateNightFee || 0);
                    setDeliveryAreas(data.deliveryAreas || []);
                    setAcceptsGoods(data.acceptsGoods ?? true);
                    setAcceptsPanelReturn(data.acceptsPanelReturn ?? true);
                    setPanelReturnFee(data.panelReturnFee || 0);
                    setDeliveryNotes(data.deliveryNotes || '');
                }
            } else {
                // まだ設定がない場合（404など）は初期値のまま
                // プリセットとして東京23区（無料）を入れておく
                setDeliveryAreas([{ id: 'default-1', areaName: '東京23区内', fee: 0 }]);
            }
        } catch (error) {
            toast.error('設定の読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        // バリデーション
        if (deliveryAreas.some(area => !area.areaName.trim())) {
            return toast.error('エリア名が空の項目があります');
        }

        setIsSaving(true);
        const toastId = toast.loading('設定を保存中...');

        try {
            const payload = {
                baseRecoveryFee: Number(baseRecoveryFee),
                lateNightFee: Number(lateNightFee),
                deliveryAreas: deliveryAreas,
                acceptsGoods,
                acceptsPanelReturn,
                panelReturnFee: Number(panelReturnFee),
                deliveryNotes
            };

            const res = await authenticatedFetch(`${API_URL}/api/florists/delivery-settings`, {
                method: 'PUT', // 作成・更新を兼ねる
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('保存に失敗しました');
            
            toast.success('配送・回収設定を保存しました！', { id: toastId });
            router.push('/florists/dashboard');
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    // --- エリア操作ハンドラー ---
    const addArea = () => {
        setDeliveryAreas([...deliveryAreas, { id: Date.now().toString(), areaName: '', fee: 0 }]);
    };

    const updateArea = (id, field, value) => {
        setDeliveryAreas(deliveryAreas.map(area => 
            area.id === id ? { ...area, [field]: field === 'fee' ? Number(value) : value } : area
        ));
    };

    const removeArea = (id) => {
        setDeliveryAreas(deliveryAreas.filter(area => area.id !== id));
    };

    const addPresetArea = (areaName) => {
        if (!deliveryAreas.some(a => a.areaName === areaName)) {
            setDeliveryAreas([...deliveryAreas, { id: Date.now().toString() + areaName, areaName, fee: 0 }]);
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-sky-500" size={40}/></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-800 relative">
            {/* 背景装飾 */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
                <Link href="/florists/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-sky-600 shadow-sm border border-white transition-all mb-8">
                    <ArrowLeft size={16}/> ダッシュボードへ戻る
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                        <Truck size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                            配送・回収設定
                        </h1>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            Logistics Settings
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    
                    {/* 1. エリア別配送料金 */}
                    <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-sm border border-white">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <MapPin className="text-sky-500" size={20}/>
                            <h2 className="text-lg font-black text-slate-800">エリア別配送料金</h2>
                        </div>
                        
                        <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                            対応可能な配達エリアと、そのエリアへの追加配送料（片道）を設定します。<br/>
                            <span className="text-rose-500">※ここに登録されていないエリアの案件は、原則としてオファー対象外となります。</span>
                        </p>

                        <div className="space-y-3 mb-6">
                            {deliveryAreas.map((area, index) => (
                                <motion.div 
                                    key={area.id} 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 items-center"
                                >
                                    <input 
                                        type="text" 
                                        value={area.areaName}
                                        onChange={(e) => updateArea(area.id, 'areaName', e.target.value)}
                                        placeholder="エリア名 (例: 東京23区内)" 
                                        required
                                        className="flex-1 w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50 transition-all"
                                    />
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-40">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">¥</span>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={area.fee}
                                                onChange={(e) => updateArea(area.id, 'fee', e.target.value)}
                                                className="w-full bg-white border border-slate-200 pl-8 pr-4 py-3 rounded-xl text-sm font-black text-slate-800 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">pt</span>
                                        </div>
                                        <button type="button" onClick={() => removeArea(area.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {PRESET_AREAS.map(preset => (
                                <button 
                                    key={preset} type="button" onClick={() => addPresetArea(preset)}
                                    className="text-[10px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                                >
                                    + {preset}
                                </button>
                            ))}
                        </div>

                        <button type="button" onClick={addArea} className="w-full py-4 border-2 border-dashed border-sky-200 text-sky-600 rounded-2xl font-black text-sm hover:bg-sky-50 transition-colors flex justify-center items-center gap-2">
                            <Plus size={18}/> 配達エリアを追加する
                        </button>
                    </section>

                    {/* 2. 基本回収費・時間外料金 */}
                    <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-sm border border-white">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <Undo2 className="text-amber-500" size={20}/>
                            <h2 className="text-lg font-black text-slate-800">回収・時間外料金</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                    基本回収費 (スタンド回収)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">¥</span>
                                    <input 
                                        type="number" min="0" value={baseRecoveryFee} onChange={(e) => setBaseRecoveryFee(e.target.value)}
                                        className="w-full pl-8 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl font-black text-lg text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">pt</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold mt-2 leading-relaxed">イベント終了後のスタンド回収にかかる基本料金です。</p>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-400"/> 深夜早朝 割増料金
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">¥</span>
                                    <input 
                                        type="number" min="0" value={lateNightFee} onChange={(e) => setLateNightFee(e.target.value)}
                                        className="w-full pl-8 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl font-black text-lg text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">pt</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold mt-2 leading-relaxed">22:00〜翌08:00などの指定時間外の納品・回収にかかる追加料金です。</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. オプション対応 */}
                    <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-sm border border-white">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <PackageCheck className="text-emerald-500" size={20}/>
                            <h2 className="text-lg font-black text-slate-800">オプション対応・備考</h2>
                        </div>

                        <div className="space-y-6">
                            {/* トグルスイッチ群 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={cn(
                                    "flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all",
                                    acceptsGoods ? "border-emerald-400 bg-emerald-50/30" : "border-slate-100 bg-slate-50"
                                )}>
                                    <div>
                                        <p className="font-black text-sm text-slate-800 mb-1">持ち込みグッズの装飾</p>
                                        <p className="text-[10px] font-bold text-slate-500">ユーザーが用意した小物等の取り付け</p>
                                    </div>
                                    <div className="relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors" style={{ backgroundColor: acceptsGoods ? '#10b981' : '#cbd5e1' }}>
                                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", acceptsGoods ? "translate-x-6" : "translate-x-1")} />
                                        <input type="checkbox" className="hidden" checked={acceptsGoods} onChange={(e) => setAcceptsGoods(e.target.checked)} />
                                    </div>
                                </label>

                                <label className={cn(
                                    "flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all",
                                    acceptsPanelReturn ? "border-emerald-400 bg-emerald-50/30" : "border-slate-100 bg-slate-50"
                                )}>
                                    <div>
                                        <p className="font-black text-sm text-slate-800 mb-1">パネル等の返送対応</p>
                                        <p className="text-[10px] font-bold text-slate-500">イベント終了後のパネルの梱包・発送</p>
                                    </div>
                                    <div className="relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors" style={{ backgroundColor: acceptsPanelReturn ? '#10b981' : '#cbd5e1' }}>
                                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", acceptsPanelReturn ? "translate-x-6" : "translate-x-1")} />
                                        <input type="checkbox" className="hidden" checked={acceptsPanelReturn} onChange={(e) => setAcceptsPanelReturn(e.target.checked)} />
                                    </div>
                                </label>
                            </div>

                            {/* 返送手数料（返送対応ONの時だけ表示） */}
                            {acceptsPanelReturn && (
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                        パネル返送 梱包・作業費 (送料着払い前提)
                                    </label>
                                    <div className="relative sm:w-1/2">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">¥</span>
                                        <input 
                                            type="number" min="0" value={panelReturnFee} onChange={(e) => setPanelReturnFee(e.target.value)}
                                            className="w-full pl-8 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">pt</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold mt-2">※送料は原則「着払い」となります。ここには梱包材費や作業代のみを設定してください。</p>
                                </div>
                            )}

                            {/* 備考 */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                    配送に関する特記事項・注意事項
                                </label>
                                <textarea 
                                    rows="4" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)}
                                    placeholder="例：〇〇ホールの搬入は別途1,000円頂戴します。道路状況により時間が前後する場合があります。"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50 transition-all resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 保存ボタン */}
                    <div className="sticky bottom-6 z-50">
                        <button 
                            type="submit" disabled={isSaving}
                            className="w-full py-4 md:py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-base md:text-lg shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                            配送・回収設定を保存する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}