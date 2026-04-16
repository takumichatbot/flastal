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
    Printer, X, Truck, ClipboardList, PackageCheck, Undo2, Camera // ★ アイコン追加
} from 'lucide-react';

// --- Components ---
import QuotationCreateModal from '@/components/project/QuotationCreateModal';
import FloristMaterialModal from '@/components/project/FloristMaterialModal'; // ★ 実費モーダル追加

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// 🎨 ヘルパーコンポーネント
const AppCard = ({ children, className }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-8 ${className}`}>
        {children}
    </div>
);
const JpText = ({ children }) => <span className="inline-block leading-relaxed">{children}</span>;

// ==========================================
// 📄 サブコンポーネント群
// ==========================================

// 1. FLASTAL名義の納品書モーダル (印刷・PDF用)
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
                            <p>〒170-0005<br> 東京都豊島区南大塚１丁目２２−２　CASA大塚１０１</p>
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

// 2. ロジスティクスカード
function LogisticsCard({ icon, label, status, onToggle, color = "sky" }) {
    const colors = {
        sky: status ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-400 border-slate-200 hover:border-sky-200",
        amber: status ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-400 border-slate-200 hover:border-amber-200",
    };
    return (
        <button 
            onClick={() => onToggle(!status)}
            className={cn(
                "flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all group cursor-pointer w-full shadow-sm",
                colors[color]
            )}
        >
            <div className={cn("mb-2 group-hover:scale-110 transition-transform", status ? "text-white" : "text-slate-300")}>
                {status ? <CheckCircle2 size={28}/> : icon}
            </div>
            <span className="text-[11px] md:text-xs font-black text-center leading-tight">{label}</span>
            <span className="text-[10px] mt-1 opacity-70 font-bold">{status ? '完了' : '未完了'}</span>
        </button>
    );
}

// 3. 写真アップロードエリア
function PhotoUploadArea({ urls = [], type, projectId, onUploadComplete, authenticatedFetch }) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading('アップロード中...');
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await authenticatedFetch(`${API_URL}/api/tools/upload-image`, { method: 'POST', body: formData });
            if(!res.ok) throw new Error('画像の保存に失敗しました');
            const { url } = await res.json();

            const field = type === 'pre_photo' ? 'preEventPhotoUrls' : 'completionPhotoUrls';
            const updateRes = await authenticatedFetch(`${API_URL}/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: [...urls, url] })
            });
            if(!updateRes.ok) throw new Error('企画情報の更新に失敗しました');

            toast.success('写真をアップロードしました', { id: toastId });
            onUploadComplete();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            {urls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in hover:scale-105 transition-transform" onClick={()=>window.open(url,'_blank')}>
                    <Image src={url} alt="" fill className="object-cover" />
                </div>
            ))}
            <label className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-sky-300 transition-all text-slate-400 hover:text-sky-500 shadow-sm">
                {uploading ? <Loader2 className="animate-spin" size={24}/> : <Camera size={24}/>}
                <span className="text-[10px] font-black mt-2 uppercase">Upload</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
        </div>
    );
}

