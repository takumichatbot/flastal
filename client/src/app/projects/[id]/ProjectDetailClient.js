'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Markdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
import { 
  Clock, MapPin, User, Heart, Share2, MessageCircle, 
  CheckCircle2, AlertTriangle, DollarSign, Calendar, 
  ChevronLeft, Send, Image as ImageIcon, 
  Award, Plus, Search, Loader2, X,
  FileText, Printer, Info, Lock, PenTool, Check, Wand2, 
  MessageSquare, Trash2, Box, UploadCloud, RefreshCw, Pen, Book, Users, Sparkles, Edit3
} from 'lucide-react';

// --- Components ---
import VenueLogisticsWiki from '@/app/components/VenueLogisticsWiki';
import MoodboardPostForm from '@/app/components/MoodboardPostForm';
import MoodboardDisplay from '@/app/components/MoodboardDisplay';
import OfficialBadge from '@/app/components/OfficialBadge';
import UpsellAlert from '@/app/components/UpsellAlert';
import FlowerScrollIndicator from '@/app/components/FlowerScrollIndicator';
import PanelPreviewer from '@/app/components/PanelPreviewer';
import GroupChat from './components/GroupChat';
import CompletionReportModal from './components/CompletionReportModal';
import ReportModal from './components/ReportModal';
import VenueRegulationCard from '@/app/components/VenueRegulationCard';
import { BalanceSheet } from '@/app/components/BalanceSheet';

import FloristMaterialModal from '@/components/project/FloristMaterialModal';
import ProjectCancelModal from '@/components/project/ProjectCancelModal';

