'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
import { 
    Clock, MapPin, User, Calendar, FileText, Send, 
    ArrowLeft, DollarSign, CheckCircle2, AlertTriangle, 
    XCircle, MessageSquare, Briefcase, Loader2, Image as ImageIcon
} from 'lucide-react';

// --- Components ---
import QuotationCreateModal from '@/components/project/QuotationCreateModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 🎨 ヘルパーコンポーネント
const AppCard = ({ children, className }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-8 ${className}`}>
        {children}
    </div>
);
const JpText = ({ children }) => <span className="inline-block leading-relaxed">{children}</span>;


export default function FloristProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; // これが projectId
    const { user, authenticatedFetch, loading: authLoading } = useAuth();

    const [project, setProject] = useState(null);
    const [offer, setOffer] = useState(null); // このお花屋さんへのオファー情報
    const [loading, setLoading] = useState(true);
    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

    const fetchProjectDetails = useCallback(async () => {
        if (!id || !user) return;
        try {
            setLoading(true);
            // プロジェクト情報の取得
            const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`);
            if (!res.ok) throw new Error('企画情報の取得に失敗しました');
            const data = await res.json();
            setProject(data);

            // このプロジェクトにおける、自分へのオファーを探す
            if (data.offer && data.offer.floristId === user.id) {
                setOffer(data.offer);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id, user, authenticatedFetch]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'FLORIST') {
                router.push('/florists/login');
                return;
            }
            fetchProjectDetails();
        }
    }, [authLoading, user, fetchProjectDetails, router]);


    // --- オファーの回答処理（受諾 or 辞退） ---
    const handleRespondToOffer = async (status) => {
        if (!offer) return;
        const confirmMsg = status === 'ACCEPTED' ? 'このオファーを受諾して、チャットを開始しますか？' : '本当にこのオファーを辞退しますか？（取り消せません）';
        if (!window.confirm(confirmMsg)) return;

        const toastId = toast.loading('処理中...');
        try {
            const res = await authenticatedFetch(`${API_URL}/api/florists/offers/${offer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('エラーが発生しました');
            toast.success(status === 'ACCEPTED' ? 'オファーを受諾しました！' : 'オファーを辞退しました', { id: toastId });
            fetchProjectDetails(); // 状態を更新
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };


    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-sky-500" size={40}/></div>;
    }

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <AlertTriangle size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-black text-slate-700 mb-2">企画が見つかりません</h2>
                <Link href="/florists/dashboard" className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors">ダッシュボードに戻る</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50/50 to-indigo-50/50 pb-24 font-sans text-slate-800 relative">
            {/* --- 背景装飾 --- */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
                <Link href="/florists/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-sky-600 shadow-sm border border-white transition-all mb-8">
                    <ArrowLeft size={16}/> ダッシュボードへ戻る
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                            <JpText>{project.title}</JpText>
                        </h1>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            Order Details
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* --- ステータス・アクションエリア --- */}
                    <AppCard className="!p-0 overflow-hidden border-2 border-white shadow-xl">
                        <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <p className="text-[10px] text-sky-300 font-black uppercase tracking-widest mb-2">現在のステータス</p>
                                <div className="flex items-center gap-3">
                                    {offer?.status === 'PENDING' && <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><Clock size={16}/> オファー回答待ち</span>}
                                    {offer?.status === 'ACCEPTED' && <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><CheckCircle2 size={16}/> オファー受諾済み</span>}
                                    {offer?.status === 'REJECTED' && <span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><XCircle size={16}/> 辞退済み</span>}
                                    
                                    {project.quotation?.isApproved && (
                                        <span className="bg-sky-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2">
                                            <DollarSign size={16}/> 発注確定 (制作開始)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* アクションボタン（ステータスに応じて変化） */}
                            <div className="w-full md:w-auto">
                                {offer?.status === 'PENDING' && (
                                    <div className="flex gap-3">
                                        <button onClick={() => handleRespondToOffer('REJECTED')} className="flex-1 md:flex-none px-6 py-3 bg-slate-800 text-slate-300 font-black rounded-xl hover:bg-rose-500 hover:text-white transition-colors text-sm">
                                            辞退する
                                        </button>
                                        <button onClick={() => handleRespondToOffer('ACCEPTED')} className="flex-1 md:flex-none px-8 py-3 bg-sky-500 text-white font-black rounded-xl hover:bg-sky-400 shadow-lg shadow-sky-500/30 transition-all text-sm">
                                            受諾してチャットへ
                                        </button>
                                    </div>
                                )}

                                {offer?.status === 'ACCEPTED' && !project.quotation && (
                                    <button 
                                        onClick={() => setIsQuotationModalOpen(true)}
                                        className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-black rounded-xl shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileText size={18}/> 見積もりを作成する
                                    </button>
                                )}

                                {project.quotation && !project.quotation.isApproved && (
                                    <div className="px-6 py-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-2 text-sm font-bold text-sky-300">
                                        <Clock size={16}/> 企画者の支払い・承認待ち
                                    </div>
                                )}

                                {project.quotation?.isApproved && (
                                    <Link href={`/projects/${project.id}`} className="px-8 py-3.5 bg-white text-slate-900 font-black rounded-xl shadow-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm">
                                        <MessageSquare size={18}/> チャット・管理画面へ
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* もしすでに見積もり提出済みなら、その内容を表示 */}
                        {project.quotation && (
                            <div className="p-6 md:p-8 bg-sky-50/50 border-t border-slate-100">
                                <h3 className="font-black text-slate-700 text-sm mb-4 flex items-center gap-2"><FileText size={16} className="text-sky-500"/> 提出済みの見積もり</h3>
                                <div className="space-y-2 mb-4">
                                    {project.quotation.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm bg-white p-3 rounded-lg border border-slate-100">
                                            <span className="font-bold text-slate-600">{item.itemName}</span>
                                            <span className="font-black text-slate-800">{item.amount.toLocaleString()} pt</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center bg-sky-100/50 p-4 rounded-xl border border-sky-200">
                                    <span className="font-black text-sky-800 text-sm">お見積り合計</span>
                                    <span className="text-2xl font-black text-sky-600">{project.quotation.totalAmount.toLocaleString()} <span className="text-sm">pt</span></span>
                                </div>
                            </div>
                        )}
                    </AppCard>

                    {/* --- 企画の詳細情報 --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 左：基本情報 */}
                        <AppCard className="space-y-6">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Calendar className="text-sky-500" size={20}/> 納品スケジュール
                            </h3>
                            
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">希望納品日時</p>
                                <p className="font-bold text-slate-800 text-lg">{new Date(project.deliveryDateTime).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">納品先会場</p>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3 mt-2">
                                    <MapPin className="text-rose-400 shrink-0 mt-0.5" size={18}/>
                                    <div>
                                        <p className="font-black text-slate-800">{project.venue?.venueName || '未設定'}</p>
                                        <p className="text-xs font-bold text-slate-500 mt-1">{project.venue?.address || project.deliveryAddress}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">企画者（依頼主）</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                                        {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={40} height={40} className="object-cover" /> : <User size={20} className="text-slate-400"/>}
                                    </div>
                                    <p className="font-black text-slate-700">{project.planner?.handleName || project.planner?.name}</p>
                                </div>
                            </div>
                        </AppCard>

                        {/* 右：デザイン・予算情報 */}
                        <AppCard className="space-y-6 bg-indigo-50/30 border border-indigo-50">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <ImageIcon className="text-indigo-400" size={20}/> デザインの希望
                            </h3>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">現在の集計予算 (目安)</p>
                                <p className="text-2xl font-black text-emerald-500 tracking-tight">
                                    {project.collectedAmount?.toLocaleString() || 0} <span className="text-sm font-bold">pt</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                {project.designDetails && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">詳細・雰囲気</p>
                                        <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap"><JpText>{project.designDetails}</JpText></p>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {project.size && (
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">希望サイズ</p>
                                            <p className="text-xs font-bold text-slate-700">{project.size}</p>
                                        </div>
                                    )}
                                    {project.flowerTypes && (
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">使いたい花材</p>
                                            <p className="text-xs font-bold text-slate-700">{project.flowerTypes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AppCard>
                    </div>
                </div>
            </div>

            {/* --- モーダル群 --- */}
            <AnimatePresence>
                {isQuotationModalOpen && (
                    <QuotationCreateModal 
                        projectId={project.id} 
                        onClose={() => setIsQuotationModalOpen(false)} 
                        onSuccess={fetchProjectDetails} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}