// ==========================================
// 👑 メイン画面
// ==========================================
export default function FloristProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; 
    const { user, authenticatedFetch, loading: authLoading } = useAuth();

    const [project, setProject] = useState(null);
    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // モーダルの状態管理
    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
    const [isDeliveryNoteModalOpen, setIsDeliveryNoteModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false); // ★ 追加

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

    // ★ 追加: ロジスティクスステータスの更新
    const updateLogistics = async (field, value) => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            if (res.ok) {
                toast.success('ステータスを更新しました');
                fetchProjectDetails();
            } else {
                throw new Error('更新失敗');
            }
        } catch (error) {
            toast.error('ステータスの更新に失敗しました');
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
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
                {/* ヘッダー・戻るボタン */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <Link href="/florists/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-sky-600 shadow-sm border border-white transition-all w-fit">
                        <ArrowLeft size={16}/> ダッシュボードへ戻る
                    </Link>
                    
                    {/* 直接チャットへのショートカット */}
                    <div className="flex gap-2">
                        <Link href={`/projects/${project.id}`} className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors">
                            <MessageSquare size={14}/> 主催者とチャット
                        </Link>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-sky-100 text-sky-500 rounded-[1.25rem] flex items-center justify-center shadow-inner shrink-0">
                            <Briefcase size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                                <JpText>{project.title}</JpText>
                            </h1>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded shadow-sm">
                                    Project ID: {project.id.slice(0,6)}
                                </span>
                                <span className="text-[10px] md:text-xs font-bold text-slate-400 flex items-center gap-1">
                                    <MapPin size={12}/> {project.venue?.venueName || '会場未定'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 案件ステータス・アクションエリア --- */}
                <AppCard className="!p-0 overflow-hidden border-2 border-white shadow-xl mb-8">
                    <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <p className="text-[10px] text-sky-300 font-black uppercase tracking-widest mb-2">現在のステータス</p>
                            <div className="flex flex-wrap items-center gap-3">
                                {offer?.status === 'PENDING' && <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><Clock size={16}/> オファー回答待ち</span>}
                                {offer?.status === 'ACCEPTED' && <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><CheckCircle2 size={16}/> オファー受諾済み</span>}
                                {offer?.status === 'REJECTED' && <span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><XCircle size={16}/> 辞退済み</span>}
                                
                                {project.quotation?.isApproved && (
                                    <span className="bg-sky-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2 shadow-sm">
                                        <DollarSign size={16}/> 発注確定 (制作進行中)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* アクションボタン */}
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
                                    <button 
                                        onClick={() => setIsDeliveryNoteModalOpen(true)} 
                                        className="px-6 py-3.5 bg-white text-slate-800 font-black rounded-xl hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                                    >
                                        <Printer size={18}/> 納品書発行
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {project.quotation && (
                        <div className="p-6 md:p-8 bg-sky-50/50 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex-1 w-full">
                                <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={14} className="text-sky-500"/> 提出済みの見積もり</h3>
                                <div className="space-y-2 mb-4">
                                    {project.quotation.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <span className="font-bold text-slate-600">{item.itemName}</span>
                                            <span className="font-black text-slate-800">{item.amount.toLocaleString()} pt</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 bg-sky-100 p-5 rounded-2xl border border-sky-200 text-center shrink-0 shadow-sm">
                                <p className="font-black text-sky-800 text-[10px] uppercase tracking-widest mb-1">お見積り合計 (確定額)</p>
                                <p className="text-3xl font-black text-sky-600 tracking-tight">{project.quotation.totalAmount.toLocaleString()} <span className="text-sm">pt</span></p>
                            </div>
                        </div>
                    )}
                </AppCard>

                {/* --- 案件詳細情報グリッド --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* 左側：メイン管理エリア */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 1. ロジスティクス管理 (物品受け取り) */}
                        <AppCard className="!p-6 md:!p-8">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Truck className="text-sky-500" size={20}/> 物品・搬入管理
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <LogisticsCard 
                                    icon={<ClipboardList size={28}/>} 
                                    label="自作パネル受取" 
                                    status={project.isPanelReceived} 
                                    onToggle={(val) => updateLogistics('isPanelReceived', val)}
                                />
                                <LogisticsCard 
                                    icon={<PackageCheck size={28}/>} 
                                    label="持ち込みグッズ受取" 
                                    status={project.isGoodsReceived} 
                                    onToggle={(val) => updateLogistics('isGoodsReceived', val)}
                                />
                                <LogisticsCard 
                                    icon={<Undo2 size={28}/>} 
                                    label="パネル・小物返送" 
                                    status={project.isReturnCompleted} 
                                    onToggle={(val) => updateLogistics('isReturnCompleted', val)}
                                    color="amber"
                                />
                            </div>
                        </AppCard>

                        {/* 2. 収支と実費精算 */}
                        <AppCard className="!p-6 md:!p-8 bg-amber-50/30 border-amber-100/50">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <DollarSign className="text-amber-500" size={20}/> 実費・コスト管理
                                </h2>
                                <button onClick={() => setIsMaterialModalOpen(true)} className="text-xs font-black text-amber-600 bg-amber-100/80 px-4 py-2 rounded-xl hover:bg-amber-200 transition-colors shadow-sm flex items-center justify-center gap-1.5">
                                    <DollarSign size={14}/> 実費を登録・更新する
                                </button>
                            </div>
                            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">現在発生している実費総額</p>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">
                                    {project.materialCost?.toLocaleString() || 0} <span className="text-sm font-bold text-slate-500">pt (円)</span>
                                </p>
                                {project.materialDescription && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5">内訳・備考</p>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{project.materialDescription}</p>
                                    </div>
                                )}
                                {(!project.materialCost || project.materialCost === 0) && (
                                    <p className="text-xs text-slate-400 font-bold mt-4">※実費を入力しておくと、万が一企画が中止になった際、この金額が優先して補填されます。</p>
                                )}
                            </div>
                        </AppCard>

                        {/* 3. 納品写真アップロード */}
                        <AppCard className="!p-6 md:!p-8">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Camera className="text-rose-500" size={20}/> 納品・仕上がり写真
                            </h2>
                            <div className="space-y-8">
                                <div className="bg-slate-50 p-5 md:p-6 rounded-[1.5rem] border border-slate-100">
                                    <h3 className="text-sm font-black text-slate-700 mb-2 flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={16}/> 前日（仕上がり）写真</h3>
                                    <p className="text-xs text-slate-500 font-bold mb-4">発送前や完成直後の写真をアップロードしてください。企画者の安心に繋がります。</p>
                                    <PhotoUploadArea urls={project.preEventPhotoUrls} type="pre_photo" projectId={id} onUploadComplete={fetchProjectDetails} authenticatedFetch={authenticatedFetch} />
                                </div>
                                <div className="bg-slate-50 p-5 md:p-6 rounded-[1.5rem] border border-slate-100">
                                    <h3 className="text-sm font-black text-slate-700 mb-2 flex items-center gap-2"><MapPin className="text-rose-500" size={16}/> 当日（納品完了）写真</h3>
                                    <p className="text-xs text-slate-500 font-bold mb-4">会場に設置完了した状態の写真をアップロードしてください。</p>
                                    <PhotoUploadArea urls={project.completionPhotoUrls} type="completion_photo" projectId={id} onUploadComplete={fetchProjectDetails} authenticatedFetch={authenticatedFetch} />
                                </div>
                            </div>
                        </AppCard>
                    </div>

                    {/* 右側：インフォメーション */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none"></div>
                            <h3 className="text-xs font-black text-sky-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Truck size={16}/> 配送・搬入情報</h3>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">希望納品日時</p>
                                    <p className="text-base font-black text-white">{new Date(project.deliveryDateTime).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">お届け先（会場）</p>
                                    <div className="bg-white/10 p-4 rounded-xl mt-2 backdrop-blur-sm border border-white/10">
                                        <p className="text-sm font-black text-white">{project.venue?.venueName || '未定'}</p>
                                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{project.venue?.address || project.deliveryAddress || '未設定'}</p>
                                    </div>
                                </div>
                                <Link href={`/venues/${project.venue?.id}`} className="block w-full py-3.5 bg-white text-slate-900 rounded-xl text-xs font-black text-center transition-all hover:bg-slate-100 shadow-md">
                                    会場の規定・レギュレーションを確認
                                </Link>
                            </div>
                        </section>

                        <AppCard className="!p-6 md:!p-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><ImageIcon size={16}/> デザイン指示</h3>
                            <div className="space-y-5 text-sm font-medium text-slate-600">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">希望サイズ</p>
                                    <p className="font-bold text-slate-800">{project.size || '規定なし'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">花材・色味</p>
                                    <p className="font-bold text-slate-800">{project.flowerTypes || 'おまかせ'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">デザイン詳細</p>
                                    <div className="p-4 bg-slate-50 rounded-xl text-xs leading-relaxed border border-slate-100">
                                        <JpText>{project.designDetails || '特に指定はありません'}</JpText>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">参考デザイン画像</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {project.designImageUrls?.length > 0 ? (
                                            project.designImageUrls.map((url, i) => (
                                                <div key={i} className="aspect-square rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 cursor-zoom-in hover:scale-105 transition-transform" onClick={()=>window.open(url,'_blank')}>
                                                    <Image src={url} alt="Design" fill className="object-cover" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 aspect-[2/1] bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
                                                <p className="text-xs font-bold text-slate-400">画像はありません</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </AppCard>

                        {/* 主催者情報 */}
                        <AppCard className="!p-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={16}/> 企画者情報</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                    {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={48} height={48} className="object-cover"/> : <User size={24} className="m-3 text-slate-400"/>}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-sm">{project.planner?.handleName || project.planner?.name || '不明'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">ID: {project.planner?.id.slice(0,8)}</p>
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
                {isDeliveryNoteModalOpen && (
                    <DeliveryNoteModal 
                        project={project} 
                        onClose={() => setIsDeliveryNoteModalOpen(false)} 
                    />
                )}
                {/* ★ 追加: 実費入力モーダル */}
                {isMaterialModalOpen && (
                    <FloristMaterialModal 
                        isOpen={isMaterialModalOpen} 
                        onClose={() => setIsMaterialModalOpen(false)} 
                        project={project} 
                        onUpdate={fetchProjectDetails} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}