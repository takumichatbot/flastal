'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { useForm } from 'react-hook-form';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Markdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';
import { motion, AnimatePresence } from 'framer-motion';
import ShareButtons from '@/app/components/ShareButtons';
import { useConfirm } from '@/app/hooks/useConfirm';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ProgressBar } from '@/app/components/ProgressBar';
import { useKeyboardAwareScroll } from '@/app/hooks/useKeyboardAwareScroll';

// --- Icons ---
import { 
  Clock, MapPin, User, Heart, Share2, MessageCircle, 
  CheckCircle2, AlertTriangle, DollarSign, Calendar, 
  ChevronLeft, ChevronRight, Home, Send, Image as ImageIcon,
  Award, Plus, Search, Loader2, X,
  FileText, Printer, Info, Lock, PenTool, Check, Wand2,
  MessageSquare, Trash2, Box, UploadCloud, RefreshCw, Pen, Book, Users, Sparkles, Edit3, UserPlus, Zap, Brush, Download, Star, BarChart2, Rss
} from 'lucide-react';

// --- Utils ---
import { formatAmount } from '@/app/utils/formatPrice';

// --- Components ---
import OfficialBadge from '@/app/components/OfficialBadge';
import UpsellAlert from '@/app/components/UpsellAlert';
import FlowerScrollIndicator from '@/app/components/FlowerScrollIndicator';
import CountdownTimer from '@/app/components/CountdownTimer';

const VenueLogisticsWiki = dynamic(() => import('@/app/components/VenueLogisticsWiki'), { ssr: false });
const MoodboardPostForm = dynamic(() => import('@/app/components/MoodboardPostForm'), { ssr: false });
const MoodboardDisplay = dynamic(() => import('@/app/components/MoodboardDisplay'), { ssr: false });
const PanelPreviewer = dynamic(() => import('@/app/components/PanelPreviewer'), { ssr: false });
const GroupChat = dynamic(() => import('./components/GroupChat'), { ssr: false });
const CompletionReportModal = dynamic(() => import('./components/CompletionReportModal'), { ssr: false });
const ReportModal = dynamic(() => import('./components/ReportModal'), { ssr: false });
const VenueRegulationCard = dynamic(() => import('@/app/components/VenueRegulationCard'), { ssr: false });
const BalanceSheet = dynamic(() => import('@/app/components/BalanceSheet').then(m => ({ default: m.BalanceSheet })), { ssr: false });
const FloristMaterialModal = dynamic(() => import('@/components/project/FloristMaterialModal'), { ssr: false });
const ProjectCancelModal = dynamic(() => import('@/components/project/ProjectCancelModal'), { ssr: false });

// Dynamic Import
const ArViewer = dynamic(() => import('@/app/components/ArViewer'), { ssr: false });
const OshiAvatarUpload = dynamic(() => import('./components/OshiAvatarUpload'), { ssr: false });

