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

// --- Icons (lucide-reactに統一) ---
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
import GuestPledgeForm from '@/app/components/GuestPledgeForm';
import ImageModal from '@/app/components/ImageModal';
import GroupChat from './components/GroupChat';
import CompletionReportModal from './components/CompletionReportModal';
import ReportModal from './components/ReportModal';
import VenueRegulationCard from '@/app/components/VenueRegulationCard';
import { BalanceSheet } from '@/app/components/BalanceSheet';

import FloristMaterialModal from '@/components/project/FloristMaterialModal';
import ProjectCancelModal from '@/components/project/ProjectCancelModal';

// Dynamic Import
const ArViewer = dynamic(() => import('@/app/components/ArViewer'), { ssr: false });

// Constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const PROGRESS_STEPS = [
  { key: 'FUNDRAISING', label: '募集中', order: 0 },
  { key: 'OFFER_ACCEPTED', label: 'オファー確定', order: 1 },
  { key: 'DESIGN_FIXED', label: 'デザイン決定', order: 2 },
  { key: 'MATERIAL_PREP', label: '資材手配中', order: 3 },
  { key: 'PRODUCTION_IN_PROGRESS', label: '制作中', order: 4 },
  { key: 'READY_FOR_DELIVERY', label: '配送準備完了', order: 5 },
  { key: 'COMPLETED', label: '完了', order: 6 }
];

// Helper Functions
function cn(...classes) { return classes.filter(Boolean).join(' '); }
const JpText = ({ children, className }) => <span className={cn("inline-block", className)}>{children}</span>;

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
// 🎨 UI COMPONENTS & ANIMATIONS
// ===========================================

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem]", className)}>
    {children}
  </div>
);

// ===========================================
// Sub Components
// ===========================================

function ImageLightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 flex justify-center items-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[110] backdrop-blur-md border border-white/20">
        <X size={24} />
      </button>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <img src={url} alt="Enlarged design" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
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
      <p><strong>企画者:</strong> ${project.planner?.handleName}</p>
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
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-black flex items-center text-slate-800"><FileText className="mr-2 text-sky-500"/> 制作指示書プレビュー</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
        </div>
        <div className="flex-grow p-6 md:p-8 bg-white text-sm overflow-y-auto prose prose-sm">
             <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-50 shadow-sm">閉じる</button>
          <button onClick={handlePrint} className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
            <Printer size={18}/> 印刷 / PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PledgeForm({ project, user, onPledgeSubmit, isPledger }) {
  const { register, handleSubmit, formState: { isSubmitting }, reset, watch } = useForm({
    defaultValues: { pledgeType: 'tier', selectedTierId: project.pledgeTiers?.[0]?.id || '', pledgeAmount: 0, comment: '', guestName: '', guestEmail: '' }
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
          <GlassCard className="!p-8 text-center bg-blue-50/50 border-blue-100">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm text-blue-500 mb-4 border border-blue-100"><CheckCircle2 size={32} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2">支援済みです</h3>
              <p className="text-slate-500 font-medium text-sm">ご協力ありがとうございます！🌸</p>
          </GlassCard>
      );
  }

  if (project.status !== 'FUNDRAISING') {
    return (
        <GlassCard className="!p-8 text-center bg-slate-100/50 border-slate-200">
            <h3 className="text-xl font-black text-slate-500 mb-2">受付終了</h3>
            <p className="text-slate-400 font-medium text-sm">現在、支援を募集していません。</p>
        </GlassCard>
    );
  }

  return (
    <GlassCard className="!p-6 md:!p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Sparkles className="text-pink-500"/> この企画を支援する</h3>
      {!user && (
        <div className="mb-6 p-4 bg-amber-50/80 backdrop-blur-sm text-amber-900 text-xs font-bold rounded-2xl border border-amber-200 flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-amber-500" size={16}/>
            <div>現在 <strong>ゲストモード</strong> です。<br/>
                <Link href={`/login?redirect=/projects/${project.id}`} className="text-amber-600 underline hover:text-amber-800 mt-1 inline-block">ログインするとポイントが使えます✨</Link>
            </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex bg-slate-100/80 backdrop-blur p-1.5 rounded-2xl">
          <label className={cn("flex-1 text-center py-2.5 rounded-xl cursor-pointer text-sm font-black transition-all", pledgeType === 'tier' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="tier" className="hidden" /> コースから選ぶ
          </label>
          <label className={cn("flex-1 text-center py-2.5 rounded-xl cursor-pointer text-sm font-black transition-all", pledgeType === 'free' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="free" className="hidden" /> 金額を指定
          </label>
        </div>

        {pledgeType === 'tier' && project.pledgeTiers && (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
            {project.pledgeTiers.map(tier => (
              <label key={tier.id} className={cn("block p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all group relative overflow-hidden", selectedTierId === tier.id ? 'border-pink-400 bg-white shadow-lg ring-4 ring-pink-50' : 'border-white bg-white/50 hover:bg-white hover:border-pink-200 shadow-sm')}>
                <input type="radio" {...register('selectedTierId')} value={tier.id} className="hidden" />
                <div className="flex justify-between items-center mb-2 relative z-10">
                  <span className="font-black text-xl text-slate-800">{tier.amount.toLocaleString()} <span className="text-xs font-bold text-slate-400">{user ? 'pt' : '円'}</span></span>
                  {selectedTierId === tier.id && <CheckCircle2 className="text-pink-500" size={20}/>}
                </div>
                <span className="text-sm font-bold text-pink-500 block mb-2 relative z-10">{tier.title}</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed relative z-10">{tier.description}</p>
                {selectedTierId === tier.id && <div className="absolute inset-0 bg-pink-50/30 z-0"></div>}
              </label>
            ))}
          </div>
        )}

        {pledgeType === 'free' && (
          <div className="bg-white/60 backdrop-blur p-6 rounded-[1.5rem] border border-white shadow-sm">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">支援金額 ({user ? 'pt' : '円'})</label>
            <input type="number" {...register('pledgeAmount')} min="1000" className="w-full p-4 border-2 border-slate-100 rounded-2xl text-xl font-black text-slate-800 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all placeholder:text-slate-300" placeholder="1000"/>
          </div>
        )}

        {!user && (
            <div className="pt-6 border-t border-slate-200/60 space-y-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><User size={14}/> ゲスト情報入力</p>
              <div className="grid grid-cols-1 gap-4">
                  <input type="text" {...register('guestName')} className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-sky-400 outline-none transition-all placeholder:text-slate-300" placeholder="お名前 (ハンドルネーム)"/>
                  <input type="email" {...register('guestEmail')} className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-sky-400 outline-none transition-all placeholder:text-slate-300" placeholder="メールアドレス"/>
              </div>
            </div>
        )}

        <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(244,114,182,0.3)" }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting || finalAmount <= 0} 
            className="w-full py-4 md:py-5 font-black text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-[1.5rem] disabled:opacity-50 flex justify-center items-center gap-2 text-lg shadow-xl"
        >
            {isSubmitting ? <Loader2 className="animate-spin"/> : <Heart size={20} className="fill-white"/>}
            {isSubmitting ? '処理中...' : (user ? 'ポイントで支援する' : 'ゲストとして支援する')}
        </motion.button>
      </form>
    </GlassCard>
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
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><DollarSign className="text-pink-500"/> 目標金額の変更</h2>
          <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} min={project.collectedAmount} required className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-800 focus:border-pink-400 outline-none mb-8 transition-colors" />
          <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-colors">キャンセル</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-pink-500 text-white rounded-full font-black hover:bg-pink-600 shadow-lg transition-colors">保存</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const ProgressTracker = ({ project, isAssignedFlorist, fetchProject }) => {
    const token = getAuthToken();
    const currentStatusKey = project?.status;
    const currentStatus = PROGRESS_STEPS.find(s => s.key === currentStatusKey);
    const currentOrder = currentStatus ? currentStatus.order : 0;
    
    const handleStatusUpdate = async (newStatusKey) => {
        if(!window.confirm(`ステータスを更新しますか？`)) return;
        try {
            await fetch(`${API_URL}/api/projects/${project.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatusKey })
            });
            toast.success('更新しました');
            fetchProject();
        } catch (e) { toast.error('エラー'); }
    };
    
    const stepsToDisplay = PROGRESS_STEPS.filter(s => s.order > 0);
    if (!isAssignedFlorist && currentOrder < 1 && project.status !== 'SUCCESSFUL' && project.status !== 'COMPLETED') return null;

    return (
        <GlassCard className="!p-6 mb-8 border border-pink-100">
            <div className="relative px-2 md:px-6">
                <div className="absolute top-5 left-4 right-4 h-1.5 bg-slate-100 rounded-full -z-10"></div>
                <div className="absolute top-5 left-4 h-1.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-1000 ease-out -z-10" style={{ width: `${(currentOrder / (PROGRESS_STEPS.length - 1)) * 100}%` }}></div>
                <div className="flex justify-between items-start">
                    {stepsToDisplay.map((step, index) => {
                        const isCompleted = step.order <= currentOrder;
                        const isCurrent = step.order === currentOrder;
                        return (
                            <div key={step.key} className="flex flex-col items-center w-14 md:w-16 relative">
                                <motion.div 
                                    animate={{ scale: isCurrent ? 1.1 : 1 }}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-[3px] font-black text-sm shadow-sm transition-colors duration-500 bg-white", 
                                        isCompleted ? "border-pink-500 text-pink-500" : "border-slate-200 text-slate-300",
                                        isCurrent && "ring-4 ring-pink-100"
                                    )}>
                                    {isCompleted ? <Check size={18} strokeWidth={4} /> : index + 1}
                                </motion.div>
                                <span className={cn("text-[9px] md:text-[10px] mt-2 text-center font-black tracking-wider whitespace-nowrap", isCompleted ? "text-pink-600" : "text-slate-400")}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {isAssignedFlorist && currentStatusKey !== 'COMPLETED' && (
                <div className="mt-8 flex flex-wrap gap-3 justify-end border-t border-slate-100 pt-4">
                    {stepsToDisplay.filter(s => s.order > currentOrder && s.key !== 'COMPLETED').slice(0, 2).map(nextStep => (
                        <button key={nextStep.key} onClick={() => handleStatusUpdate(nextStep.key)} className="px-6 py-2.5 text-xs font-black bg-white border border-sky-200 text-sky-600 rounded-full hover:bg-sky-50 shadow-sm transition-colors">
                            {nextStep.label} に進める
                        </button>
                    ))}
                    {currentOrder >= 5 && <button onClick={() => handleStatusUpdate('DELIVERED_OR_FINISHED')} className="px-6 py-2.5 text-xs font-black bg-emerald-500 text-white rounded-full hover:bg-emerald-600 shadow-md">納品完了にする</button>}
                </div>
            )}
        </GlassCard>
    );
};

// ===========================================
// Main Component
// ===========================================
export default function ProjectDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [activeTab, setActiveTab] = useState('overview'); 
  const [aiSummary, setAiSummary] = useState(null);
  const { user, authenticatedFetch } = useAuth(); 
  const componentRef = useRef();

  const [project, setProject] = useState(null);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `収支報告書_${project?.title || '企画'}`,
  });
  
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isTargetAmountModalOpen, setIsTargetAmountModalOpen] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [isArModalOpen, setIsArModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [arImageFile, setArImageFile] = useState(null);
  const [arHeight, setArHeight] = useState(180);
  const [arSrc, setArSrc] = useState(null); 
  const [arGenLoading, setArGenLoading] = useState(false);

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
          toast.success("決済が完了しました！ご支援ありがとうございます。", { duration: 6000 });
          history.replaceState(null, '', `${window.location.pathname}`);
      } else if (urlParams.get('payment') === 'cancelled') {
          toast.error("決済がキャンセルされました。再度お試しください。");
          history.replaceState(null, '', `${window.location.pathname}`);
      }
  }, []);

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

  // ★ 不足していたハンドラを定義（これでクラッシュしなくなります）
  const handleGenerateAr = async () => {
      toast('AR生成機能は準備中です', { icon: '🚧' });
  };

  const handleSelectCompletedImage = (url) => {
      toast('画像選択機能は準備中です', { icon: '🚧' });
  };

  const handleUpload = (e, type) => {
      toast('ファイルアップロード機能は準備中です', { icon: '🚧' });
  };

  const handleAddExpense = (e) => {
      e.preventDefault();
      toast('支出の追加機能は準備中です', { icon: '🚧' });
  };

  const handleDeleteExpense = (expenseId) => {
      toast('支出の削除機能は準備中です', { icon: '🚧' });
  };

  const handleToggleTask = (taskId, isCompleted) => {
      toast('タスクの切り替え機能は準備中です', { icon: '🚧' });
  };

  const handleDeleteTask = (taskId) => {
      toast('タスクの削除機能は準備中です', { icon: '🚧' });
  };

  const onPledgeSubmit = async (data) => {
      toast('ポイント支援機能は準備中です', { icon: '🚧' });
  };

  const isAssignedFlorist = user && user.role === 'FLORIST' && project?.offer?.floristId === user.id;
  const isPledger = user && (project?.pledges || []).some(p => p.userId === user.id);
  const isPlanner = user && user.id === project?.planner?.id;
  const isFlorist = user && user.role === 'FLORIST';
  const isMounted = useIsMounted();
  
  if (!isMounted) return null;
  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-pink-50/50"><Loader2 className="animate-spin text-pink-500" size={40} /></div>;
  if (!project) return <div className="text-center py-32 text-slate-400 font-bold text-lg bg-slate-50 min-h-screen">企画が見つかりませんでした。</div>;

  const totalExpense = (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = project.collectedAmount - totalExpense;

  // Tabs Configuration
  const TABS = [
    { id: 'overview', label: '概要', icon: Book }, 
    { id: 'collaboration', label: '共同作業', icon: PenTool }, 
    { id: 'finance', label: '収支・報告', icon: DollarSign }
  ];

  return (
    <>
      {/* 💥 コンテンツ全体をラップする div 💥 */}
      <div className="min-h-screen bg-gradient-to-br from-pink-50/50 to-sky-50/50 pb-24 font-sans text-slate-800 relative overflow-hidden">
        <FloatingParticles />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        {/* --- Progress Tracker --- */}
        {(isAssignedFlorist || project.status === 'SUCCESSFUL' || project.status === 'COMPLETED' || project.status === 'FUNDRAISING') && (
          <div className="sticky top-0 z-40 px-4 pt-6 pb-2">
            <div className="max-w-6xl mx-auto">
              <ProgressTracker project={project} isAssignedFlorist={isAssignedFlorist} fetchProject={fetchProject} />
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 mt-6">
          
          {/* --- MAIN COLUMN --- */}
          <div className="lg:col-span-8 space-y-8">
            <GlassCard className="!p-6 md:!p-10">
              
              {/* IMAGE HEADER */}
              {project.status !== 'COMPLETED' && project.imageUrl && (
                <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2rem] overflow-hidden bg-slate-100 shadow-inner group cursor-zoom-in mb-8" onClick={() => { setModalImageSrc(project.imageUrl); setIsImageModalOpen(true); }}>
                  <Image src={project.imageUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {project.status === 'COMPLETED' && (
                  <div className="p-8 md:p-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border border-orange-100 mb-8 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                      <div className="relative z-10">
                          <span className="inline-block bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm border border-orange-200">Project Completed</span>
                          <h2 className="text-3xl md:text-4xl font-black text-orange-800 tracking-tighter mb-8">🎉 企画完了 🎉</h2>
                          {project.completionImageUrls?.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                  {project.completionImageUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-[1.5rem] overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-zoom-in group" onClick={() => { setModalImageSrc(url); setIsImageModalOpen(true); }}>
                                      <Image src={url} alt={`完了写真 ${i}`} fill className="object-cover group-hover:scale-110 transition-transform" />
                                    </div>
                                  ))}
                              </div>
                          )}
                          <div className="bg-white/80 p-6 md:p-8 rounded-[2rem] backdrop-blur-md border border-white shadow-sm text-left">
                              <h4 className="font-black text-orange-800 mb-3 text-sm flex items-center gap-2"><MessageCircle size={16}/> 企画者からのメッセージ</h4>
                              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">{project.completionComment}</p>
                          </div>
                      </div>
                  </div>
              )}

              {/* TITLE & INFO */}
              <div>
                <div className="mb-4"><OfficialBadge projectId={project.id} isPlanner={isPlanner} /></div>
                <h1 className="text-2xl md:text-4xl font-black text-slate-800 mb-6 leading-tight tracking-tighter"><JpText>{project.title}</JpText></h1>
                
                <div className="flex flex-wrap items-center gap-4 text-slate-500 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-fit">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-200">
                            {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={40} height={40} className="object-cover" /> : <User size={16}/>}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer</p>
                          <p className="font-black text-slate-700 text-sm">{project.planner?.handleName}</p>
                        </div>
                    </div>
                </div>

                <UpsellAlert target={project.targetAmount} collected={project.collectedAmount} />

                {/* Digital Nameboard Banner */}
                <div className="my-10">
                  <Link href={`/projects/${id}/board`} className="block group">
                      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-10 shadow-2xl border-4 border-slate-800 text-center transform transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/50">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                          <div className="relative z-10">
                              <span className="text-[10px] font-black text-yellow-400 tracking-widest uppercase mb-3 inline-flex items-center gap-1 bg-yellow-400/10 px-3 py-1 rounded-full"><Sparkles size={12}/> Special Contents</span>
                              <h3 className="text-xl md:text-3xl font-black text-white mb-3 group-hover:text-yellow-200 transition-colors flex items-center justify-center gap-2 tracking-tighter">
                                  <Award className="text-yellow-400"/> デジタル・ネームボードを見る
                              </h3>
                              <p className="text-slate-400 text-xs md:text-sm font-bold">支援者全員の名前が刻まれた、Web限定の記念プレートです✨</p>
                          </div>
                      </div>
                  </Link>
                </div>
              </div>

              {/* TABS NAVIGATION */}
              <div className="mb-8 overflow-x-auto no-scrollbar pb-4">
                  <div className="flex gap-3 min-w-max">
                      {TABS.map(tab => (
                          <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                            className={cn(
                              "px-6 py-3.5 rounded-full font-black text-sm flex items-center gap-2 transition-all shadow-sm border",
                              activeTab === tab.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-pink-300 hover:text-pink-500'
                            )}>
                              <tab.icon size={16} className={activeTab === tab.id ? "text-pink-400" : ""}/> {tab.label}
                          </button>
                      ))}
                  </div>
              </div>
              
              {/* TAB CONTENT */}
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  
                  {activeTab === 'overview' && (
                      <div className="space-y-10">
                          {project.venue && <VenueRegulationCard venue={project.venue} />}
                          {project.venueId && <VenueLogisticsWiki venueId={project.venueId} venueName={project.venue?.venueName} isFloristView={isAssignedFlorist} />}
                          
                          <div>
                              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Book className="text-sky-500"/> 企画の詳細</h2>
                              <div className="bg-slate-50/80 backdrop-blur p-6 md:p-8 rounded-[2rem] border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base">
                                <JpText>{project.description}</JpText>
                              </div>
                          </div>

                          {(project.designDetails || project.size || project.flowerTypes) && (
                              <div>
                                  <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><ImageIcon className="text-pink-500"/> デザインの希望</h2>
                                  <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] space-y-6 shadow-sm">
                                      {project.designDetails && <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">雰囲気</span><p className="text-slate-800 font-medium text-sm"><JpText>{project.designDetails}</JpText></p></div>}
                                      {project.size && <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">希望サイズ</span><p className="text-slate-800 font-medium text-sm">{project.size}</p></div>}
                                      {project.flowerTypes && <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">お花</span><p className="text-slate-800 font-medium text-sm">{project.flowerTypes}</p></div>}
                                  </div>
                              </div>
                          )}

                          {(project.announcements?.length > 0 || isPlanner) && (
                              <div>
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><MessageCircle className="text-emerald-500"/> 活動報告</h2>
                                      {isPlanner && <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="text-xs bg-slate-900 text-white px-5 py-2.5 rounded-full font-black shadow-md hover:bg-slate-800 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center"><Plus size={14}/> 新規投稿</button>}
                                  </div>
                                  
                                  {isPlanner && showAnnouncementForm && (
                                      <div className="mb-8 p-6 md:p-8 bg-slate-50 rounded-[2rem] border border-slate-200">
                                          <input value={announcementTitle} onChange={(e)=>setAnnouncementTitle(e.target.value)} placeholder="タイトル (活動の進捗など)" className="w-full p-4 mb-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-100 focus:border-sky-400 outline-none font-bold text-slate-800"/>
                                          <textarea value={announcementContent} onChange={(e)=>setAnnouncementContent(e.target.value)} placeholder="本文を入力..." rows="4" className="w-full p-4 mb-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-100 focus:border-sky-400 outline-none font-medium text-slate-700 resize-none"/>
                                          <div className="flex justify-end gap-3">
                                              <button type="button" onClick={() => setShowAnnouncementForm(false)} className="px-6 py-3 text-sm text-slate-500 hover:bg-slate-200 rounded-full font-bold transition-colors">キャンセル</button>
                                              <button type="submit" className="px-8 py-3 bg-sky-500 text-white text-sm font-black rounded-full hover:bg-sky-600 shadow-lg transition-all">投稿する</button>
                                          </div>
                                      </div>
                                  )}

                                  {project.announcements?.length > 0 ? (
                                      <div className="space-y-4">
                                          {project.announcements.map(a=>(
                                              <div key={a.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                  <p className="text-[10px] text-sky-500 font-black mb-2 tracking-widest uppercase">{new Date(a.createdAt).toLocaleDateString()}</p>
                                                  <h3 className="font-black text-slate-800 text-lg mb-3">{a.title}</h3>
                                                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium"><JpText>{a.content}</JpText></p>
                                              </div>
                                          ))}
                                      </div>
                                  ) : <div className="text-slate-400 text-sm text-center py-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 font-bold">まだ活動報告はありません。</div>}
                              </div>
                          )}
                      </div>
                  )}

                  {activeTab === 'collaboration' && (
                    <div className="space-y-10">
                        {aiSummary && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 md:p-8 rounded-[2rem] border border-amber-200 shadow-sm">
                                <h2 className="text-lg font-black text-amber-800 mb-4 flex items-center"><Wand2 className="mr-2"/> AIまとめ (最新の決定事項)</h2>
                                <div className="text-sm text-amber-900 leading-relaxed font-medium prose prose-sm max-w-none"><Markdown>{aiSummary}</Markdown></div>
                            </div>
                        )}

                        {(isPlanner || isPledger || isFlorist) && (
                            <div>
                                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><ImageIcon className="text-pink-500"/> ムードボード</h2>
                                <div className="bg-slate-50/80 backdrop-blur p-6 md:p-8 rounded-[2.5rem] border border-slate-100">
                                    <MoodboardPostForm projectId={project.id} onPostSuccess={fetchProject} /> 
                                    <div className="mt-8"><MoodboardDisplay projectId={project.id} /></div>
                                </div>
                            </div>
                        )}

                        {(isPlanner || isPledger || isFlorist) && (
                            <div>
                                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><MessageSquare className="text-sky-500"/> 企画チャット</h2>
                                <div className="border border-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
                                    <GroupChat project={project} user={user} isPlanner={isPlanner} isPledger={isPledger} socket={socket} onSummaryUpdate={setAiSummary} summary={aiSummary} />
                                </div>
                            </div>
                        )}

                        {isPlanner && (
                            <div>
                                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> タスク管理</h2>
                                <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2.5rem] shadow-sm">
                                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                                        <input type="text" value={newTaskTitle} onChange={(e)=>setNewTaskTitle(e.target.value)} placeholder="新しいタスクを入力" className="p-4 border-2 border-slate-100 rounded-2xl flex-grow bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 outline-none transition-all text-sm font-bold"/>
                                        <button type="submit" className="px-8 py-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors shadow-md font-black flex items-center justify-center gap-2"><Plus size={18}/> 追加</button>
                                    </div>
                                    <div className="space-y-3">
                                        {project.tasks?.map(t=>(
                                            <div key={t.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border-2 border-slate-50 hover:border-emerald-100 transition-colors shadow-sm group">
                                                <div className="flex items-center gap-4">
                                                    <input type="checkbox" checked={t.isCompleted} onChange={()=>handleToggleTask(t.id, t.isCompleted)} className="w-6 h-6 text-emerald-500 rounded-lg focus:ring-emerald-500 border-slate-200 cursor-pointer"/>
                                                    <span className={cn("text-sm font-bold transition-colors", t.isCompleted ? 'line-through text-slate-300' : 'text-slate-700')}>{t.title}</span>
                                                </div>
                                                <button onClick={()=>handleDeleteTask(t.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={18}/></button>
                                            </div>
                                        ))}
                                        {(!project.tasks || project.tasks.length === 0) && <p className="text-center text-slate-400 text-sm font-bold py-8">タスクはありません</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><PenTool className="text-purple-500"/> 確認ツール</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-black text-slate-800 mb-2 flex items-center text-lg"><Box className="mr-2 text-indigo-500"/> ARシミュレーター</h3>
                                        <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">スマホをかざして、お花のサイズ感をARで実際の部屋に配置確認できます。</p>
                                    </div>
                                    <button onClick={() => setIsArModalOpen(true)} className="w-full py-4 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-300">ARを起動する</button>
                                </div>
                                {(isPlanner || isFlorist) && (
                                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <h3 className="font-black text-slate-800 mb-2 flex items-center text-lg"><UploadCloud className="mr-2 text-pink-500"/> データ提出</h3>
                                        <p className="text-xs font-bold text-slate-500 mb-6">入稿用のイラストや名簿データをアップロード。</p>
                                        <PanelPreviewer onImageSelected={(file) => {
                                            const dummyEvent = { target: { files: [file] } };
                                            handleUpload(dummyEvent, 'illustration');
                                        }} />
                                    </div>
                                )}
                            </div>

                            {((isPlanner || isFlorist) || project.productionStatus === 'PRE_COMPLETION') && (
                                <div className="mt-8 bg-indigo-50/50 p-6 md:p-8 rounded-[2.5rem] border border-indigo-100">
                                    <h3 className="font-black text-indigo-900 mb-4 flex items-center text-lg"><CheckCircle2 className="mr-2 text-indigo-500"/> 仕上がり確認 (前日写真)</h3>
                                    {project.preEventPhotoUrls?.length > 0 ? (
                                        <div className="flex flex-wrap gap-4">
                                            {project.preEventPhotoUrls.map((url, i) => (
                                                <div key={i} className="relative w-28 h-28 rounded-2xl overflow-hidden border-[3px] border-white shadow-lg cursor-zoom-in hover:scale-105 transition-transform" onClick={()=>{setModalImageSrc(url); setIsImageModalOpen(true)}}>
                                                    <Image src={url} alt={`前日写真 ${i}`} fill className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-indigo-400 bg-white/60 p-4 rounded-xl border border-indigo-100">まだ写真はアップロードされていません。</p>
                                    )}
                                    {isFlorist && (
                                        <div className="mt-6">
                                            <label className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-black rounded-full cursor-pointer hover:bg-indigo-700 shadow-md transition-all">
                                                <UploadCloud className="mr-2" size={18}/> 写真をアップロード
                                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'pre_photo')} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div> 
                  )}

                  {activeTab === 'finance' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <h2 className="text-xl font-black text-slate-800 flex items-center"><DollarSign className="mr-2 text-emerald-500"/> 収支報告</h2>
                                <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-full transition-colors"><Printer size={14}/> PDFで保存</button>
                            </div>
                            
                            <div className="bg-emerald-50/50 p-6 md:p-8 rounded-[2rem] text-sm space-y-4 border border-emerald-100 shadow-inner">
                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">収入 (支援総額)</span><span className="font-black text-lg text-slate-800">{project.collectedAmount.toLocaleString()} pt</span></div>
                                <div className="flex justify-between items-center text-rose-500"><span className="font-bold">支出合計</span><span className="font-black text-lg">- {totalExpense.toLocaleString()} pt</span></div>
                                <div className="h-px bg-emerald-200/50 my-4"></div>
                                <div className="flex justify-between items-center"><span className="font-black text-slate-800">残高 (余剰金)</span><span className="text-2xl font-black text-emerald-600">{balance.toLocaleString()} pt</span></div>
                            </div>
                        </div>

                        {/* 隠し要素: 印刷用 */}
                        <div style={{ display: 'none' }}><BalanceSheet ref={componentRef} project={project} totalExpense={totalExpense} balance={balance} /></div>
                        
                        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-800 mb-6 text-lg">支出の詳細リスト</h3>
                            {isPlanner && (
                                <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-4 rounded-[2rem]">
                                    <input type="text" value={expenseName} onChange={(e)=>setExpenseName(e.target.value)} placeholder="項目名 (例: お花代)" className="p-4 border-2 border-white rounded-xl flex-grow text-sm font-bold focus:outline-none focus:border-sky-300 shadow-sm bg-white"/>
                                    <input type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} placeholder="金額" className="p-4 border-2 border-white rounded-xl w-full sm:w-32 text-sm font-bold focus:outline-none focus:border-sky-300 shadow-sm bg-white"/>
                                    <button type="submit" className="p-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-md text-sm font-black w-full sm:w-auto">追加</button>
                                </form>
                            )}
                            <div className="space-y-3">
                                {project.expenses?.map(e=>(
                                    <div key={e.id} className="flex justify-between items-center text-sm bg-white p-4 rounded-2xl border-2 border-slate-50 shadow-sm">
                                        <span className="font-black text-slate-700">{e.itemName}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-slate-800">{e.amount.toLocaleString()} pt</span>
                                            {isPlanner && <button onClick={()=>handleDeleteExpense(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 bg-slate-50 hover:bg-rose-50 rounded-xl"><Trash2 size={16}/></button>}
                                        </div>
                                    </div>
                                ))}
                                {(!project.expenses || project.expenses.length === 0) && <p className="text-center text-slate-400 text-sm font-bold py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">支出はまだ登録されていません</p>}
                            </div>
                        </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

            </GlassCard>
          </div>

          {/* --- SIDEBAR (Pledge & Planner Menu) --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-32 space-y-6">
                <PledgeForm project={project} user={user} onPledgeSubmit={onPledgeSubmit} isPledger={isPledger} />
                
                {isPlanner && (
                    <GlassCard className="!p-6 bg-slate-900 text-white border-slate-800">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><PenTool size={14}/> Planner Menu</h3>
                        <div className="space-y-3">
                            <button onClick={()=>setIsTargetAmountModalOpen(true)} className="w-full text-left p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold text-white transition-colors flex items-center border border-white/5"><DollarSign className="mr-3 text-emerald-400" size={18}/> 目標金額の変更</button>
                            <Link href={`/projects/edit/${id}`} className="block w-full text-left p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold text-white transition-colors flex items-center border border-white/5"><Edit3 className="mr-3 text-sky-400" size={18}/> 企画内容の編集</Link>
                            <Link href={`/florists?projectId=${id}`} className="block w-full text-left p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold text-white transition-colors flex items-center border border-white/5"><Search className="mr-3 text-pink-400" size={18}/> お花屋さんを探す</Link>
                            
                            {project.status==='SUCCESSFUL' && (
                                <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-4 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white p-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all border border-emerald-300">🎉 完了報告する</button>
                            )}
                            
                            {project.status !== 'CANCELED' && project.status !== 'COMPLETED' && (
                                <button onClick={() => setIsCancelModalOpen(true)} className="w-full mt-6 text-slate-500 text-xs font-bold text-center hover:text-rose-400 py-2 transition-colors">企画を中止する...</button>
                            )}
                        </div>
                    </GlassCard>
                )}

                {/* 運営への通報（タグ修正済み） */}
                <div className="text-center pt-4">
                  <button onClick={() => setReportModalOpen(true)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                    <AlertTriangle size={12}/> 問題を報告する
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div> 
      {/* 💥 親の div をここで閉じる 💥 */}

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isImageModalOpen && <ImageLightbox url={modalImageSrc} onClose={() => setIsImageModalOpen(false)} />}
        {isReportModalOpen && <ReportModal projectId={id} user={user} onClose={() => setReportModalOpen(false)} />}
        {isCompletionModalOpen && <CompletionReportModal project={project} user={user} onClose={() => setIsCompletionModalOpen(false)} onReportSubmitted={fetchProject} />}
        {isTargetAmountModalOpen && <TargetAmountModal project={project} user={user} onClose={() => setIsTargetAmountModalOpen(false)} onUpdate={fetchProject} />}
        {isInstructionModalOpen && <InstructionSheetModal project={project} onClose={() => setIsInstructionModalOpen(false)} />}
        
        {/* AnimatePresence の中で条件分岐なしで置かれていたモーダルを修正（状態管理に変更、または表示状態を含める） */}
        {isMaterialModalOpen && <FloristMaterialModal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} project={project} onUpdate={setProject} />}
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
                            {project.status === 'COMPLETED' && (isPledger || isPlanner || isFlorist) && project.completionImageUrls?.length > 0 && (
                                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-6 text-left">
                                  <h4 className="font-black text-emerald-800 mb-3 flex items-center text-sm"><CheckCircle2 className="mr-2" size={16}/> 完成写真から作成</h4>
                                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                      {project.completionImageUrls.map((url, i) => (
                                          <div key={i} className="flex-shrink-0 cursor-pointer group relative w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-all shadow-sm" onClick={() => handleSelectCompletedImage(url)}>
                                              <Image src={url} alt="" fill className="object-cover" />
                                          </div>
                                      ))}
                                  </div>
                                </div>
                            )}
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

      <FlowerScrollIndicator collected={project.collectedAmount} target={project.targetAmount} />
    </>
  );
}