// Dynamic Import
const ArViewer = dynamic(() => import('@/app/components/ArViewer'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const PROGRESS_STEPS = [
  { key: 'FUNDRAISING', label: '募集中', order: 0 },
  { key: 'OFFER_ACCEPTED', label: 'オファー確定', order: 1 },
  { key: 'DESIGN_FIXED', label: 'デザイン決定', order: 2 },
  { key: 'MATERIAL_PREP', label: '資材手配中', order: 3 },
  { key: 'PRODUCTION_IN_PROGRESS', label: '制作中', order: 4 },
  { key: 'READY_FOR_DELIVERY', label: '配送完了', order: 5 },
  { key: 'COMPLETED', label: '完了', order: 6 }
];

// Helper
function cn(...classes) { return classes.filter(Boolean).join(' '); }
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
  <div id={id} className={cn("bg-white rounded-2xl md:rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 md:p-8", className)}>
    {children}
  </div>
);

function ImageLightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/95 flex justify-center items-center z-[100] p-4 backdrop-blur-md" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[110] border border-white/20">
        <X size={24} />
      </button>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <img src={url} alt="Enlarged" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
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
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><body>${contentHtml}<script>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white">
        <div className="p-4 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg md:text-xl font-black flex items-center text-slate-800"><FileText className="mr-2 text-sky-500"/> 制作指示書プレビュー</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
        </div>
        <div className="flex-grow p-4 md:p-8 bg-white text-sm overflow-y-auto prose prose-sm">
             <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 shadow-sm">閉じる</button>
          <button onClick={handlePrint} className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
            <Printer size={16}/> 印刷 / PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ★ 新規: 見積もり承認・発注モーダル
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
    <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[100] p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh] border border-white">
        <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><FileText className="text-pink-500" size={24}/> 見積もりの承認・発注</h2>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-1">お花屋さんの制作を開始するために支払い方法を選んでください</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
        </div>
        
        <div className="p-5 md:p-8 overflow-y-auto bg-slate-50/50 space-y-5">
            {/* 金額サマリー */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">お見積り総額</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{quotationAmount.toLocaleString()} <span className="text-sm font-bold text-slate-500">pt</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">現在の支援額</p>
                    <p className="text-xl font-black text-sky-500 tracking-tight">{collectedAmount.toLocaleString()} <span className="text-sm font-bold text-sky-300">pt</span></p>
                </div>
            </div>

            <h3 className="font-black text-slate-700 text-xs md:text-sm uppercase tracking-widest">支払い方法の選択</h3>
            
            <form id="approvalForm" onSubmit={handleApprove} className="space-y-3">
                {/* 1. FULL */}
                <label className={cn("block p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all relative overflow-hidden", canFull ? (approvalMethod === 'FULL' ? 'border-sky-500 bg-sky-50/30 shadow-md ring-4 ring-sky-50' : 'border-slate-200 bg-white hover:border-sky-300') : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')}>
                    <input type="radio" value="FULL" disabled={!canFull} checked={approvalMethod === 'FULL'} onChange={(e)=>setApprovalMethod(e.target.value)} className="hidden" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2"><CheckCircle2 size={18} className={approvalMethod === 'FULL' ? 'text-sky-500' : 'text-slate-300'}/> 見積り通りに発注</p>
                            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">集まった支援額から全額支払います。</p>
                            {!canFull && <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12}/>支援額が {shortfall.toLocaleString()} pt不足しています</p>}
                        </div>
                    </div>
                </label>

                {/* 2. GUARANTEE (立替) */}
                {shortfall > 0 && (
                    <label className={cn("block p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all relative overflow-hidden", canGuarantee ? (approvalMethod === 'GUARANTEE' ? 'border-pink-500 bg-pink-50/30 shadow-md ring-4 ring-pink-50' : 'border-slate-200 bg-white hover:border-pink-300') : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')}>
                        <input type="radio" value="GUARANTEE" disabled={!canGuarantee} checked={approvalMethod === 'GUARANTEE'} onChange={(e)=>setApprovalMethod(e.target.value)} className="hidden" />
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2"><CheckCircle2 size={18} className={approvalMethod === 'GUARANTEE' ? 'text-pink-500' : 'text-slate-300'}/> 不足分を立て替える <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-md text-[10px] tracking-wider ml-1">推奨</span></p>
                                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">あなたの所持ポイントから不足分 <b className="text-pink-500">{shortfall.toLocaleString()} pt</b> を支払って今すぐ発注します。※募集はイベント直前まで継続できます。</p>
                                {!canGuarantee && <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12}/>所持ポイントが不足しています (所持: {userPoints.toLocaleString()} pt)</p>}
                            </div>
                        </div>
                    </label>
                )}

                {/* 3. FLEXIBLE (おまかせ) */}
                {shortfall > 0 && (
                    <label className={cn("block p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all relative overflow-hidden", canFlexible ? (approvalMethod === 'FLEXIBLE' ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-4 ring-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300') : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')}>
                        <input type="radio" value="FLEXIBLE" disabled={!canFlexible} checked={approvalMethod === 'FLEXIBLE'} onChange={(e)=>setApprovalMethod(e.target.value)} className="hidden" />
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2"><CheckCircle2 size={18} className={approvalMethod === 'FLEXIBLE' ? 'text-emerald-500' : 'text-slate-300'}/> おまかせ発注 (金額に合わせて作成)</p>
                                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">現在の支援総額 <b className="text-emerald-500">{collectedAmount.toLocaleString()} pt</b> に合わせて、お花屋さんにデザインと予算を調整して作ってもらいます。</p>
                                {!canFlexible && <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12}/>おまかせプランは1,000 pt以上集まっている必要があります</p>}
                            </div>
                        </div>
                    </label>
                )}
            </form>
        </div>

        <div className="p-5 md:p-6 bg-white border-t border-slate-100">
            <button type="submit" form="approvalForm" disabled={!approvalMethod || isSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                この内容で発注を確定する
            </button>
        </div>
      </motion.div>
    </div>
  );
}

function PledgeForm({ project, user, onPledgeSubmit, isPledger }) {
  const { register, handleSubmit, formState: { isSubmitting }, reset, watch } = useForm({
    defaultValues: { pledgeType: 'tier', selectedTierId: project.pledgeTiers?.[0]?.id || '', pledgeAmount: '', comment: '', guestName: '', guestEmail: '' }
  });
  const pledgeType = watch('pledgeType');
  const selectedTierId = watch('selectedTierId');
  const selectedTier = project.pledgeTiers?.find(t => t.id === selectedTierId);
  const finalAmount = pledgeType === 'tier' && selectedTier ? selectedTier.amount : parseInt(watch('pledgeAmount')) || 0;

  const onSubmit = async (data) => {
    if (finalAmount <= 0) return toast.error('支援金額は1円以上である必要があります。');
    if (user) {
        onPledgeSubmit({
            projectId: project.id, userId: user.id, comment: data.comment,
            tierId: pledgeType === 'tier' ? data.selectedTierId : undefined,
            amount: pledgeType === 'free' ? parseInt(data.pledgeAmount) : finalAmount, 
        });
        reset();
    } else {
        const loadingToast = toast.loading('Stripe決済ページへ移動中...');
        try {
            const res = await fetch(`${API_URL}/api/payment/checkout/create-guest-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.id, amount: finalAmount, comment: data.comment,
                    tierId: pledgeType === 'tier' ? data.selectedTierId : undefined,
                    guestName: data.guestName, guestEmail: data.guestEmail,
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
          <AppCard className="text-center bg-gradient-to-b from-sky-50 to-white border-2 border-sky-100">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-sky-100 rounded-full text-sky-500 mb-3 shadow-inner"><CheckCircle2 size={24} /></div>
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
              {project.pledgeTiers.map(tier => (
                <label key={tier.id} className={cn("block p-4 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all relative overflow-hidden", selectedTierId === tier.id ? 'border-pink-500 bg-pink-50/30' : 'border-slate-100 bg-white hover:border-slate-200')}>
                  <input type="radio" {...register('selectedTierId')} value={tier.id} className="hidden" />
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xl md:text-2xl text-slate-800 tracking-tight">{tier.amount.toLocaleString()} <span className="text-xs font-bold text-slate-400">{user ? 'pt' : '円'}</span></span>
                    {selectedTierId === tier.id ? <CheckCircle2 className="text-pink-500 fill-pink-100" size={20}/> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"/>}
                  </div>
                  <span className="text-xs md:text-sm font-bold text-pink-500 block mb-1">{tier.title}</span>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">{tier.description}</p>
                </label>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-xs font-bold text-slate-500">現在、設定されているコースはありません。</p>
              <button type="button" onClick={() => reset({ pledgeType: 'free' })} className="text-pink-500 text-xs font-bold mt-2 hover:underline">金額を指定して支援する</button>
            </div>
          )
        ) : null}

        {pledgeType === 'free' && (
          <div>
            <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">支援金額 ({user ? 'pt' : '円'})</label>
            <input type="number" {...register('pledgeAmount')} min="100" className="w-full p-3.5 bg-slate-50 border-transparent rounded-xl text-xl font-black text-slate-800 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition-all" placeholder="例: 3000"/>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5 ml-1">※好きな金額を入力できます</p>
          </div>
        )}

        {!user && (
            <div className="pt-3 space-y-2 border-t border-slate-100">
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ゲスト情報</p>
              <input type="text" {...register('guestName')} className="w-full p-3.5 bg-slate-50 border-transparent rounded-xl text-xs md:text-sm font-bold focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 outline-none transition-all" placeholder="お名前 (ハンドルネーム)"/>
              <input type="email" {...register('guestEmail')} className="w-full p-3.5 bg-slate-50 border-transparent rounded-xl text-xs md:text-sm font-bold focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 outline-none transition-all" placeholder="メールアドレス"/>
            </div>
        )}

        <motion.button 
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting || finalAmount <= 0} 
            className="w-full py-3.5 md:py-4 font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl md:rounded-2xl disabled:opacity-50 flex justify-center items-center gap-2 text-sm md:text-base transition-colors"
        >
            {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} className="text-pink-400"/>}
            {isSubmitting ? '処理中...' : (user ? 'ポイントで支援する' : '決済へ進む')}
        </motion.button>
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
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-[100] p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-white">
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg md:text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><DollarSign className="text-pink-500"/> 目標金額の変更</h2>
          <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} min={project.collectedAmount} required className="w-full p-4 border-2 border-slate-100 rounded-xl font-black text-xl md:text-2xl text-slate-800 focus:border-pink-400 outline-none mb-6 transition-colors" />
          <div className="flex justify-end gap-2 md:gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">キャンセル</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 shadow-md transition-colors">保存</button>
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
  const { id } = params;
  
  const [activeTab, setActiveTab] = useState('overview'); 
  const [collabTab, setCollabTab] = useState('chat');

  const [aiSummary, setAiSummary] = useState(null);
  const { user, authenticatedFetch } = useAuth(); 
  const componentRef = useRef();

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
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false); // ★ 新規: 見積もり承認モーダル

  // Forms state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // AR state
  const [arImageFile, setArImageFile] = useState(null);
  const [arHeight, setArHeight] = useState(180);
  const [arSrc, setArSrc] = useState(null); 
  const [arGenLoading, setArGenLoading] = useState(false);

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
      setProject(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]); 

  useEffect(() => { fetchProject(); }, [fetchProject]);

  useEffect(() => {
    if (!user || !id) return;
    const token = getAuthToken();
    if (!token) return;
    const newSocket = io(API_URL, { transports: ['polling'], auth: { token: `Bearer ${token}` } });
    setSocket(newSocket);
    newSocket.emit('joinProjectRoom', id);
    newSocket.on('receiveGroupChatMessage', (msg) => setProject(prev => prev ? { ...prev, groupChatMessages: [...(prev.groupChatMessages || []), msg] } : null));
    newSocket.on('messageError', (msg) => toast.error(msg));
    return () => newSocket.disconnect();
  }, [id, user]);

  const handlePostAnnouncement = async (e) => {
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
  };

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
      if (!window.confirm('この支出を削除しますか？')) return;
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
      if (!window.confirm('このタスクを削除しますか？')) return;
      try {
          const res = await authenticatedFetch(`${API_URL}/api/project-details/tasks/${taskId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('削除失敗');
          fetchProject();
      } catch (err) {
          toast.error('削除に失敗しました');
      }
  };

  const onPledgeSubmit = async (data) => {
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
  };

  const handleUpload = async (e, type) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const toastId = toast.loading('画像をアップロード中...');
      try {
          const formData = new FormData();
          formData.append('image', file);
          const uploadRes = await authenticatedFetch(`${API_URL}/api/tools/upload-image`, {
              method: 'POST',
              body: formData
          });
          if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました');
          const data = await uploadRes.json();
          const uploadedUrl = data.url;

          const payload = {};
          if (type === 'pre_photo') {
              payload.preEventPhotoUrls = [...(project.preEventPhotoUrls || []), uploadedUrl];
          } else if (type === 'illustration') {
              payload.illustrationPanelUrls = [...(project.illustrationPanelUrls || []), uploadedUrl];
          }

          const updateRes = await authenticatedFetch(`${API_URL}/api/projects/${id}/production`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!updateRes.ok) throw new Error('データの保存に失敗しました');

          toast.success('アップロード完了！', { id: toastId });
          fetchProject();
      } catch (error) {
          toast.error(error.message, { id: toastId });
      }
  };

  const handleGenerateAr = async () => {
      if (!arImageFile) return toast.error('画像を選択してください');
      setArGenLoading(true);
      const toastId = toast.loading('ARモデルを生成中...');
      try {
          const formData = new FormData();
          formData.append('image', arImageFile);
          const res = await authenticatedFetch(`${API_URL}/api/tools/create-ar-panel`, {
              method: 'POST',
              body: formData
          });
          if (!res.ok) throw new Error('AR生成失敗');
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setArSrc(url);
          toast.success('生成完了！', { id: toastId });
      } catch (err) {
          toast.error('AR生成に失敗しました', { id: toastId });
      } finally {
          setArGenLoading(false);
      }
  };

  const isAssignedFlorist = user && user.role === 'FLORIST' && project?.offer?.floristId === user.id;
  const isPledger = user && (project?.pledges || []).some(p => p.userId === user.id);
  const isPlanner = user && user.id === project?.planner?.id;
  const isFlorist = user && user.role === 'FLORIST';
  const isMounted = useIsMounted();
  
  if (!isMounted) return null;
  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;
  if (!project) return <div className="text-center py-32 text-slate-400 font-bold text-lg bg-slate-50 min-h-screen">企画が見つかりませんでした。</div>;

  const totalExpense = (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = project.collectedAmount - totalExpense;

  const TABS = [
    { id: 'overview', label: '概要と報告', icon: Book }, 
    { id: 'collaboration', label: '共同作業', icon: PenTool }, 
    { id: 'finance', label: '収支報告', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 md:pb-24 font-sans text-slate-800 relative">
      
      {/* --- HERO IMAGE (App-style full bleed on mobile, rounded on desktop) --- */}
      <div className="w-full max-w-6xl mx-auto md:px-4 lg:px-8 md:mt-6 mb-4 md:mb-8">
        {project.status !== 'COMPLETED' && project.imageUrl ? (
            <div className="relative w-full aspect-[4/3] md:aspect-[21/9] md:rounded-[2rem] overflow-hidden shadow-sm group cursor-zoom-in" onClick={() => { setModalImageSrc(project.imageUrl); setIsImageModalOpen(true); }}>
                <Image src={project.imageUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5 md:p-10 w-full">
                    <div className="mb-2"><OfficialBadge projectId={project.id} isPlanner={isPlanner} /></div>
                    <h1 className="text-xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md"><JpText>{project.title}</JpText></h1>
                </div>
            </div>
        ) : project.status === 'COMPLETED' ? (
            <div className="p-6 md:p-16 bg-gradient-to-br from-amber-400 to-orange-500 md:rounded-[2.5rem] shadow-lg text-center relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                <div className="relative z-10">
                    <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6 shadow-sm border border-white/20">Project Completed</span>
                    <h2 className="text-2xl md:text-5xl font-black tracking-tighter mb-6 md:mb-8 drop-shadow-md">🎉 企画完了 🎉</h2>
                    <div className="bg-white/10 backdrop-blur-md p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 text-left max-w-3xl mx-auto">
                        <h4 className="font-black mb-2 md:mb-3 text-xs md:text-sm flex items-center gap-2"><MessageCircle size={16}/> 企画者からのメッセージ</h4>
                        <p className="whitespace-pre-wrap leading-relaxed text-xs md:text-base font-bold">{project.completionComment}</p>
                    </div>
                </div>
            </div>
        ) : null}
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 relative z-10">
        
        {/* --- MAIN COLUMN --- */}
        <div className="lg:col-span-8 space-y-5 md:space-y-6">
          
          {/* Organizer Info & Progress */}
          <AppCard className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                    {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={56} height={56} className="object-cover" /> : <User size={20} className="text-slate-400"/>}
                </div>
                <div>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer</p>
                    <p className="font-black text-slate-800 text-sm md:text-base">{project.planner?.handleName || project.planner?.name || '不明'}</p>
                </div>
            </div>
            <div className="w-full md:w-2/3">
               <UpsellAlert target={project.targetAmount} collected={project.collectedAmount} />
            </div>
          </AppCard>

          {/* App-like Segmented Tabs */}
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex overflow-x-auto w-full mb-4 no-scrollbar">
              {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                    className={cn(
                      "flex-1 min-w-[100px] py-2 md:py-3 rounded-lg font-black text-xs md:text-sm flex justify-center items-center gap-1.5 transition-all duration-200",
                      activeTab === tab.id ? 'bg-slate-900 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    )}>
                      <tab.icon size={14} className={activeTab === tab.id ? "text-pink-400" : ""}/> 
                      <span>{tab.label}</span>
                  </button>
              ))}
          </div>
          
          {/* TAB CONTENT */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              
              {/* --- TAB: OVERVIEW --- */}
              {activeTab === 'overview' && (
                  <div className="space-y-5 md:space-y-6">
                      <AppCard>
                          <h2 className="text-base md:text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Book className="text-slate-400" size={18}/> 企画の詳細</h2>
                          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-xs md:text-sm">
                            <JpText>{project.description}</JpText>
                          </div>
                      </AppCard>

                      {(project.designDetails || project.size || project.flowerTypes) && (
                          <AppCard className="bg-pink-50/30 border border-pink-100">
                              <h2 className="text-base md:text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><ImageIcon className="text-pink-400" size={18}/> デザインの希望</h2>
                              <div className="space-y-3">
                                  {project.designDetails && <div className="bg-white p-3 md:p-4 rounded-xl border border-pink-50 shadow-sm"><span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-1">雰囲気・詳細</span><p className="text-slate-700 font-bold text-xs md:text-sm">{project.designDetails}</p></div>}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {project.size && <div className="bg-white p-3 md:p-4 rounded-xl border border-pink-50 shadow-sm"><span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-1">希望サイズ</span><p className="text-slate-700 font-bold text-xs md:text-sm">{project.size}</p></div>}
                                    {project.flowerTypes && <div className="bg-white p-3 md:p-4 rounded-xl border border-pink-50 shadow-sm"><span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-1">使いたい花</span><p className="text-slate-700 font-bold text-xs md:text-sm">{project.flowerTypes}</p></div>}
                                  </div>
                              </div>
                          </AppCard>
                      )}

                      {/* 活動報告 */}
                      <div className="pt-2">
                          <div className="flex flex-row justify-between items-center gap-2 mb-4 px-1">
                              <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><MessageCircle className="text-emerald-500" size={20}/> 活動報告</h2>
                              {isPlanner && (
                                <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-1.5">
                                  <PenTool size={12}/> 新規投稿
                                </button>
                              )}
                          </div>
                          
                          <AnimatePresence>
                            {isPlanner && showAnnouncementForm && (
                                <motion.form 
                                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  onSubmit={handlePostAnnouncement} 
                                  className="mb-5 p-4 md:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-20"
                                >
                                    <input value={announcementTitle} onChange={(e)=>setAnnouncementTitle(e.target.value)} placeholder="タイトル (活動の進捗など)" disabled={isPostingAnnouncement} className="w-full p-3 mb-2 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-emerald-300 outline-none font-bold text-slate-800 text-sm transition-all disabled:opacity-50"/>
                                    <textarea value={announcementContent} onChange={(e)=>setAnnouncementContent(e.target.value)} placeholder="本文を入力..." rows="3" disabled={isPostingAnnouncement} className="w-full p-3 mb-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-emerald-300 outline-none font-medium text-slate-700 text-sm resize-none transition-all disabled:opacity-50"/>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowAnnouncementForm(false)} disabled={isPostingAnnouncement} className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition-colors disabled:opacity-50">キャンセル</button>
                                        <button type="submit" disabled={isPostingAnnouncement} className="px-5 py-2 bg-emerald-500 text-white text-xs font-black rounded-lg hover:bg-emerald-600 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50">
                                            {isPostingAnnouncement ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} 
                                            投稿する
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                          </AnimatePresence>

                          {/* 投稿リスト */}
                          {project.announcements?.length > 0 ? (
                              <div className="space-y-3 md:space-y-4">
                                  {project.announcements.map(a=>(
                                      <AppCard key={a.id} className="!p-5 hover:shadow-md transition-shadow">
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                                                {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={32} height={32} className="object-cover" /> : <User size={14} className="text-slate-400"/>}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-800">{project.planner?.handleName || project.planner?.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                          </div>
                                          <h3 className="font-black text-slate-800 text-sm md:text-base mb-1.5">{a.title}</h3>
                                          <p className="text-xs md:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium"><JpText>{a.content}</JpText></p>
                                      </AppCard>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-slate-400 text-sm text-center py-12 bg-white rounded-2xl font-bold flex flex-col items-center shadow-sm">
                                <MessageCircle size={28} className="text-slate-200 mb-2"/>
                                まだ活動報告はありません
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* --- TAB: COLLABORATION (App-like sub navigation) --- */}
              {activeTab === 'collaboration' && (
                <div className="space-y-4">
                    {aiSummary && (
                        <AppCard className="bg-slate-900 text-white border-slate-800 !p-4 md:!p-6">
                            <h2 className="text-sm font-black text-slate-300 mb-2 flex items-center"><Wand2 className="mr-2 text-indigo-400" size={16}/> AI Summary</h2>
                            <div className="text-xs leading-relaxed font-medium prose prose-invert max-w-none line-clamp-3"><Markdown>{aiSummary}</Markdown></div>
                        </AppCard>
                    )}

                    {!(isPlanner || isPledger || isFlorist) && (
                        <AppCard className="text-center py-16 bg-slate-50">
                            <Lock size={32} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-black text-slate-700 mb-2">参加者限定スペース</h3>
                            <p className="text-slate-500 font-bold text-sm">共同作業は、支援者と関係者のみ利用できます。</p>
                        </AppCard>
                    )}

                    {(isPlanner || isPledger || isFlorist) && (
                        <>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                <button onClick={() => setCollabTab('chat')} className={cn("px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 whitespace-nowrap transition-colors", collabTab === 'chat' ? 'bg-sky-500 text-white' : 'bg-white text-slate-500 hover:bg-sky-50 hover:text-sky-600 shadow-sm border border-slate-100')}>
                                    <MessageSquare size={14}/> チャット
                                </button>
                                <button onClick={() => setCollabTab('board')} className={cn("px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 whitespace-nowrap transition-colors", collabTab === 'board' ? 'bg-pink-500 text-white' : 'bg-white text-slate-500 hover:bg-pink-50 hover:text-pink-600 shadow-sm border border-slate-100')}>
                                    <ImageIcon size={14}/> ムードボード
                                </button>
                                {isPlanner && (
                                    <button onClick={() => setCollabTab('tasks')} className={cn("px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 whitespace-nowrap transition-colors", collabTab === 'tasks' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 shadow-sm border border-slate-100')}>
                                        <CheckCircle2 size={14}/> タスク管理
                                    </button>
                                )}
                                <button onClick={() => setCollabTab('tools')} className={cn("px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 whitespace-nowrap transition-colors", collabTab === 'tools' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm border border-slate-100')}>
                                    <Box size={14}/> ツール・データ
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div key={collabTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                                    
                                    {/* 1. チャット */}
                                    {collabTab === 'chat' && (
                                        <AppCard className="!p-0 overflow-hidden flex flex-col h-[600px] border-sky-100 ring-4 ring-sky-50">
                                            <div className="p-4 border-b border-slate-100 bg-sky-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <MessageSquare className="text-sky-500" size={18}/>
                                                  <h2 className="text-sm font-black text-slate-800">企画チャット</h2>
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-hidden relative bg-white">
                                                <GroupChat project={project} user={user} isPlanner={isPlanner} isPledger={isPledger} socket={socket} onSummaryUpdate={setAiSummary} summary={aiSummary} />
                                            </div>
                                        </AppCard>
                                    )}

                                    {/* 2. ムードボード */}
                                    {collabTab === 'board' && (
                                        <AppCard className="border-pink-100 ring-4 ring-pink-50 !p-4 md:!p-6 bg-slate-50/50">
                                            <MoodboardPostForm projectId={project.id} onPostSuccess={fetchProject} /> 
                                            <div className="mt-6 pt-6 border-t border-slate-200/60"><MoodboardDisplay projectId={project.id} /></div>
                                        </AppCard>
                                    )}

                                    {/* 3. タスク */}
                                    {isPlanner && collabTab === 'tasks' && (
                                        <AppCard className="border-emerald-100 ring-4 ring-emerald-50">
                                            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 mb-6">
                                                <input type="text" value={newTaskTitle} onChange={(e)=>setNewTaskTitle(e.target.value)} placeholder="新しいタスクを追加" className="p-3 border border-slate-200 rounded-xl flex-grow bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-bold"/>
                                                <button type="submit" className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm font-black text-sm flex justify-center items-center gap-2"><Plus size={16}/>追加</button>
                                            </form>
                                            <div className="space-y-2">
                                                {project.tasks?.map(t=>(
                                                    <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group">
                                                        <div className="flex items-center gap-3">
                                                            <input type="checkbox" checked={t.isCompleted} onChange={()=>handleToggleTask(t.id, t.isCompleted)} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"/>
                                                            <span className={cn("text-sm font-bold transition-colors", t.isCompleted ? 'line-through text-slate-400' : 'text-slate-700')}>{t.title}</span>
                                                        </div>
                                                        <button onClick={()=>handleDeleteTask(t.id)} className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-white transition-colors"><Trash2 size={16}/></button>
                                                    </div>
                                                ))}
                                                {(!project.tasks || project.tasks.length === 0) && <p className="text-center text-slate-400 text-sm font-bold py-10">タスクはありません</p>}
                                            </div>
                                        </AppCard>
                                    )}

                                    {/* 4. ツール */}
                                    {collabTab === 'tools' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <AppCard className="!p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100">
                                                    <div>
                                                        <h3 className="font-black text-indigo-900 mb-1 flex items-center text-base"><Box className="mr-2 text-indigo-500" size={18}/> ARプレビュー</h3>
                                                        <p className="text-xs font-bold text-indigo-700/70 mb-6">スマホをかざして実際のサイズ感を確認できます。</p>
                                                    </div>
                                                    <button onClick={() => setIsArModalOpen(true)} className="w-full py-3 bg-indigo-500 text-white text-sm font-black rounded-xl hover:bg-indigo-600 transition-all shadow-md">起動する</button>
                                                </AppCard>
                                                
                                                {(isPlanner || isFlorist) && (
                                                    <AppCard className="!p-6 flex flex-col justify-between bg-slate-50 border-slate-100">
                                                        <div>
                                                            <h3 className="font-black text-slate-800 mb-1 flex items-center text-base"><UploadCloud className="mr-2 text-slate-400" size={18}/> データ提出</h3>
                                                            <p className="text-xs font-bold text-slate-500 mb-6">入稿データなどをアップロードします。</p>
                                                        </div>
                                                        <PanelPreviewer onImageSelected={(file) => handleUpload({ target: { files: [file] } }, 'illustration')} />
                                                    </AppCard>
                                                )}
                                            </div>
                                            
                                            {/* Pre-event photos */}
                                            {((isPlanner || isFlorist) || project.productionStatus === 'PRE_COMPLETION') && (
                                                <AppCard className="border-indigo-100">
                                                    <h3 className="font-black text-slate-800 mb-4 flex items-center text-sm"><CheckCircle2 className="mr-2 text-emerald-500" size={16}/> 仕上がり確認 (前日写真)</h3>
                                                    {project.preEventPhotoUrls?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-3">
                                                            {project.preEventPhotoUrls.map((url, i) => (
                                                                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in hover:scale-105 transition-transform" onClick={()=>{setModalImageSrc(url); setIsImageModalOpen(true)}}>
                                                                    <Image src={url} alt={`前日写真 ${i}`} fill className="object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs font-bold text-slate-400 py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">まだ写真はアップロードされていません。</p>
                                                    )}
                                                    {isFlorist && (
                                                        <div className="mt-4">
                                                            <label className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer hover:bg-slate-50 shadow-sm transition-all w-full justify-center">
                                                                <UploadCloud className="mr-2" size={14}/> 写真を追加
                                                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'pre_photo')} />
                                                            </label>
                                                        </div>
                                                    )}
                                                </AppCard>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </>
                    )}
                </div> 
              )}

              {/* --- TAB: FINANCE --- */}
              {activeTab === 'finance' && (
                <div className="space-y-4 md:space-y-6">
                    <AppCard className="!p-5 md:!p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                            <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center"><DollarSign className="mr-1.5 text-slate-400" size={18}/> 収支報告</h2>
                            <button onClick={handlePrint} className="flex items-center gap-1.5 text-[10px] md:text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"><Printer size={12}/> PDF保存</button>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-xl text-xs md:text-sm space-y-2 md:space-y-3">
                            <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">収入 (支援総額)</span><span className="font-black text-sm md:text-base text-slate-800">{project.collectedAmount.toLocaleString()} pt</span></div>
                            <div className="flex justify-between items-center text-rose-500"><span className="font-bold">支出合計</span><span className="font-black text-sm md:text-base">- {totalExpense.toLocaleString()} pt</span></div>
                            <div className="h-px bg-slate-200 my-2"></div>
                            <div className="flex justify-between items-center"><span className="font-black text-slate-800">残高 (余剰金)</span><span className="text-lg md:text-xl font-black text-slate-900">{balance.toLocaleString()} pt</span></div>
                        </div>
                    </AppCard>

                    <div style={{ display: 'none' }}><BalanceSheet ref={componentRef} project={project} totalExpense={totalExpense} balance={balance} /></div>
                    
                    <AppCard className="!p-5 md:!p-8">
                        <h3 className="font-black text-slate-800 mb-3 text-sm md:text-base">支出の内訳</h3>
                        {isPlanner && (
                            <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2 mb-4 bg-slate-50 p-2.5 rounded-lg">
                                <input type="text" value={expenseName} onChange={(e)=>setExpenseName(e.target.value)} placeholder="項目名 (例: パネル代)" className="p-2.5 border border-transparent rounded-md flex-grow text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-300"/>
                                <input type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} placeholder="金額" className="p-2.5 border border-transparent rounded-md w-full sm:w-28 text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-300"/>
                                <button type="submit" className="p-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-xs font-black w-full sm:w-auto">追加</button>
                            </form>
                        )}
                        <div className="space-y-1.5">
                            {project.expenses?.map(e=>(
                                <div key={e.id} className="flex justify-between items-center text-xs md:text-sm bg-slate-50 p-3 rounded-lg">
                                    <span className="font-black text-slate-700">{e.itemName}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-800">{e.amount.toLocaleString()} pt</span>
                                        {isPlanner && <button onClick={()=>handleDeleteExpense(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14}/></button>}
                                    </div>
                                </div>
                            ))}
                            {(!project.expenses || project.expenses.length === 0) && <p className="text-center text-slate-400 text-xs font-bold py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">支出はまだ登録されていません</p>}
                        </div>
                    </AppCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- SIDEBAR --- */}
        <div id="pledge-section" className="lg:col-span-4 space-y-5 md:space-y-6">
          <div className="sticky top-24 space-y-5 md:space-y-6">
              
              <PledgeForm project={project} user={user} onPledgeSubmit={onPledgeSubmit} isPledger={isPledger} />
              
              {isPlanner && (
                  <AppCard id="planner-menu" className="!p-5 md:!p-6 bg-slate-900 text-white">
                      <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Planner Menu</h3>
                      <div className="space-y-1.5 md:space-y-2">
                          <button onClick={()=>setIsTargetAmountModalOpen(true)} className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs md:text-sm font-bold text-white transition-colors flex items-center"><DollarSign className="mr-2.5 text-emerald-400" size={14}/> 目標金額の変更</button>
                          <Link href={`/projects/edit/${id}`} className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs md:text-sm font-bold text-white transition-colors flex items-center"><Edit3 className="mr-2.5 text-sky-400" size={14}/> 企画内容の編集</Link>
                          
                          {/* ★ 新規: 見積もりが来ていて未承認なら「見積もり承認」ボタンを表示 */}
                          {project.quotation && !project.quotation.isApproved ? (
                              <button onClick={()=>setIsQuotationModalOpen(true)} className="w-full mt-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-3 rounded-lg text-sm font-black transition-transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2">
                                  <FileText size={16}/> 見積もりを承認して発注
                              </button>
                          ) : (
                              <Link href={`/florists?projectId=${id}`} className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs md:text-sm font-bold text-white transition-colors flex items-center"><Search className="mr-2.5 text-pink-400" size={14}/> お花屋さんを探す</Link>
                          )}
                          
                          {project.status==='SUCCESSFUL' && (
                              <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-3 bg-white text-slate-900 p-3 rounded-lg text-sm font-black transition-transform hover:scale-[1.02]">完了報告する</button>
                          )}
                          
                          {project.status !== 'CANCELED' && project.status !== 'COMPLETED' && (
                              <button onClick={() => setIsCancelModalOpen(true)} className="w-full mt-3 text-slate-500 text-[10px] md:text-xs font-bold text-center hover:text-rose-400 py-1.5 transition-colors">企画を中止する...</button>
                          )}
                      </div>
                  </AppCard>
              )}

              <div className="text-center pt-1 md:pt-2">
                <button onClick={() => setReportModalOpen(true)} className="text-[9px] md:text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                  <AlertTriangle size={10} className="md:w-3 md:h-3"/> 問題を報告する
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Sticky Bottom Action Bar --- */}
      {project.status === 'FUNDRAISING' && !isPledger && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-[80] pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex gap-2 max-w-xl mx-auto">
                <button onClick={() => {
                    document.getElementById('pledge-section')?.scrollIntoView({ behavior: 'smooth' });
                }} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black shadow-md flex justify-center items-center gap-2 text-sm active:scale-95 transition-transform">
                    <Heart size={16} className="text-pink-400 fill-pink-400" />
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
        {isInstructionModalOpen && <InstructionSheetModal project={project} onClose={() => setIsInstructionModalOpen(false)} />}
        {isQuotationModalOpen && <QuotationApprovalModal project={project} user={user} onClose={() => setIsQuotationModalOpen(false)} onUpdate={fetchProject} />}
        {isCancelModalOpen && <ProjectCancelModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} project={project} onCancelComplete={() => { fetchProject(); router.push('/mypage'); }} />}
        
        {/* AR Modal */}
        {isArModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-50 p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh] border border-white">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-lg text-slate-800 flex items-center"><Box className="mr-2 text-indigo-500"/> ARシミュレーター</h3>
                  <button onClick={() => setIsArModalOpen(false)} className="bg-white hover:bg-slate-100 rounded-full p-2 transition-colors shadow-sm"><X size={20}/></button>
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
                                <input type="number" value={arHeight} onChange={(e) => setArHeight(e.target.value)} className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-slate-800 outline-none focus:border-indigo-300"/>
                            </div>
                        </div>
                        <button onClick={handleGenerateAr} disabled={arGenLoading || !arImageFile} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center shadow-lg">{arGenLoading ? <><Loader2 className="animate-spin mr-2"/> 生成中...</> : 'ARモデルを生成する'}</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <p className="text-sm text-center text-slate-600 mb-6 font-bold leading-relaxed">カメラを起動して、平らな床に向けてください。<br/>高さ <strong className="text-pink-500">{arHeight}cm</strong> のパネルが表示されます。</p>
                        <div className="w-full aspect-[3/4] bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-800"><ArViewer src={arSrc} alt="AR" /></div>
                        <button onClick={() => { setArSrc(null); setArImageFile(null); }} className="mt-8 px-6 py-3 bg-slate-100 rounded-full text-sm font-black text-slate-500 flex items-center hover:bg-slate-200 transition-colors"><RefreshCw className="mr-2" size={16}/> 別の画像で試す</button>
                    </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}