// Tab components (dynamic to keep main bundle small)
const OverviewTab      = dynamic(() => import('./tabs/OverviewTab'),      { ssr: false });
const BackersTab       = dynamic(() => import('./tabs/BackersTab'),       { ssr: false });
const CollaborationTab = dynamic(() => import('./tabs/CollaborationTab'), { ssr: false });
const FinanceTab       = dynamic(() => import('./tabs/FinanceTab'),       { ssr: false });
const DiscussionTab    = dynamic(() => import('./tabs/DiscussionTab'),    { ssr: false });
const UpdatesTab       = dynamic(() => import('./tabs/UpdatesTab'),       { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// Helper
function cn(...classes) { return classes.filter(Boolean).join(' '); }

// Security: whitelist-based HTML sanitizer. Only permits structural/formatting tags
// used by InstructionSheetModal (h1-h3, p, strong, hr, pre, div, img with safe attrs).
// Strips all event handlers, javascript: URIs, and any non-whitelisted tags.
function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';

  // Remove event handler attributes (onclick, onload, onerror, etc.)
  let safe = html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: and data: URI schemes from any attribute value
  safe = safe.replace(/(?:href|src|action)\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi, '');

  // Remove <script>, <iframe>, <object>, <embed>, <form>, <input>, <link>, <meta> tags entirely
  safe = safe.replace(/<(script|iframe|object|embed|form|input|link|meta|style|base)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  safe = safe.replace(/<(script|iframe|object|embed|form|input|link|meta|style|base)\b[^>]*(\/?>)/gi, '');

  return safe;
}
const JpText = ({ children, className }) => <span className={cn("inline-block leading-relaxed", className)}>{children}</span>;

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

const useIsMounted = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    return mounted;
};

// ===========================================
// 🎨 UI COMPONENTS
// ===========================================
const AppCard = ({ children, className, id }) => (
 <div id={id} className={cn("bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 md:p-8", className)}>
   {children}
 </div>
);

function ImageLightbox({ url, onClose }) {
 return (
   <div className="fixed inset-0 bg-slate-900/95 flex justify-center items-center z-[100] p-4 backdrop-blur-md" onClick={onClose}>
     <button onClick={onClose} aria-label="閉じる" className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[110] border border-white/20">
       <X size={24} />
     </button>
     <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full h-full flex items-center justify-center pointer-events-none">
       <Image src={url} alt="拡大画像" width={1200} height={900} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" unoptimized />
     </motion.div>
   </div>
 );
}

function InstructionSheetModal({ project, onClose }) {
  const images = [
    project.designImageUrls?.[0] || project.imageUrl, 
    project.designImageUrls?.[1], 
    project.designImageUrls?.[2]
  ].filter(url => url); 
    
  const generateContentHTML = () => {
    const instructionText = `
      <h1>【FLASTAL 制作指示書】</h1>
      <h2>企画名: ${project.title}</h2>
      <p><strong>企画者:</strong> ${project.planner?.handleName || project.planner?.name || '不明'}</p>
      <p><strong>納品日時:</strong> ${new Date(project.deliveryDateTime).toLocaleString()}</p>
      <p><strong>会場:</strong> ${project.venue?.venueName || '未定'} / ${project.venue?.address || '未定'}</p>
      <hr/>
      <h3>デザイン詳細:</h3>
      <p>${project.designDetails || 'なし'}</p>
      <p><strong>希望サイズ:</strong> ${project.size || '不明'}</p>
      <p><strong>花材・色:</strong> ${project.flowerTypes || '不明'}</p>
      <hr/>
      <h3>会場レギュレーション（重要）:</h3>
      <pre>${project.venue?.regulations || 'レギュレーション情報なし'}</pre>
    `;

    const imageHtml = images.length > 0 ? `
        <div style="margin-bottom: 20px; page-break-before: auto;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">デザイン参考画像</h3>
            <div style="margin-bottom: 15px; border: 1px solid #ccc; padding: 5px;">
                <img src="${images[0]}" alt="メインデザイン" style="width: 100%; max-height: 500px; object-fit: contain; display: block;" />
                <p style="text-align: center; font-size: 12px; margin-top: 5px;">[画像 1/3 - メイン参考]</p>
            </div>
        </div>
    ` : '';
    
    return imageHtml + instructionText;
  };
  
  const contentHtml = generateContentHTML();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    printWindow.opener = null;
    printWindow.document.write(`<html><body>${contentHtml}<script>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white" onClick={e => e.stopPropagation()}>
        <div className="p-4 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg md:text-xl font-black flex items-center text-slate-800"><FileText className="mr-2 text-pink-500"/> 制作指示書プレビュー</h3>
          <button onClick={onClose} aria-label="閉じる" className="text-slate-400 hover:text-slate-600 bg-white p-2.5 min-h-[40px] min-w-[40px] rounded-full shadow-sm flex items-center justify-center"><X size={20}/></button>
        </div>
        <div className="flex-grow p-4 md:p-8 bg-white text-sm overflow-y-auto prose prose-sm">
             <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }} />
        </div>
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 shadow-sm">閉じる</button>
          <button onClick={handlePrint} className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
            <Printer size={16}/> 印刷 / PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function QuotationApprovalModal({ project, user, onClose, onUpdate }) {
  const [approvalMethod, setApprovalMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quotationAmount = project.quotation?.totalAmount || 0;
  const collectedAmount = project.collectedAmount || 0;
  const shortfall = quotationAmount - collectedAmount;
  const userPoints = user?.points || 0;

  const canFull = shortfall <= 0;
  const canGuarantee = shortfall > 0 && userPoints >= shortfall;
  const canFlexible = shortfall > 0 && collectedAmount >= 1000;

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approvalMethod) return toast.error('支払い方法を選択してください');
    
    setIsSubmitting(true);
    const toastId = toast.loading('発注処理中...');
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/florists/quotations/${project.quotation.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ approvalMethod })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'エラーが発生しました');
      
      toast.success('見積もりを承認し、発注が完了しました！🎉', { id: toastId });
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh] border border-white" onClick={e => e.stopPropagation()}>
        <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><FileText className="text-pink-500" size={24}/> 見積もりの承認・発注</h2>
            <p className="text-xs font-bold text-slate-500 mt-1">お花屋さんの制作を開始するために支払い方法を選んでください</p>
          </div>
          <button onClick={onClose} aria-label="閉じる" className="text-slate-400 hover:text-slate-600 bg-white p-2.5 min-h-[40px] min-w-[40px] rounded-full shadow-sm flex items-center justify-center"><X size={20}/></button>
        </div>

        <div className="p-5 md:p-8 overflow-y-auto bg-slate-50/50 space-y-5">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">お見積り総額</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{quotationAmount.toLocaleString()} <span className="text-sm font-bold text-slate-500">pt</span></p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">現在の支援額</p>
                    <p className="text-xl font-black text-pink-500 tracking-tight">{collectedAmount.toLocaleString()} <span className="text-sm font-bold text-pink-300">pt</span></p>
                </div>
            </div>

            <h3 className="font-black text-slate-700 text-xs md:text-sm uppercase tracking-widest">支払い方法の選択</h3>
            
            <form id="approvalForm" onSubmit={handleApprove} className="space-y-3">
                <label className={cn("block p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all relative overflow-hidden", canFull ? (approvalMethod === 'FULL' ? 'border-pink-500 bg-pink-50/30 shadow-md ring-4 ring-pink-50' : 'border-slate-200 bg-white hover:border-pink-300') : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')}>
                    <input type="radio" value="FULL" disabled={!canFull} checked={approvalMethod === 'FULL'} onChange={(e)=>setApprovalMethod(e.target.value)} className="hidden" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2"><CheckCircle2 size={18} className={approvalMethod === 'FULL' ? 'text-pink-500' : 'text-slate-300'}/> 見積り通りに発注</p>
                            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">集まった支援額から全額支払います。</p>
                            {!canFull && <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12}/>支援額が {shortfall.toLocaleString()} pt不足しています</p>}
                        </div>
                    </div>
                </label>

                {shortfall > 0 && (
                    <label className={cn("block p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all relative overflow-hidden", canGuarantee ? (approvalMethod === 'GUARANTEE' ? 'border-pink-500 bg-pink-50/30 shadow-md ring-4 ring-pink-50' : 'border-slate-200 bg-white hover:border-pink-300') : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')}>
                        <input type="radio" value="GUARANTEE" disabled={!canGuarantee} checked={approvalMethod === 'GUARANTEE'} onChange={(e)=>setApprovalMethod(e.target.value)} className="hidden" />
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2"><CheckCircle2 size={18} className={approvalMethod === 'GUARANTEE' ? 'text-pink-500' : 'text-slate-300'}/> 不足分を立て替える <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-md text-xs tracking-wider ml-1">推奨</span></p>
                                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">あなたの所持ポイントから不足分 <b className="text-pink-500">{shortfall.toLocaleString()} pt</b> を支払って今すぐ発注します。※募集はイベント直前まで継続できます。</p>
                                {!canGuarantee && <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12}/>所持ポイントが不足しています (所持: {userPoints.toLocaleString()} pt)</p>}
                            </div>
                        </div>
                    </label>
                )}

                {shortfall > 0 && (
                    <label className={cn("block p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all relative overflow-hidden", canFlexible ? (approvalMethod === 'FLEXIBLE' ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-4 ring-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300') : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')}>
                        <input type="radio" value="FLEXIBLE" disabled={!canFlexible} checked={approvalMethod === 'FLEXIBLE'} onChange={(e)=>setApprovalMethod(e.target.value)} className="hidden" />
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2"><CheckCircle2 size={18} className={approvalMethod === 'FLEXIBLE' ? 'text-emerald-500' : 'text-slate-300'}/> おまかせ発注 (金額に合わせて作成)</p>
                                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">現在の支援総額 <b className="text-emerald-500">{collectedAmount.toLocaleString()} pt</b> に合わせて、お花屋さんにデザインと予算を調整して作ってもらいます。</p>
                                {!canFlexible && <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12}/>おまかせプランは1,000 pt以上集まっている必要があります</p>}
                            </div>
                        </div>
                    </label>
                )}
            </form>
        </div>

        <div className="p-5 md:p-6 bg-white border-t border-slate-100">
            <button type="submit" form="approvalForm" disabled={!approvalMethod || isSubmitting} className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-black shadow-lg shadow-pink-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none hover:brightness-105 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                この内容で発注を確定する
            </button>
        </div>
      </motion.div>
    </div>
  );
}

function PledgeForm({ project, user, onPledgeSubmit, isPledger }) {
  const isNativeApp = Capacitor.isNativePlatform();
  const { register, handleSubmit, formState: { isSubmitting }, reset, watch, setValue } = useForm({
    defaultValues: { pledgeType: 'tier', selectedTierId: project.pledgeTiers?.[0]?.id || '', pledgeAmount: project.minContributionAmount || 1000, comment: '', guestName: '', guestEmail: '' }
  });
  const pledgeType = watch('pledgeType');
  const selectedTierId = watch('selectedTierId');
  const selectedTier = project.pledgeTiers?.find(t => t.id === selectedTierId);
  const finalAmount = pledgeType === 'tier' && selectedTier ? selectedTier.amount : parseInt(watch('pledgeAmount')) || 0;

  const userPoints = user?.points || 0;
  const [pointsToUse, setPointsToUse] = useState(0);
  const maxPoints = useMemo(() => Math.min(userPoints, finalAmount), [userPoints, finalAmount]);
  const cardAmount = finalAmount - pointsToUse;

  const minAmount = project.minContributionAmount || 1000;
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'konbini' | 'paypay'

  const handleQuantityChange = (newQty) => {
      setQuantity(newQty);
      setValue('pledgeAmount', newQty * minAmount); 
  };

  const onSubmit = async (data) => {
    const minAmount = project.minContributionAmount || 1000;
    if (finalAmount < minAmount) return toast.error(`支援金額は ${minAmount.toLocaleString()} pt以上に設定してください。`);
    if (!user && !data.guestName?.trim()) return toast.error('お名前を入力してください');
    if (!user && !data.guestEmail?.trim()) return toast.error('メールアドレスを入力してください');
    
    if (user && cardAmount === 0) {
        onPledgeSubmit({
            projectId: project.id, userId: user.id, comment: data.comment,
            tierId: pledgeType === 'tier' ? data.selectedTierId : undefined,
            amount: finalAmount, 
        });
        reset();
    } 
    else {
        const loadingToast = toast.loading('Stripe決済ページへ移動中...');
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken')?.replace(/^"|"$/g, '') : null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/api/payment/checkout/create-checkout-session`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    projectId: project.id, 
                    amount: finalAmount,
                    pointsToUse: pointsToUse,
                    cardAmount: cardAmount,
                    comment: data.comment,
                    tierId: pledgeType === 'tier' ? data.selectedTierId : undefined,
                    guestName: !user ? data.guestName : undefined, 
                    guestEmail: !user ? data.guestEmail : undefined,
                    paymentMethod,
                    successUrl: `${window.location.origin}/projects/${project.id}?payment=success`,
                    cancelUrl: `${window.location.origin}/projects/${project.id}?payment=cancelled`,
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'エラー');
            if (result.sessionUrl) window.location.href = result.sessionUrl;
        } catch (error) { toast.error(error.message, { id: loadingToast }); }
    }
  };

  if (isPledger) {
      return (
          <AppCard className="text-center bg-gradient-to-b from-pink-50 to-white border-2 border-pink-100 shadow-[0_8px_30px_rgba(244,114,182,0.1)]">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full text-pink-500 mb-3 shadow-inner border border-pink-100"><CheckCircle2 size={24} /></div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 tracking-tight">支援済みです</h3>
              <p className="text-slate-500 font-bold text-xs md:text-sm">ご協力ありがとうございます！🌸</p>
          </AppCard>
      );
  }

  if (project.status !== 'FUNDRAISING') {
    return (
        <AppCard className="text-center bg-slate-50 border border-slate-100">
            <h3 className="text-lg md:text-xl font-black text-slate-400 mb-2">受付終了</h3>
            <p className="text-slate-400 font-bold text-xs md:text-sm">現在、支援を募集していません。</p>
        </AppCard>
    );
  }

  return (
    <AppCard className="border-none shadow-[0_10px_30px_rgba(244,114,182,0.06)] ring-1 ring-slate-100">
      <h3 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2"><Heart className="text-pink-500 fill-pink-500" size={20}/> 支援して参加する</h3>
      
      {!user && (
        <div className="mb-4 md:mb-6 p-3 bg-slate-50 rounded-xl flex items-start gap-2">
            <Info className="mt-0.5 shrink-0 text-slate-400" size={14}/>
            <div className="text-[11px] md:text-xs font-bold text-slate-600 leading-relaxed">現在ゲストモードです。<br/>
                <Link href={`/login?redirect=/projects/${project.id}`} className="text-pink-500 underline hover:text-pink-600">ログインするとポイントが使えます</Link>
            </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <label className={cn("flex-1 text-center py-2.5 rounded-lg cursor-pointer text-xs md:text-sm font-black transition-all", pledgeType === 'tier' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="tier" className="hidden" /> コースから選ぶ
          </label>
          <label className={cn("flex-1 text-center py-2.5 rounded-lg cursor-pointer text-xs md:text-sm font-black transition-all", pledgeType === 'free' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="free" className="hidden" /> 金額を指定
          </label>
        </div>

        {pledgeType === 'tier' ? (
          project.pledgeTiers && project.pledgeTiers.length > 0 ? (
            <div className="space-y-2 md:space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {project.pledgeTiers.map(tier => {
                const backerCount = project.pledges?.filter(p => p.pledgeTierId === tier.id).length ?? 0;
                const isSoldOut = tier.maxBackers != null && backerCount >= tier.maxBackers;
                return (
                <label key={tier.id} className={cn(
                  "block border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all relative overflow-hidden",
                  isSoldOut ? 'opacity-50 cursor-not-allowed border-slate-100' :
                  selectedTierId === tier.id ? 'border-pink-500 bg-pink-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                )}>
                  <input type="radio" {...register('selectedTierId')} value={tier.id} className="hidden" disabled={isSoldOut} />

                  {/* ティア画像 */}
                  {tier.imageUrl && (
                    <div className="relative h-24 w-full overflow-hidden rounded-t-xl">
                      <Image src={tier.imageUrl} alt={tier.title} width={400} height={96} className="w-full h-full object-cover" unoptimized={tier.imageUrl?.startsWith('http') && !tier.imageUrl?.includes('amazonaws')} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-black text-xl md:text-2xl text-slate-800 tracking-tight">{tier.amount.toLocaleString()} <span className="text-xs font-bold text-slate-400">pt(円)</span></span>
                        {tier.badge && <span className="ml-2 text-xs font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">{tier.badge}</span>}
                      </div>
                      {selectedTierId === tier.id ? <CheckCircle2 className="text-pink-500 fill-pink-100 shrink-0" size={20}/> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0"/>}
                    </div>
                    <span className="text-xs md:text-sm font-bold text-pink-500 block mb-1">{tier.title}</span>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{tier.description}</p>
                    {tier.maxBackers != null && (
                      <p className="text-xs font-black mt-2 text-slate-400">
                        {isSoldOut ? '🔒 定員に達しました' : `残り ${tier.maxBackers - backerCount} 枠`}
                      </p>
                    )}
                  </div>
                </label>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-xs font-bold text-slate-500">現在、設定されているコースはありません。</p>
              <button type="button" onClick={() => reset({ pledgeType: 'free' })} className="text-pink-500 text-xs font-bold mt-2 hover:underline">金額を指定して支援する</button>
            </div>
          )
        ) : null}

        {pledgeType === 'free' && (
          <div className="space-y-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                支援口数 (1口 {minAmount.toLocaleString()}pt〜)
              </label>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <button type="button" onClick={() => handleQuantityChange(Math.max(1, quantity - 1))} className="w-12 h-12 bg-white rounded-lg shadow-sm font-black text-slate-500 hover:text-pink-500 text-xl transition-all active:scale-95">-</button>
                 <div className="font-black text-2xl text-slate-800">{quantity} <span className="text-sm text-slate-400">口</span></div>
                 <button type="button" onClick={() => handleQuantityChange(quantity + 1)} className="w-12 h-12 bg-white rounded-lg shadow-sm font-black text-slate-500 hover:text-pink-500 text-xl transition-all active:scale-95">+</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                合計支援金額 (pt/円)
              </label>
              <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-black text-xl">¥</span>
                  <input
                    id="pledge-amount-input"
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
                    {...register('pledgeAmount', { valueAsNumber: true })}
                    min={minAmount}
                    aria-label={`合計支援金額（${minAmount.toLocaleString()}円以上）`}
                    aria-required="true"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xl font-black text-slate-800 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60 outline-none transition-all"
                    placeholder={`例: ${minAmount}`}
                  />
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1.5 ml-1">※金額を手入力で上乗せすることも可能です</p>
            </div>
          </div>
        )}

        {user && userPoints > 0 && finalAmount > 0 && (
          <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">
                🌸 ポイントを使う
              </span>
              <span className="text-xs text-pink-600 font-bold">
                保有: {formatAmount(userPoints)}pt
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPoints}
              step={100}
              value={pointsToUse}
              onChange={(e) => setPointsToUse(Number(e.target.value))}
              className="w-full accent-pink-500"
              inputMode="numeric"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0pt</span>
              <span className="font-bold text-pink-600">{formatAmount(pointsToUse)}pt 使用</span>
              <span>{formatAmount(maxPoints)}pt</span>
            </div>
            {pointsToUse > 0 && (
              <p className="text-xs text-slate-500">
                差引後: <span className="font-bold text-slate-700">¥{formatAmount(finalAmount - pointsToUse)}</span>
              </p>
            )}
          </div>
        )}

        {user && finalAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100"
            >
              <p className="text-xs font-black text-pink-400 uppercase tracking-widest mb-3">お支払い内訳</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                  <span>支援金額</span>
                  <span>{formatAmount(finalAmount)} 円</span>
                </div>
                {pointsToUse > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-pink-500">
                    <span>ポイント利用 (所持: {userPoints.toLocaleString()}pt)</span>
                    <span>- {pointsToUse.toLocaleString()} pt</span>
                  </div>
                )}
                <div className="h-px bg-pink-100 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-800">
                    {cardAmount === 0 ? 'ポイントで全額決済' : 'カード決済額'}
                  </span>
                  <span className="text-xl font-black text-slate-800 tabular-nums">
                    {formatAmount(cardAmount)} <span className="text-xs font-bold text-slate-400">円</span>
                  </span>
                </div>
              </div>
            </motion.div>
        )}

        {!user && (
            <div className="pt-3 space-y-2 border-t border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ゲスト情報</p>
              <input id="guest-name-input" type="text" {...register('guestName')} aria-label="お名前（ハンドルネーム）" className="w-full p-3.5 bg-slate-50 border-transparent rounded-xl text-[16px] font-bold focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60 outline-none transition-all" placeholder="お名前 (ハンドルネーム)"/>
              <input id="guest-email-input" type="email" autoComplete="email" {...register('guestEmail')} aria-label="メールアドレス" className="w-full p-3.5 bg-slate-50 border-transparent rounded-xl text-[16px] font-bold focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60 outline-none transition-all" placeholder="メールアドレス"/>
            </div>
        )}

        {/* 支払い方法選択（カード決済がある場合のみ） */}
        {cardAmount > 0 && (
          <div className="pt-3 space-y-2 border-t border-slate-100">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">お支払い方法</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'card',    label: 'クレジットカード', icon: '💳' },
                { id: 'konbini', label: 'コンビニ払い',     icon: '🏪' },
                { id: 'paypay',  label: 'PayPay',           icon: '📱' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2.5 px-2 rounded-xl border-2 text-xs font-black text-center transition-all ${
                    paymentMethod === m.id
                      ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-sm'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <div className="text-lg mb-0.5">{m.icon}</div>
                  {m.label}
                </button>
              ))}
            </div>
            {paymentMethod === 'konbini' && (
              <p className="text-xs text-slate-400 font-medium px-1">
                ※ 支払い期限は3日間です。ローソン・ファミリーマート・セブンイレブン等でお支払いいただけます。
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
            {isNativeApp && cardAmount > 0 ? (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                <p className="text-xs font-black text-amber-700 mb-1">カード決済はWebからご利用ください</p>
                <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
                  ポイントをチャージしてから支援するか、<br />
                  ブラウザで <span className="font-black">flastal.com</span> を開いてください。
                </p>
                <Link href="/points" className="mt-3 inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform">
                  <Zap size={12} /> ポイントを使う
                </Link>
              </div>
            ) : (
              <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit" disabled={isSubmitting || finalAmount <= 0}
                  className="w-full py-3.5 md:py-4 font-black text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-105 rounded-xl md:rounded-2xl disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2 text-sm md:text-base transition-all shadow-lg shadow-pink-200"
              >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : (cardAmount === 0 ? <Sparkles size={16} className="text-pink-400"/> : <DollarSign size={16}/>)}
                  {isSubmitting ? '処理中...' : (cardAmount === 0 ? 'ポイントだけで支援を完了する' : 'カード決済へ進む')}
              </motion.button>
            )}

            {user && userPoints < finalAmount && !isNativeApp && (
                <Link href="/points" className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex justify-center items-center gap-2 text-xs hover:bg-slate-50 hover:text-amber-500 transition-colors shadow-sm">
                    <Zap size={14} className="text-amber-400" />
                    事前にポイントをチャージしておく
                </Link>
            )}
            {!user && (
              <p className="text-xs text-center text-slate-400 mt-2">
                <a href="/auth/login" className="text-pink-500 font-semibold hover:underline">ログイン</a>
                {' '}するとポイントが貯まります ✨
              </p>
            )}
        </div>
      </form>
    </AppCard>
  );
}

function TargetAmountModal({ project, user, onClose, onUpdate }) {
  const [newAmount, setNewAmount] = useState(project.targetAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/projects/${project.id}/target-amount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newTargetAmount: parseInt(newAmount, 10), userId: user.id }),
      });
      if (res.ok) { onUpdate(); onClose(); toast.success('目標金額を更新しました！'); }
    } catch(e) { toast.error('エラー'); } finally { setIsSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-white" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg md:text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><DollarSign className="text-pink-500"/> 目標金額の変更</h2>
          <input type="number" inputMode="numeric" autoComplete="off" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} min={project.collectedAmount} required className="w-full p-4 border-2 border-slate-100 rounded-xl font-black text-xl md:text-2xl text-slate-800 focus:border-pink-400 outline-none mb-6 transition-colors" />
          <div className="flex justify-end gap-2 md:gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">キャンセル</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-black shadow-md shadow-pink-100 hover:brightness-105 transition-all">保存</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeadlineEditModal({ project, onClose, onUpdate, authenticatedFetch }) {
  const [newDeadline, setNewDeadline] = useState(
    project.deadline ? new Date(project.deadline).toISOString().slice(0, 16) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDeadline) return toast.error('日付を選択してください');
    
    setIsSubmitting(true);
    const toastId = toast.loading('締切を更新中...');
    
    try {
      const res = await authenticatedFetch(`${API_URL}/api/projects/${project.id}/deadline`, {
        method: 'PATCH',
        body: JSON.stringify({ newDeadline: new Date(newDeadline).toISOString() })
      });
      
      if (!res.ok) throw new Error('更新エラー');
      
      toast.success('締切日を修正しました！', { id: toastId });
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('更新に失敗しました', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative border border-white" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="閉じる" className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"><X size={20}/></button>
        <h3 className="text-xl font-black mb-2 text-slate-800 flex items-center gap-2">
          <Clock className="text-rose-500"/> 締切日の強制変更
        </h3>
        <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
          ※管理者（運営）専用の機能です。<br/>
          ここで設定した日時に、未達成の場合は自動キャンセルバッチが実行されます。
        </p>
        <form onSubmit={handleSubmit}>
          <input 
            type="datetime-local"
            className="w-full p-4 border-2 border-slate-100 rounded-xl bg-slate-50 font-bold text-sm focus:bg-white focus:border-rose-400 outline-none transition-all mb-6"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-xl transition-colors">キャンセル</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-black hover:bg-rose-600 transition-all disabled:opacity-50 shadow-md">変更を保存</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================
export default function ProjectDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = params;

  // Stripe決済完了 / キャンセルの検出
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (!payment) return;
    // URLパラメータをクリア
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    router.replace(url.pathname, { scroll: false });

    if (payment === 'success') {
      import('canvas-confetti').then(({ default: confetti }) => {
        setTimeout(() => {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#ec4899', '#f43f5e', '#a855f7', '#fbbf24'] });
        }, 200);
        setTimeout(() => {
          confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 }, angle: 60, colors: ['#ec4899', '#fbbf24', '#34d399'] });
        }, 600);
      }).catch(() => {});
      setShowSuccessModal(true);
    } else if (payment === 'cancelled') {
      toast('決済がキャンセルされました', { icon: 'ℹ️' });
    }
  }, [searchParams, router]);

  // ゲストユーザーが支援完了後にアカウント転換バナーを表示
  useEffect(() => {
    const isSuccess = searchParams?.get('pledge') === 'success' || searchParams?.get('payment') === 'success';
    if (isSuccess && !user) {
      setShowGuestBanner(true);
    }
  }, [searchParams, user]);

  // 完了通知メールからの遷移 (?completed=1) を検知してトースト表示
  useEffect(() => {
    if (searchParams.get('completed') !== '1') return;
    if (!project) return;
    const hasPledge = user ? (project.pledges || []).some(p => p.userId === user.id) : false;
    if (!hasPledge) return;
    // URLパラメータをクリア（1回だけ表示）
    const url = new URL(window.location.href);
    url.searchParams.delete('completed');
    url.searchParams.delete('pledgeId');
    router.replace(url.pathname, { scroll: false });
    toast.success('🌸 フラスタが完成しました！ご参加ありがとうございました！', { duration: 5000 });
  }, [searchParams, project, user, router]);

  const [activeTab, setActiveTab] = useState('overview');
  const [collabTab, setCollabTab] = useState('chat');

  const [aiSummary, setAiSummary] = useState(null);
  const { user, authenticatedFetch } = useAuth(); 
  const componentRef = useRef();
  const [isFloristMaterialModalOpen, setIsFloristMaterialModalOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  // Modals state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTargetAmountModalOpen, setIsTargetAmountModalOpen] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [isArModalOpen, setIsArModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [arSrc, setArSrc] = useState(null); 
  const [arImageFile, setArImageFile] = useState(null);
  const [arHeight, setArHeight] = useState(200); 
  const [arGenLoading, setArGenLoading] = useState(false);

  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [isDeliveryNoteModalOpen, setIsDeliveryNoteModalOpen] = useState(false);
  const [isIllustrationUploading, setIsIllustrationUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  useKeyboardAwareScroll();

  const [cheers, setCheers] = useState(null);
  const [cheerMessage, setCheerMessage] = useState('');
  const [cheerGuestName, setCheerGuestName] = useState('');
  const [isPostingCheer, setIsPostingCheer] = useState(false);
  const [quickCheerSent, setQuickCheerSent] = useState(false);

  const fetchCheers = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/api/project-details/projects/${id}/cheers`);
      if (res.ok) {
        const data = await res.json();
        setCheers(data.cheers || []);
      }
    } catch { /* silent */ }
  }, [id]);

  const handlePostCheer = useCallback(async () => {
    if (!cheerMessage.trim()) return;
    if (!user && !cheerGuestName.trim()) return toast.error('お名前を入力してください');
    setIsPostingCheer(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const cheerToken = getAuthToken();
      if (user && cheerToken) headers['Authorization'] = `Bearer ${cheerToken}`;
      const res = await fetch(`${API_URL}/api/project-details/projects/${id}/cheers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: cheerMessage.trim(), guestName: cheerGuestName.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success('応援コメントを投稿しました！');
      setCheerMessage('');
      setCheerGuestName('');
      fetchCheers();
    } catch {
      toast.error('投稿に失敗しました');
    } finally {
      setIsPostingCheer(false);
    }
  }, [user, cheerMessage, cheerGuestName, id, fetchCheers]);

  const handleQuickCheer = useCallback(async () => {
    if (quickCheerSent) return;
    try {
      const cheerToken = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (user && cheerToken) headers['Authorization'] = `Bearer ${cheerToken}`;
      const res = await fetch(`${API_URL}/api/project-details/projects/${id}/cheers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: '♡', guestName: user ? undefined : 'ゲスト' }),
      });
      if (res.ok) {
        setQuickCheerSent(true);
        fetchCheers();
        setTimeout(() => setQuickCheerSent(false), 3000);
      }
    } catch { /* silent */ }
  }, [quickCheerSent, user, id, fetchCheers]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `収支報告書_${project?.title || '企画'}`,
  });

  const fetchProject = useCallback(async () => {
     if (!id) return;
     try {
       setLoading(true);
       const response = await fetch(`${API_URL}/api/projects/${id}`); 
       if (!response.ok) throw new Error('企画が見つかりません');
       const data = await response.json();
       
       if (data.offers && data.offers.length > 0) {
           const acceptedOffer = data.offers.find(o => o.status === 'ACCEPTED');
           data.offer = acceptedOffer || data.offers[0];
       }

       setProject(data);
     } catch (error) {
       toast.error(error.message);
     } finally {
       setLoading(false);
     }
   }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => { fetchCheers(); }, [fetchCheers]);

  // 30秒ごとに支援数・金額だけ軽量ポーリング
  useEffect(() => {
    if (!id) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${id}/stats`);
        if (!res.ok) return;
        const stats = await res.json();
        setProject(prev => prev ? { ...prev, ...stats } : null);
      } catch {}
    };
    const timerId = setInterval(poll, 30000);
    return () => clearInterval(timerId);
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const token = getAuthToken();
    if (!token) return;
    const newSocket = io(API_URL, { transports: ['polling'], auth: { token: `Bearer ${token}` } });
    setSocket(newSocket);
    newSocket.emit('joinProjectRoom', id);
    newSocket.on('receiveGroupChatMessage', (msg) => setProject(prev => prev ? { ...prev, groupChatMessages: [...(prev.groupChatMessages || []), msg] } : null));
    newSocket.on('messageError', (msg) => toast.error(msg));

    // ── リアルタイム支援カウンター ────────────────────────────────────────
    newSocket.on('pledgeUpdate', ({ collectedAmount, targetAmount, pledgerName, pledgeAmount }) => {
      setProject(prev => prev ? { ...prev, collectedAmount, targetAmount } : null);
      if (pledgerName && pledgeAmount) {
        toast.success(`${pledgerName}さんが ${Number(pledgeAmount).toLocaleString()}pt 支援しました！`, {
          duration: 3000,
          icon: '🎉',
        });
      }
    });
    newSocket.on('projectGoalReached', () => {
      setProject(prev => prev ? { ...prev, status: 'SUCCESSFUL' } : null);
      toast.success('🎊 目標金額100%達成！', { duration: 5000, icon: '🔥' });
    });
    // ──────────────────────────────────────────────────────────────────────

    return () => newSocket.disconnect();
  }, [id, user]);

  const handlePostAnnouncement = useCallback(async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) {
        return toast.error('タイトルと本文を入力してください');
    }

    setIsPostingAnnouncement(true);
    const toastId = toast.loading('投稿中...');

    try {
        const res = await authenticatedFetch(`${API_URL}/api/project-details/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: announcementTitle, content: announcementContent, projectId: id })
        });
        if (!res.ok) throw new Error('投稿に失敗しました');

        toast.success('活動報告を投稿しました！', { id: toastId });
        setShowAnnouncementForm(false);
        setAnnouncementTitle('');
        setAnnouncementContent('');
        fetchProject();
    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setIsPostingAnnouncement(false);
    }
  }, [announcementTitle, announcementContent, id, authenticatedFetch, fetchProject]);

  const handleAddExpense = async (e) => {
      e.preventDefault();
      if (!expenseName.trim() || !expenseAmount) return toast.error('項目名と金額を入力してください');
      const toastId = toast.loading('追加中...');
      try {
          const res = await authenticatedFetch(`${API_URL}/api/project-details/expenses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemName: expenseName.trim(), amount: parseInt(expenseAmount, 10), projectId: id })
          });
          if (!res.ok) throw new Error('追加失敗');
          toast.success('支出を追加しました', { id: toastId });
          setExpenseName('');
          setExpenseAmount('');
          fetchProject();
      } catch (err) {
          toast.error('追加に失敗しました', { id: toastId });
      }
  };

  const handleDeleteExpense = async (expenseId) => {
      if (!await confirm('この支出を削除しますか？')) return;
      try {
          const res = await authenticatedFetch(`${API_URL}/api/project-details/expenses/${expenseId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('削除失敗');
          toast.success('削除しました');
          fetchProject();
      } catch (err) {
          toast.error('エラーが発生しました');
      }
  };

  const handleAddTask = async (e) => {
      e.preventDefault();
      if (!newTaskTitle.trim()) return toast.error('タスク名を入力してください');
      const toastId = toast.loading('追加中...');
      try {
          const res = await authenticatedFetch(`${API_URL}/api/project-details/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: newTaskTitle.trim(), projectId: id })
          });
          if (!res.ok) throw new Error('追加失敗');
          toast.success('タスクを追加しました', { id: toastId });
          setNewTaskTitle('');
          fetchProject();
      } catch (err) {
          toast.error('追加に失敗しました', { id: toastId });
      }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
      try {
          const res = await authenticatedFetch(`${API_URL}/api/project-details/tasks/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isCompleted: !currentStatus })
          });
          if (!res.ok) throw new Error('更新失敗');
          fetchProject();
      } catch (err) {
          toast.error('タスクの更新に失敗しました');
      }
  };

  const handleDeleteTask = async (taskId) => {
      if (!await confirm('このタスクを削除しますか？')) return;
      try {
          const res = await authenticatedFetch(`${API_URL}/api/project-details/tasks/${taskId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('削除失敗');
          fetchProject();
      } catch (err) {
          toast.error('削除に失敗しました');
      }
  };

  const onPledgeSubmit = useCallback(async (data) => {
      const toastId = toast.loading('決済処理中...');
      try {
          const res = await authenticatedFetch(`${API_URL}/api/payment/pledges`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  projectId: data.projectId,
                  amount: data.amount,
                  comment: data.comment,
                  tierId: data.tierId
              })
          });

          const result = await res.json();
          if (!res.ok) throw new Error(result.message || '支援に失敗しました');

          toast.success('支援が完了しました！ありがとうございます🎉', { id: toastId, duration: 5000 });
          fetchProject();
      } catch (err) {
          toast.error(err.message, { id: toastId, duration: 5000 });
      }
  }, [authenticatedFetch, fetchProject]);

  const handleUpload = async (e, type) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      
      const toastId = toast.loading('データを送信中...');
      if (type === 'illustration_delivery') setIsIllustrationUploading(true);

      try {
          const token = getAuthToken();
          const urlRes = await fetch(`${API_URL}/api/tools/s3-upload-url`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ fileName: file.name, fileType: file.type })
          });
          
          if (!urlRes.ok) throw new Error('署名付きURLの取得に失敗しました');
          const { uploadUrl, fileUrl } = await urlRes.json();

          await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('PUT', uploadUrl);
              xhr.setRequestHeader('Content-Type', file.type);
              xhr.upload.addEventListener('progress', (e) => {
                  if (e.lengthComputable) {
                      setUploadProgress(Math.round((e.loaded / e.total) * 100));
                  }
              });
              xhr.onload = () => {
                  setUploadProgress(0);
                  if (xhr.status === 200) resolve(fileUrl);
                  else reject(new Error('S3へのアップロードに失敗しました'));
              };
              xhr.onerror = () => { setUploadProgress(0); reject(new Error('ネットワークエラーが発生しました')); };
              xhr.send(file);
          });

          const uploadedUrl = fileUrl; 

          const payload = {};
          if (type === 'pre_photo') {
              payload.preEventPhotoUrls = [...(project.preEventPhotoUrls || []), uploadedUrl];
          } else if (type === 'illustration') {
              payload.illustrationPanelUrls = [...(project.illustrationPanelUrls || []), uploadedUrl];
          } else if (type === 'illustration_delivery') {
              payload.illustrationDataUrl = uploadedUrl;
              payload.isIllustrationAccepted = false;
          }

          const updateRes = await authenticatedFetch(`${API_URL}/api/projects/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!updateRes.ok) throw new Error('データの保存に失敗しました');

          setProject(prev => ({ ...prev, ...payload }));
          toast.success(type === 'illustration_delivery' ? 'イラストを納品しました！' : '提出が完了しました！', { id: toastId });
      } catch (error) {
          toast.error(error.message, { id: toastId });
      } finally {
          if (type === 'illustration_delivery') setIsIllustrationUploading(false);
          e.target.value = '';
      }
  };

  const handleGenerateAr = async () => {
      if (!arImageFile) return toast.error('画像を選択してください');
      setArGenLoading(true);
      const toastId = toast.loading('ARモデルを生成中...');
      try {
          // 既存のblobURLがあれば解放
          if (arSrc && arSrc.startsWith('blob:')) URL.revokeObjectURL(arSrc);

          const { imageFileToGlbUrl } = await import('@/app/utils/imageToGlb');
          const glbUrl = await imageFileToGlbUrl(arImageFile, Number(arHeight) || 200);
          setArSrc(glbUrl);
          toast.success('ARモデル準備完了！', { id: toastId });
      } catch (err) {
          console.error('AR generate error:', err);
          toast.error('生成に失敗しました', { id: toastId });
      } finally {
          setArGenLoading(false);
      }
  };

  const handleAcceptApplication = useCallback(async (applicationId, amount) => {
      if (user.points < amount) {
          toast.error(`ポイントが不足しています。(不足分: ${amount - user.points}pt) チャージしてください。`);
          return;
      }
      const isConfirmed = await confirm(`本当にこのクリエイターを採用し、${amount.toLocaleString()}pt を支払いますか？\n※ポイントはシステムに一時的に預けられ、納品完了後にクリエイターへ支払われます。`);
      if (!isConfirmed) return;

      const toastId = toast.loading('採用処理中...');
      try {
          const res = await authenticatedFetch(`${API_URL}/api/projects/${id}/applications/${applicationId}/accept`, { method: 'PATCH' });
          if (!res.ok) throw new Error('採用処理に失敗しました');
          toast.success('クリエイターを採用しました！🎉 チャットから挨拶しましょう！', { id: toastId });
          fetchProject();
      } catch (e) { toast.error(e.message, { id: toastId }); }
  }, [user, confirm, authenticatedFetch, id, fetchProject]);

  const handleAcceptIllustration = useCallback(async () => {
      if (!await confirm('イラストを検収し、報酬のポイントをクリエイターに支払いますか？\n※この操作は取り消せません。')) return;

      const toastId = toast.loading('検収・支払い処理中...');
      try {
          const res = await authenticatedFetch(`${API_URL}/api/projects/${id}/illustration/accept`, { method: 'POST' });
          if (!res.ok) throw new Error('検収処理に失敗しました');

          setProject(prev => ({ ...prev, isIllustrationAccepted: true }));
          toast.success('検収が完了し、クリエイターにポイントが支払われました！🎉', { id: toastId });
      } catch (e) {
          toast.error(e.message, { id: toastId });
      }
  }, [confirm, authenticatedFetch, id]);

  const handleRejectIllustration = useCallback(async () => {
      if (!await confirm('イラストを差し戻しますか？（※修正要望はチャットでお伝えください）')) return;

      const toastId = toast.loading('差し戻し中...');
      try {
          const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ illustrationDataUrl: null, isIllustrationAccepted: false })
          });
          if (!res.ok) throw new Error('処理に失敗しました');

          setProject(prev => ({ ...prev, illustrationDataUrl: null, isIllustrationAccepted: false }));
          toast.success('イラストを差し戻しました。チャットで修正内容をお伝えください。', { id: toastId });
      } catch (e) {
          toast.error(e.message, { id: toastId });
      }
  }, [confirm, authenticatedFetch, id]);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return;
    const floristId = activeOffer?.floristId;
    if (!floristId) return;
    setIsSubmittingReview(true);
    const toastId = toast.loading('レビューを投稿中...');
    try {
      const res = await authenticatedFetch(`${API_URL}/api/projects/${project.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: reviewComment, floristId, projectId: project.id }),
      });
      if (!res?.ok) {
        const err = await res?.json();
        throw new Error(err?.message || '投稿失敗');
      }
      toast.success('レビューを投稿しました！ありがとうございます 🌸', { id: toastId });
      setIsReviewModalOpen(false);
      setReviewComment('');
      fetchProject();
    } catch (e) {
      toast.error(e.message || '投稿に失敗しました', { id: toastId });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadIllustration = async (url) => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `illustration_${project.id}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
          toast.error("ダウンロードに失敗しました。直接画像を開いて保存してください。");
          const win = window.open(url, '_blank', 'noopener,noreferrer');
          if (win) win.opener = null;
      }
  };

  const myPledge = useMemo(
    () => user ? (project?.pledges || []).find(p => p.userId === user.id) : null,
    [user, project?.pledges]
  );
  const isPledger = !!myPledge;
  const isPlanner = user && user.id === project?.planner?.id;
  const isFlorist = user && user.role === 'FLORIST';
  const isAssignedIllustrator = user && user?.roles?.includes('ILLUSTRATOR') || user?.role === 'ILLUSTRATOR' && project?.illustratorId === user.id;

  // オファー中（PENDING）または受諾済み（ACCEPTED）のお花屋さんを探す
  const activeOffer = useMemo(
    () => project?.offers?.find(o => o.status === 'ACCEPTED' || o.status === 'PENDING'),
    [project?.offers]
  );
  const floristName = activeOffer?.florist?.shopName || activeOffer?.florist?.platformName || '担当のお花屋さん';

  const progressPercent = useMemo(
    () => project ? Math.min(100, Math.round((project.collectedAmount / project.targetAmount) * 100)) : 0,
    [project?.collectedAmount, project?.targetAmount]
  );

  const isMounted = useIsMounted();

  if (!isMounted) return null;
  if (loading) return (
    <div className="min-h-[100dvh] bg-slate-50 animate-pulse px-4 py-8 max-w-5xl mx-auto space-y-4">
      <div className="h-64 md:h-96 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 bg-slate-200 rounded-full w-3/4" />
          <div className="h-4 bg-slate-100 rounded-full w-full" />
          <div className="h-4 bg-slate-100 rounded-full w-5/6" />
          <div className="h-4 bg-slate-100 rounded-full w-2/3" />
        </div>
        <div className="space-y-3">
          <div className="h-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm" />
          <div className="h-12 bg-pink-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
  if (!project) return <div className="text-center py-32 text-slate-400 font-bold text-lg bg-slate-50 min-h-screen">企画が見つかりませんでした。</div>;

  const totalExpense = useMemo(
    () => (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0),
    [project.expenses]
  );
  const balance = useMemo(
    () => project.collectedAmount - totalExpense,
    [project.collectedAmount, totalExpense]
  );

  // タブコンポーネントに渡す共有コンテキスト
  const tabCtx = {
    project, user, isPlanner, isPledger, isFlorist, isAssignedIllustrator,
    setModalImageSrc, setIsImageModalOpen,
    showAnnouncementForm, setShowAnnouncementForm,
    handlePostAnnouncement,
    announcementTitle, setAnnouncementTitle,
    announcementContent, setAnnouncementContent,
    isPostingAnnouncement,
    cheers, cheerGuestName, setCheerGuestName,
    cheerMessage, setCheerMessage,
    handlePostCheer, isPostingCheer,
    aiSummary, collabTab, setCollabTab,
    activeOffer, socket, setAiSummary, fetchProject,
    newTaskTitle, setNewTaskTitle,
    handleAddTask, handleToggleTask, handleDeleteTask,
    handleUpload, isIllustrationUploading,
    handleAcceptIllustration, handleRejectIllustration,
    handleDownloadIllustration, handleAcceptApplication,
    setIsArModalOpen,
    floristName,
    totalExpense, balance,
    expenseName, setExpenseName,
    expenseAmount, setExpenseAmount,
    handleAddExpense, handleDeleteExpense,
    handlePrint, componentRef, BalanceSheet,
    GroupChat, MoodboardPostForm, MoodboardDisplay, PanelPreviewer,
  };
  const percent = Math.min(Math.round(((project.collectedAmount || 0) / (project.targetAmount || 1)) * 100), 100);
  const isSuccess = percent >= 100;
  const daysLeft = project.deadline
    ? Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const TABS = [
    { id: 'overview',       label: '概要と報告', icon: Book },
    { id: 'updates',        label: 'アップデート', icon: Rss },
    { id: 'backers',        label: '支援者',     icon: Users },
    { id: 'collaboration',  label: '共同作業',   icon: PenTool },
    { id: 'finance',        label: '収支報告',   icon: DollarSign },
    { id: 'discussion',     label: 'Q&A',        icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 md:pb-24 font-sans text-slate-800 relative">

      {/* 戻るボタン（ヒーロー画像上に浮かぶ） */}
      <button
        onClick={() => router.back()}
        className="fixed top-0 left-0 z-40 m-4 w-10 h-10 bg-slate-900/50 hover:bg-slate-900/70 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-colors active:scale-95"
        style={{ marginTop: 'calc(1rem + env(safe-area-inset-top))' }}
        aria-label="戻る"
      >
        <ChevronLeft size={20} />
      </button>

      {/* --- HERO IMAGE --- */}
      <div className="w-full max-w-6xl mx-auto md:px-4 lg:px-8 md:mt-6 mb-4 md:mb-8">
        {project.status !== 'COMPLETED' ? (
            <div className="relative w-full aspect-[4/3] md:aspect-[21/9] md:rounded-[2rem] overflow-hidden shadow-sm group cursor-zoom-in" onClick={() => { if(project.imageUrl){setModalImageSrc(project.imageUrl); setIsImageModalOpen(true);} }}>
                {project.imageUrl ? (
                    <Image src={project.imageUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex flex-col items-center justify-center">
                        <ImageIcon className="text-slate-400 mb-2" size={48} />
                        <span className="text-slate-400 font-bold text-sm">NO IMAGE</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-10 w-full">
                    <div className="mb-2"><OfficialBadge projectId={project.id} isPlanner={isPlanner} /></div>
                    <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md"><JpText>{project.title}</JpText></h1>
                </div>
            </div>
        ) : (
            <div className="p-6 md:p-16 bg-gradient-to-br from-amber-400 to-orange-500 md:rounded-[2.5rem] shadow-lg text-center relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                <div className="relative z-10">
                    <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 md:mb-6 shadow-sm border border-white/20">Project Completed</span>
                    <h2 className="text-2xl md:text-5xl font-black tracking-tighter mb-6 md:mb-8 drop-shadow-md">🎉 企画完了 🎉</h2>
                    <div className="bg-white/10 backdrop-blur-md p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 text-left max-w-3xl mx-auto">
                        <h4 className="font-black mb-2 md:mb-3 text-xs md:text-sm flex items-center gap-2"><MessageCircle size={16}/> 企画者からのメッセージ</h4>
                        <p className="whitespace-pre-wrap leading-relaxed text-xs md:text-base font-bold">{project.completionComment}</p>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/20 mt-4">
                            <p className="text-xs md:text-sm font-black text-white/90">完成したフラスタをみんなに報告しよう！</p>
                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-sm inline-flex">
                                <ShareButtons
                                  text={`${project.title} のフラスタ企画が無事に完了しました！ご支援いただいた皆様、ありがとうございました✨`}
                                />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap justify-center gap-3">
                          {myPledge && (
                            <a
                              href={`${API_URL}/api/projects/${project.id}/certificate/${myPledge.id}`}
                              download={`flastal-certificate-${project.id}.pdf`}
                              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-amber-600 font-black text-sm rounded-2xl shadow-lg hover:bg-amber-50 active:scale-95 transition-all"
                            >
                              <Download size={16} />
                              参加証明書をDL
                            </a>
                          )}
                          <Link
                            href={`/qr/${project.id}`}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur text-white font-black text-sm rounded-2xl border border-white/30 hover:bg-white/30 active:scale-95 transition-all"
                          >
                            <ImageIcon size={16} />
                            完成ギャラリーを見る
                          </Link>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* パンくずリスト */}
      <nav aria-label="パンくずリスト" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 text-xs text-slate-400 mb-4">
        <Link href="/" className="hover:text-slate-600 transition-colors flex items-center gap-0.5">
          <Home size={12} />
          <span>ホーム</span>
        </Link>
        <ChevronRight size={12} className="flex-shrink-0" />
        <Link href="/projects" className="hover:text-slate-600 transition-colors">
          企画一覧
        </Link>
        <ChevronRight size={12} className="flex-shrink-0" />
        <span className="text-slate-600 truncate max-w-[200px]" aria-current="page">
          {project?.title || '企画詳細'}
        </span>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12 relative z-10">
        
        {/* --- MAIN COLUMN --- */}
        <div className="lg:col-span-8 space-y-5 md:space-y-6">
          
          <AppCard className="!p-0 overflow-hidden">
            {/* プランナー + ステータス */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-50">
              <Link href={`/users/${project.planner?.id}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                  {project.planner?.iconUrl
                    ? <Image src={project.planner.iconUrl} alt={project.planner?.name || 'プランナー'} width={40} height={40} className="object-cover w-10 h-10"/>
                    : <User size={18} className="text-slate-400 m-auto mt-3"/>}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organizer</p>
                  <p className="font-black text-slate-800 text-sm leading-tight group-hover:text-pink-500 transition-colors">
                    {project.planner?.handleName || project.planner?.name || '不明'}
                  </p>
                </div>
              </Link>
              <span className={cn(
                "px-3 py-1.5 rounded-full text-xs font-black tracking-wider border",
                project.status === 'FUNDRAISING' ? 'bg-pink-50 text-pink-600 border-pink-200' :
                project.status === 'SUCCESSFUL' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                project.status === 'COMPLETED' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                'bg-slate-100 text-slate-500 border-slate-200'
              )}>
                {project.status === 'FUNDRAISING' ? '募集中' :
                 project.status === 'SUCCESSFUL' ? '目標達成' :
                 project.status === 'COMPLETED' ? '完了' :
                 project.status === 'CANCELED' ? '中止' : project.status}
              </span>
            </div>

            {/* タイトル + メタ */}
            <div className="px-5 sm:px-6 pt-5 pb-4">
              <div className="mb-2"><OfficialBadge projectId={project.id} isPlanner={isPlanner} /></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-4">
                <JpText>{project.title}</JpText>
              </h1>
              <div className="flex flex-wrap gap-2">
                {project.deliveryDateTime && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-pink-700 bg-pink-50 px-2.5 py-1.5 rounded-xl border border-pink-100">
                    <Calendar size={12} className="text-pink-400"/>
                    {new Date(project.deliveryDateTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-100 max-w-[220px]">
                  <MapPin size={12} className="text-rose-400 shrink-0"/>
                  <span className="truncate">{project.venue?.venueName || project.deliveryAddress || '場所未定'}</span>
                </span>
                {project.size && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    □ {project.size}
                  </span>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <ShareButtons
                  url={`https://www.flastal.com/projects/${project.id}`}
                  text={`「${project.title}」を一緒に応援しよう！`}
                  hashtags="FLASTAL,フラスタ"
                />
              </div>
            </div>

            {/* プログレスセクション */}
            <div className="px-5 sm:px-6 py-5 bg-gradient-to-br from-pink-50/40 to-rose-50/20 border-t border-slate-50">
              <div className="flex items-center gap-4 mb-4">
                {/* リングプログレス */}
                <div className="relative shrink-0 w-[72px] h-[72px]">
                  <svg className="-rotate-90 w-[72px] h-[72px]" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="29" fill="none" stroke="#f1f5f9" strokeWidth="7"/>
                    <circle
                      cx="36" cy="36" r="29" fill="none"
                      stroke={isSuccess ? '#34d399' : 'url(#ringGrad)'}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 29}`}
                      strokeDashoffset={`${2 * Math.PI * 29 * (1 - percent / 100)}`}
                    />
                    <defs>
                      <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f472b6"/>
                        <stop offset="100%" stopColor="#fb7185"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-sm font-black leading-none", isSuccess ? "text-emerald-500" : "text-pink-500")}>
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* 金額 */}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">現在の支援総額</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter leading-none">
                    ¥{(project.collectedAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">
                    目標 ¥{(project.targetAmount || 0).toLocaleString()}
                    <span className="mx-1.5 text-slate-200">|</span>
                    1口 ¥{(project.minContributionAmount || 1000).toLocaleString()}〜
                  </p>
                </div>

                {/* 残り時間カウントダウン */}
                {project.status === 'FUNDRAISING' && project.deadline && (
                  <CountdownTimer deadline={project.deadline} className="shrink-0" />
                )}
              </div>

              {/* プログレスバー */}
              <div className="w-full bg-white rounded-full h-2.5 overflow-hidden shadow-inner mb-2">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  className={cn("h-full rounded-full", isSuccess ? "bg-gradient-to-r from-emerald-400 to-green-400" : "bg-gradient-to-r from-pink-400 to-rose-400")}
                />
              </div>
              <UpsellAlert target={project.targetAmount} collected={project.collectedAmount} />
            </div>

            {/* 支援者アバター列 */}
            {project.pledges && project.pledges.length > 0 && (
              <div className="px-5 sm:px-6 py-3.5 flex items-center gap-3 border-t border-slate-50">
                <div className="flex -space-x-2">
                  {project.pledges.slice(0, 7).map((pledge, i) => (
                    <div key={pledge.id || i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm shrink-0">
                      {pledge.user?.iconUrl
                        ? <Image src={pledge.user.iconUrl} alt={pledge.user?.nickname || 'サポーター'} width={32} height={32} className="object-cover w-8 h-8"/>
                        : <div className="w-8 h-8 bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center">
                            <span className="text-xs font-black text-pink-600">
                              {(pledge.user?.handleName || '?')[0]}
                            </span>
                          </div>
                      }
                    </div>
                  ))}
                  {project.pledges.length > 7 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm shrink-0">
                      <span className="text-[9px] font-black text-slate-500">+{project.pledges.length - 7}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-500">
                  <span className="font-black text-slate-800">{project.pledges.length}</span> 人が支援中
                </p>
              </div>
            )}

            {/* 締切ポリシー */}
            {project.status === 'FUNDRAISING' && (
              <div className="px-5 sm:px-6 py-4 border-t border-slate-50">
                <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <Clock size={15} className="text-rose-400 mt-0.5 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-rose-600">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString('ja-JP') + ' 23:59 締切'
                          : '締切日未定'}
                      </span>
                      {user?.role === 'ADMIN' && (
                        <button onClick={() => setShowDeadlineModal(true)} aria-label="締切日を編集" className="p-2 bg-white text-slate-400 hover:text-rose-500 border border-slate-200 rounded-full transition-all shadow-sm">
                          <PenTool size={11}/>
                        </button>
                      )}
                    </div>
                    <ul className="space-y-1">
                      <li className="text-xs font-bold text-rose-700 flex items-start gap-1">
                        <span className="shrink-0">※</span>
                        <span>目標達成時点で即時締め切り・発注確定します</span>
                      </li>
                      <li className="text-xs font-bold text-rose-700 flex items-start gap-1">
                        <span className="shrink-0">※</span>
                        <span>未達の場合は自動中止・<strong>支援額全額返還</strong>されます</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* シェア */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-50">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 w-full">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                  <Share2 size={13}/> Share
                </span>
                <ShareButtons text={`${project.title} のフラスタ企画が進行中！一緒に参加しませんか？🌸`}/>
              </div>
            </div>
          </AppCard>

          {showGuestBanner && (
            <div className="bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-2xl p-5 mb-4 relative">
              <button
                onClick={() => setShowGuestBanner(false)}
                aria-label="バナーを閉じる"
                className="absolute top-3 right-3 text-white/70 hover:text-white text-lg leading-none"
              >✕</button>
              <p className="text-lg font-black mb-1">🎉 支援ありがとうございます！</p>
              <p className="text-sm text-white/90 mb-3">
                アカウントを作ると支援履歴の確認・ポイント獲得・完成通知の受け取りができます。
              </p>
              <div className="flex gap-2">
                <a
                  href="/auth/register"
                  className="flex-1 bg-white text-pink-600 font-black text-sm py-2 rounded-xl text-center hover:bg-pink-50 transition-colors"
                >
                  無料でアカウント作成
                </a>
                <a
                  href="/auth/login"
                  className="px-4 bg-white/20 text-white font-semibold text-sm py-2 rounded-xl hover:bg-white/30 transition-colors"
                >
                  ログイン
                </a>
              </div>
            </div>
          )}

          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex overflow-x-auto w-full mb-2 md:mb-4 no-scrollbar sticky top-[60px] md:top-[80px] z-30">
              {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                    className={cn(
                      "flex-1 min-w-[100px] py-2.5 md:py-3 rounded-lg font-black text-xs md:text-sm flex justify-center items-center gap-1.5 transition-all duration-200",
                      activeTab === tab.id ? 'bg-pink-500 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    )}>
                      <tab.icon size={14} className={activeTab === tab.id ? "text-white" : ""}/>
                      <span>{tab.label}</span>
                  </button>
              ))}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              

              {activeTab === 'overview'      && <OverviewTab      ctx={tabCtx} />}
              {activeTab === 'updates'       && <UpdatesTab       ctx={tabCtx} />}
              {activeTab === 'backers'       && <BackersTab       ctx={tabCtx} />}
              {activeTab === 'collaboration' && <CollaborationTab ctx={tabCtx} />}
              {activeTab === 'finance'       && <FinanceTab       ctx={tabCtx} />}
              {activeTab === 'discussion'    && <DiscussionTab    ctx={tabCtx} />}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- SIDEBAR --- */}
        <div id="pledge-section" className="lg:col-span-4 space-y-5 md:space-y-6">
          <div className="sticky top-24 space-y-5 md:space-y-6">
              <PledgeForm project={project} user={user} onPledgeSubmit={onPledgeSubmit} isPledger={isPledger} />
              {isPlanner && (
                  <AppCard id="planner-menu" className="!p-5 md:!p-6 bg-slate-50 border-slate-200 shadow-xl">
                      <div className="flex items-center gap-2 mb-6">
                          <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center border border-pink-200">
                              <Award size={16} className="text-pink-500"/>
                          </div>
                          <h3 className="text-sm font-black text-slate-800 tracking-widest">企画者メニュー</h3>
                      </div>
                      <div className="space-y-3">
                          <button 
                             onClick={()=>setIsTargetAmountModalOpen(true)} 
                             className="w-full text-left p-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center group shadow-sm"
                          >
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                 <DollarSign className="text-emerald-500" size={16}/>
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-800">目標金額を変更する</p>
                              </div>
                          </button>

                          <Link href={`/projects/edit/${id}`} className="w-full text-left p-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center group shadow-sm">
                              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                 <Edit3 className="text-pink-500" size={16}/>
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-800">企画内容を編集する</p>
                              </div>
                          </Link>

                          <Link href={`/projects/${id}/analytics`} className="w-full text-left p-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center group shadow-sm">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                 <BarChart2 className="text-sky-500" size={16}/>
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-800">アナリティクスを見る</p>
                                 <p className="text-xs text-slate-400">閲覧数・CVR・日別推移</p>
                              </div>
                          </Link>

                          {/* QRコードダウンロード（企画者・FLORIST・ADMIN向け） */}
                          {(isPlanner || user?.role === 'FLORIST' || user?.role === 'ADMIN') && (
                              <a
                                  href={`${API_URL}/api/projects/${project.id}/qr`}
                                  download="flastal-qr.png"
                                  className="w-full text-left p-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center group shadow-sm"
                              >
                                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                      <Download className="text-violet-500" size={16}/>
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-slate-800">QRコードをダウンロード</p>
                                      <p className="text-xs text-slate-400">シールに貼って支援者が見られます</p>
                                  </div>
                              </a>
                          )}

                          {/* ▼▼▼ ここから条件分岐を修正 ▼▼▼ */}
                          {project?.quotation && project.quotation.isApproved === false ? (
                              // 1. 見積もりが届いて未承認の場合
                              <button onClick={()=>setIsQuotationModalOpen(true)} className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl text-sm font-black transition-all hover:brightness-110 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2">
                                  <FileText size={18}/> 見積もりを承認して発注
                              </button>
                          ) : activeOffer ? (
                              // 2. オファー中・お花屋さんが決定している場合（探すボタンの代わりにチャットボタンを表示）
                              <Link href={`/projects/${project.id}/florist-chat`} className="w-full text-left p-4 bg-pink-500 hover:bg-pink-600 border border-pink-400 rounded-2xl transition-all flex items-center group shadow-md mt-4">
                                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                      <MessageSquare className="text-white" size={16}/>
                                  </div>
                                  <div>
                                      <p className="text-sm font-black text-white">{floristName} と相談</p>
                                      <p className="text-xs font-bold text-pink-100">
                                          {activeOffer.status === 'PENDING' ? '※お花屋さんの返答・見積り待ち' : '※機密チャット（支援者には非公開）'}
                                      </p>
                                  </div>
                              </Link>
                          ) : (
                              // 3. まだお花屋さんが決まっていない場合
                              <Link href={`/florists?projectId=${id}`} className="w-full text-left p-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center group shadow-sm mt-4">
                                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                     <Search className="text-pink-500" size={16}/>
                                 </div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-800">お花屋さんを探す</p>
                                  </div>
                              </Link>
                          )}
                          {/* ▲▲▲ 条件分岐の修正ここまで ▲▲▲ */}

                          {project?.status === 'SUCCESSFUL' && (
                              <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl text-sm font-black transition-colors shadow-md flex justify-center items-center gap-2">
                                  <CheckCircle2 size={18}/> 完了報告をする
                              </button>
                          )}
                          {project?.status !== 'CANCELED' && project?.status !== 'COMPLETED' && (
                             <button
                                 onClick={() => setIsCancelModalOpen(true)}
                                 className="w-full mt-4 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-500 p-4 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 group shadow-sm"
                             >
                                 <AlertTriangle size={16} className="text-rose-400 group-hover:scale-110 transition-transform"/>
                                 企画を中止して精算する
                             </button>
                         )}

                          {/* フロリストレビュー (完了後・担当フロリストがいる場合のみ) */}
                          {project?.status === 'COMPLETED' && activeOffer?.floristId && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              {project.review ? (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                  <p className="text-xs font-black text-emerald-600 mb-1.5 flex items-center gap-1.5">
                                    <CheckCircle2 size={12}/> レビュー投稿済み
                                  </p>
                                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{project.review.comment}</p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setIsReviewModalOpen(true)}
                                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black transition-colors shadow-md flex items-center justify-center gap-2"
                                >
                                  <Star size={16}/> {floristName} をレビューする
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                  </AppCard>
              )}
              <div className="text-center pt-1 md:pt-2">
                <button onClick={() => setReportModalOpen(true)} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                  <AlertTriangle size={10} className="md:w-3 md:h-3"/> 問題を報告する
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Sticky Bottom Action Bar --- */}
      {project.status === 'FUNDRAISING' && !isPledger && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-white/95 backdrop-blur-xl border-t border-slate-200 z-[80] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex gap-2 max-w-xl mx-auto">
                <button
                  onClick={handleQuickCheer}
                  className={`px-4 py-3.5 rounded-xl font-black border text-sm active:scale-95 transition-all flex items-center gap-1.5 ${quickCheerSent ? 'bg-pink-50 border-pink-200 text-pink-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                  title="応援する"
                  aria-label="応援する"
                >
                  <Heart size={16} className={quickCheerSent ? 'fill-pink-400 text-pink-400' : ''} />
                  {cheers?.length ?? 0}
                </button>
                <button onClick={() => {
                    document.getElementById('pledge-section')?.scrollIntoView({ behavior: 'smooth' });
                }} className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-black shadow-md shadow-pink-200 flex justify-center items-center gap-2 text-sm active:scale-95 transition-transform">
                    <Heart size={16} className="text-pink-200 fill-pink-200" />
                    プロジェクトを支援する
                </button>
                {isPlanner && (
                    <button onClick={() => {
                        document.getElementById('planner-menu')?.scrollIntoView({ behavior: 'smooth' });
                    }} className="px-4 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black border border-slate-200 text-sm active:scale-95 transition-transform">
                        管理
                    </button>
                )}
            </div>
        </div>
      )}

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isImageModalOpen && <ImageLightbox url={modalImageSrc} onClose={() => setIsImageModalOpen(false)} />}
        {isReportModalOpen && <ReportModal projectId={id} user={user} onClose={() => setReportModalOpen(false)} />}
        {isCompletionModalOpen && <CompletionReportModal project={project} user={user} onClose={() => setIsCompletionModalOpen(false)} onReportSubmitted={fetchProject} />}
        {isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={() => setIsReviewModalOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Star size={20} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">{floristName} をレビュー</h2>
                  <p className="text-xs font-bold text-slate-400">企画を通じた感想を書きましょう</p>
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="お花屋さんへの感謝や仕上がりの感想など…"
                rows={4}
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm text-slate-800 font-medium outline-none focus:ring-2 focus:ring-amber-200 resize-none placeholder:text-slate-400 border border-transparent focus:border-amber-200"
              />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm active:scale-95 transition-transform">
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewComment.trim() || isSubmittingReview}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black text-sm shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {isSubmittingReview ? '投稿中...' : '投稿する'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccessModal && project && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* emoji burst */}
              <div className="text-5xl mb-3">🌸</div>
              <h2 className="text-xl font-black text-slate-900 mb-1">支援ありがとうございます！</h2>
              <p className="text-sm font-bold text-slate-500 mb-1">
                <span className="text-pink-500">{project.title}</span> の企画を応援しています
              </p>
              <p className="text-xs text-slate-400 mb-5">
                フラスタが完成するのを一緒に楽しみにしましょう 🎉
              </p>

              {/* Share */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <p className="text-xs font-black text-slate-500 mb-3">シェアして仲間を増やそう</p>
                <div className="flex justify-center">
                  <ShareButtons
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/projects/${project.id}`}
                    text={`「${project.title}」のフラスタ企画に支援しました！一緒に応援しませんか？🌸`}
                    hashtags="FLASTAL,フラスタ,応援"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl text-sm shadow-lg shadow-pink-200 active:scale-95 transition-transform"
              >
                企画詳細を見る
              </button>
            </motion.div>
          </motion.div>
        )}
        {isInstructionModalOpen && <InstructionSheetModal project={project} onClose={() => setIsInstructionModalOpen(false)} />}
        {isQuotationModalOpen && <QuotationApprovalModal project={project} user={user} onClose={() => setIsQuotationModalOpen(false)} onUpdate={fetchProject} />}
        {isCancelModalOpen && (
             <ProjectCancelModal 
                 isOpen={isCancelModalOpen} 
                 onClose={() => setIsCancelModalOpen(false)} 
                 project={project} 
                 onCancelComplete={() => { 
                     fetchProject(); // データを再取得して画面のステータスを更新
                     toast.success('企画を中止し、支援者へポイントを返還しました。');
                     router.push('/projects'); // 一覧に戻す
                 }} 
             />
         )}
        {isTargetAmountModalOpen && (
             <TargetAmountModal 
                 project={project} 
                 user={user} 
                 onClose={() => setIsTargetAmountModalOpen(false)} 
                 onUpdate={fetchProject} 
             />
         )}

        {showDeadlineModal && (
             <DeadlineEditModal 
                 project={project} 
                 onClose={() => setShowDeadlineModal(false)} 
                 onUpdate={fetchProject} 
                 authenticatedFetch={authenticatedFetch}
             />
        )}
        {isArModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[100] p-4 backdrop-blur-md" onClick={() => setIsArModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh] border border-white" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-lg text-slate-800 flex items-center"><Box className="mr-2 text-slate-500"/> ARシミュレーター</h3>
                  <button onClick={() => setIsArModalOpen(false)} aria-label="閉じる" className="bg-white hover:bg-slate-100 rounded-full p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors shadow-sm"><X size={20}/></button>
              </div>
              <div className="p-8 overflow-y-auto">
                {!arSrc ? (
                    <div className="space-y-8">
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed">お持ちの画像や完了写真をアップロードして、<br/>実際のサイズ感で部屋に配置してみましょう🌸</p>
                        </div>
                        <div className="space-y-4">
                            <div className="p-8 border-2 border-dashed border-pink-200 bg-pink-50/50 rounded-[2rem] hover:bg-pink-50 transition-colors text-center cursor-pointer relative" onClick={() => document.getElementById('ar-upload').click()}>
                                {arImageFile ? (
                                    <div><p className="text-sm font-black text-emerald-500 mb-1 flex items-center justify-center"><Check className="mr-1"/> 選択済み</p><p className="text-xs font-bold text-slate-400">{arImageFile.name}</p></div>
                                ) : (
                                    <div><UploadCloud className="w-10 h-10 text-pink-300 mx-auto mb-3" /><p className="text-sm font-black text-slate-600">画像をアップロード</p></div>
                                )}
                                <input id="ar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setArImageFile(e.target.files[0])} />
                            </div>
                            <div className="bg-slate-50 p-5 rounded-[1.5rem] flex items-center gap-4 border border-slate-100">
                                <span className="text-xs font-black text-slate-500 whitespace-nowrap uppercase tracking-widest">高さ (cm)</span>
                                <input type="number" value={arHeight} onChange={(e) => setArHeight(e.target.value)} className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-slate-800 outline-none focus:border-slate-300"/>
                            </div>
                        </div>
                        <button onClick={handleGenerateAr} disabled={arGenLoading || !arImageFile} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center shadow-lg">{arGenLoading ? <><Loader2 className="animate-spin mr-2"/> 生成中...</> : 'ARモデルを生成する'}</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <p className="text-sm text-center text-slate-600 mb-6 font-bold leading-relaxed">カメラを起動して、平らな床に向けてください。<br/>高さ <strong className="text-pink-500">{arHeight}cm</strong> のパネルが表示されます。</p>
                        <div className="w-full aspect-[3/4] bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-800"><ArViewer src={arSrc} alt="AR" /></div>
                        <button onClick={() => { if (arSrc?.startsWith('blob:')) URL.revokeObjectURL(arSrc); setArSrc(null); setArImageFile(null); }} className="mt-8 px-6 py-3 bg-slate-100 rounded-full text-sm font-black text-slate-500 flex items-center hover:bg-slate-200 transition-colors"><RefreshCw className="mr-2" size={16}/> 別の画像で試す</button>
                        <div className="w-full mt-6">
                          <OshiAvatarUpload projectId={id} onGenerated={(url) => { toast.success('アバターを追加しました！'); }} />
                        </div>
                    </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* アップロード進捗バー */}
      {uploadProgress > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4">
          <p className="text-xs font-black text-slate-500 mb-2">アップロード中... {uploadProgress}%</p>
          <ProgressBar value={uploadProgress} animate={false} />
        </div>
      )}

      {/* 確認ダイアログ */}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}