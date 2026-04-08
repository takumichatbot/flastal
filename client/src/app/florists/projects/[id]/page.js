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
    XCircle, MessageSquare, Briefcase, Loader2, Image as ImageIcon,
    Printer, X // ★ 追加
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

// ==========================================
// 📄 FLASTAL名義の納品書モーダル (印刷・PDF用)
// ==========================================
function DeliveryNoteModal({ project, onClose }) {
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>納品書_${project.title}</title>
                <style>
                    body { font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif; margin: 0; padding: 20px; color: #333; }
                    .print-container { max-width: 800px; margin: 0 auto; padding: 40px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #0284c7; padding-bottom: 20px; }
                    .title { font-size: 28px; margin: 0; color: #0f172a; letter-spacing: 2px; }
                    .subtitle { margin: 5px 0 0; color: #64748b; font-size: 14px; }
                    .meta { text-align: right; color: #64748b; font-size: 14px; line-height: 1.6; }
                    .info-blocks { display: flex; justify-content: space-between; margin-bottom: 50px; }
                    .venue-info h2, .details-info h2 { font-size: 18px; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #0f172a; }
                    .venue-info p { margin: 5px 0; font-size: 15px; }
                    .issuer-info { font-size: 14px; text-align: right; color: #475569; line-height: 1.6; }
                    .issuer-name { margin: 0; font-weight: bold; color: #0284c7; font-size: 16px; }
                    table { width: 100%; border-collapse: collapse; font-size: 15px; margin-bottom: 40px; }
                    th { padding: 12px; text-align: left; background-color: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; color: #475569; font-weight: bold; }
                    td { padding: 15px 12px; border-bottom: 1px dashed #e2e8f0; }
                    .total-row td { border-bottom: 1px solid #cbd5e1; background-color: #f0f9ff; font-weight: bold; color: #0369a1; font-size: 16px; }
                    .notes { margin-top: 60px; padding: 20px; background-color: #f8fafc; border-radius: 8px; font-size: 13px; color: #64748b; line-height: 1.6; }
                    .notes p { margin: 0 0 5px; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <div>
                            <h1 class="title">納品書</h1>
                            <p class="subtitle">DELIVERY NOTE</p>
                        </div>
                        <div class="meta">
                            <p style="margin: 0;">発行日: ${new Date().toLocaleDateString('ja-JP')}</p>
                            <p style="margin: 0;">企画ID: ${project.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    <div class="info-blocks">
                        <div class="venue-info">
                            <h2>お届け先（会場）</h2>
                            <p><strong>会場名:</strong> ${project.venue?.venueName || '未定'}</p>
                            <p><strong>住所:</strong> ${project.venue?.address || project.deliveryAddress || '未定'}</p>
                            <p><strong>イベント名:</strong> ${project.event?.title || '未定'}</p>
                        </div>
                        <div class="issuer-info">
                            <p class="issuer-name">FLASTAL運営事務局 (KIREI-CHANNEL)</p>
                            <p>〒174-0043<br>東京都板橋区坂下3-6-1-113</p>
                            <p>Email: support@flastal.com</p>
                        </div>
                    </div>

                    <div class="details-info">
                        <h2>ご依頼内容</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 30%;">項目</th>
                                    <th>詳細</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="font-weight: bold; color: #475569;">企画名</td>
                                    <td>${project.title}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #475569;">ご依頼主（企画者）</td>
                                    <td>${project.planner?.handleName || project.planner?.name || '不明'} 様</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #475569;">納品日時</td>
                                    <td>${new Date(project.deliveryDateTime).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #475569;">品名</td>
                                    <td>祝花・フラワースタンド一式</td>
                                </tr>
                                ${project.quotation ? `
                                <tr class="total-row">
                                    <td>合計金額（参考）</td>
                                    <td>${project.quotation.totalAmount.toLocaleString()} 円 (税込)</td>
                                </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>

                    <div class="notes">
                        <p style="font-weight: bold; margin-bottom: 10px; color: #334155;">【備考】</p>
                        <p>※ 本納品書はFLASTALのシステムより自動発行されたものです。</p>
                        <p>※ 代金はクラウドファンディングを通じた事前決済により、FLASTAL運営事務局より支払われます。</p>
                        <p>※ この書類に関するお問い合わせは、FLASTAL運営事務局までお願いいたします。</p>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-white">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-black flex items-center text-slate-800 tracking-tight">
                            <Printer className="mr-2 text-sky-500" size={24}/> 納品書の発行
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-8 bg-white text-center">
                    <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <FileText size={36} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">FLASTAL名義の納品書</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6">
                        会場への搬入時に必要な納品書を印刷、またはPDFとして保存できます。<br/>
                        金額などの情報は自動的に反映されます。
                    </p>
                    
                    <button onClick={handlePrint} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95">
                        <Printer size={18}/> 印刷・PDF保存プレビューを開く
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ==========================================
// 👑 メイン画面
// ==========================================
export default function FloristProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; // これが projectId
    const { user, authenticatedFetch, loading: authLoading } = useAuth();

    const [project, setProject] = useState(null);
    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // モーダルの状態管理
    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
    const [isDeliveryNoteModalOpen, setIsDeliveryNoteModalOpen] = useState(false); // ★ 追加

    const fetchProjectDetails = useCallback(async () => {
        if (!id || !user) return;
        try {
            setLoading(true);
            const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`);
            if (!res.ok) throw new Error('企画情報の取得に失敗しました');
            const data = await res.json();
            setProject(data);

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
            fetchProjectDetails(); 
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
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
                <Link href="/florists/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-sky-600 shadow-sm border border-white transition-all mb-8">
                    <ArrowLeft size={16}/> ダッシュボードへ戻る
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
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
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* ★ 追加: 納品書発行ボタン */}
                                        <button 
                                            onClick={() => setIsDeliveryNoteModalOpen(true)} 
                                            className="px-6 py-3.5 bg-white text-slate-800 font-black rounded-xl hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Printer size={18}/> 納品書発行
                                        </button>
                                        
                                        <Link href={`/projects/${project.id}`} className="px-6 py-3.5 bg-sky-500 text-white font-black rounded-xl shadow-lg hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 text-sm">
                                            <MessageSquare size={18}/> チャット・共同作業へ
                                        </Link>
                                    </div>
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
                {/* ★ 追加: 納品書モーダル */}
                {isDeliveryNoteModalOpen && (
                    <DeliveryNoteModal 
                        project={project} 
                        onClose={() => setIsDeliveryNoteModalOpen(false)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}