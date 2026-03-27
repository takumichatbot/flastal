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
// 🎨 UI COMPONENTS (App-like Design)
// ===========================================
const AppCard = ({ children, className }) => (
  <div className={cn("bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8", className)}>
    {children}
  </div>
);

// ===========================================
// Sub Components
// ===========================================
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
          <AppCard className="text-center bg-gradient-to-b from-sky-50 to-white border-2 border-sky-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-full text-sky-500 mb-4 shadow-inner"><CheckCircle2 size={32} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">支援済みです</h3>
              <p className="text-slate-500 font-bold text-sm">ご協力ありがとうございます！🌸</p>
          </AppCard>
      );
  }

  if (project.status !== 'FUNDRAISING') {
    return (
        <AppCard className="text-center bg-slate-50 border border-slate-100">
            <h3 className="text-xl font-black text-slate-400 mb-2">受付終了</h3>
            <p className="text-slate-400 font-bold text-sm">現在、支援を募集していません。</p>
        </AppCard>
    );
  }

  return (
    <AppCard className="border-none shadow-[0_20px_40px_rgba(244,114,182,0.06)] ring-1 ring-slate-100">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Heart className="text-pink-500 fill-pink-500"/> 支援して参加する</h3>
      {!user && (
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-slate-400" size={16}/>
            <div className="text-xs font-bold text-slate-600 leading-relaxed">現在ゲストモードです。<br/>
                <Link href={`/login?redirect=/projects/${project.id}`} className="text-pink-500 underline hover:text-pink-600">ログインするとポイントが使えます</Link>
            </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* iOS Segmented Control Style */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <label className={cn("flex-1 text-center py-2.5 rounded-lg cursor-pointer text-sm font-black transition-all", pledgeType === 'tier' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="tier" className="hidden" /> コースから選ぶ
          </label>
          <label className={cn("flex-1 text-center py-2.5 rounded-lg cursor-pointer text-sm font-black transition-all", pledgeType === 'free' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="free" className="hidden" /> 金額を指定
          </label>
        </div>

        {pledgeType === 'tier' && project.pledgeTiers && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 no-scrollbar">
            {project.pledgeTiers.map(tier => (
              <label key={tier.id} className={cn("block p-5 border-2 rounded-2xl cursor-pointer transition-all relative overflow-hidden", selectedTierId === tier.id ? 'border-pink-500 bg-pink-50/30' : 'border-slate-100 bg-white hover:border-slate-200')}>
                <input type="radio" {...register('selectedTierId')} value={tier.id} className="hidden" />
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-2xl text-slate-800 tracking-tight">{tier.amount.toLocaleString()} <span className="text-sm font-bold text-slate-400">{user ? 'pt' : '円'}</span></span>
                  {selectedTierId === tier.id ? <CheckCircle2 className="text-pink-500 fill-pink-100" size={24}/> : <div className="w-6 h-6 rounded-full border-2 border-slate-200"/>}
                </div>
                <span className="text-sm font-bold text-pink-500 block mb-2">{tier.title}</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{tier.description}</p>
              </label>
            ))}
          </div>
        )}

        {pledgeType === 'free' && (
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">支援金額 ({user ? 'pt' : '円'})</label>
            <input type="number" {...register('pledgeAmount')} min="1000" className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-2xl font-black text-slate-800 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition-all" placeholder="1000"/>
          </div>
        )}

        {!user && (
            <div className="pt-4 space-y-3 border-t border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ゲスト情報</p>
              <input type="text" {...register('guestName')} className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 outline-none transition-all" placeholder="お名前 (ハンドルネーム)"/>
              <input type="email" {...register('guestEmail')} className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 outline-none transition-all" placeholder="メールアドレス"/>
            </div>
        )}

        <motion.button 
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting || finalAmount <= 0} 
            className="w-full py-4 font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl disabled:opacity-50 flex justify-center items-center gap-2 text-base transition-colors"
        >
            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} className="text-pink-400"/>}
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
        <AppCard className="!p-6 mb-8 border-none ring-1 ring-slate-100">
            <div className="relative px-2 md:px-6">
                <div className="absolute top-4 left-4 right-4 h-1.5 bg-slate-100 rounded-full -z-10"></div>
                <div className="absolute top-4 left-4 h-1.5 bg-pink-400 rounded-full transition-all duration-1000 ease-out -z-10" style={{ width: `${(currentOrder / (PROGRESS_STEPS.length - 1)) * 100}%` }}></div>
                <div className="flex justify-between items-start">
                    {stepsToDisplay.map((step, index) => {
                        const isCompleted = step.order <= currentOrder;
                        const isCurrent = step.order === currentOrder;
                        return (
                            <div key={step.key} className="flex flex-col items-center w-14 md:w-16 relative">
                                <motion.div 
                                    animate={{ scale: isCurrent ? 1.1 : 1 }}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm transition-colors duration-500 bg-white", 
                                        isCompleted ? "border-2 border-pink-500 text-pink-500" : "border-2 border-slate-200 text-slate-300",
                                        isCurrent && "ring-4 ring-pink-50"
                                    )}>
                                    {isCompleted ? <Check size={14} strokeWidth={4} /> : index + 1}
                                </motion.div>
                                <span className={cn("text-[9px] mt-2 text-center font-bold tracking-wider whitespace-nowrap", isCompleted ? "text-pink-600" : "text-slate-400")}>
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
                        <button key={nextStep.key} onClick={() => handleStatusUpdate(nextStep.key)} className="px-5 py-2 text-xs font-black bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 shadow-sm transition-colors">
                            {nextStep.label} に進む
                        </button>
                    ))}
                    {currentOrder >= 5 && <button onClick={() => handleStatusUpdate('DELIVERED_OR_FINISHED')} className="px-5 py-2 text-xs font-black bg-slate-900 text-white rounded-full hover:bg-slate-800 shadow-md">納品完了にする</button>}
                </div>
            )}
        </AppCard>
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

  // Forms state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false); // ★ 送信中ステートを追加
  
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

  // ★ 活動報告の投稿処理
  const handlePostAnnouncement = async (e) => {
    e.preventDefault(); // これが超重要
    if (!announcementTitle.trim() || !announcementContent.trim()) {
        return toast.error('タイトルと本文を入力してください');
    }
    
    setIsPostingAnnouncement(true); // 送信中状態にする
    const toastId = toast.loading('投稿中...');
    
    try {
        const res = await authenticatedFetch(`${API_URL}/api/projects/${id}/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: announcementTitle, content: announcementContent })
        });
        if (!res.ok) throw new Error('投稿に失敗しました');
        
        toast.success('活動報告を投稿しました！', { id: toastId });
        setShowAnnouncementForm(false);
        setAnnouncementTitle('');
        setAnnouncementContent('');
        fetchProject(); // 画面をリフレッシュ
    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setIsPostingAnnouncement(false); // 送信中状態を解除
    }
  };

  // Mock handlers
  const handleGenerateAr = async () => { toast('AR機能は準備中です', { icon: '🚧' }); };
  const handleSelectCompletedImage = () => { toast('画像選択機能は準備中です', { icon: '🚧' }); };
  const handleUpload = () => { toast('アップロード機能は準備中です', { icon: '🚧' }); };
  const handleAddExpense = (e) => { e.preventDefault(); toast('支出の追加機能は準備中です', { icon: '🚧' }); };
  const handleDeleteExpense = () => { toast('削除機能は準備中です', { icon: '🚧' }); };
  const handleToggleTask = () => { toast('タスク管理は準備中です', { icon: '🚧' }); };
  const handleDeleteTask = () => { toast('タスク管理は準備中です', { icon: '🚧' }); };
  const onPledgeSubmit = () => { toast('決済機能は準備中です', { icon: '🚧' }); };

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
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-800 relative">
      
      {/* --- HERO IMAGE (App-style full bleed on mobile, rounded on desktop) --- */}
      <div className="w-full max-w-6xl mx-auto md:px-4 lg:px-8 md:mt-6 mb-6 md:mb-8">
        {project.status !== 'COMPLETED' && project.imageUrl ? (
            <div className="relative w-full aspect-[4/3] md:aspect-[21/9] md:rounded-[2rem] overflow-hidden shadow-sm group cursor-zoom-in" onClick={() => { setModalImageSrc(project.imageUrl); setIsImageModalOpen(true); }}>
                <Image src={project.imageUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                    <div className="mb-3"><OfficialBadge projectId={project.id} isPlanner={isPlanner} /></div>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md"><JpText>{project.title}</JpText></h1>
                </div>
            </div>
        ) : project.status === 'COMPLETED' ? (
            <div className="p-10 md:p-16 bg-gradient-to-br from-amber-400 to-orange-500 md:rounded-[2.5rem] shadow-lg text-center relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                <div className="relative z-10">
                    <span className="inline-block bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm border border-white/20">Project Completed</span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 drop-shadow-md">🎉 企画完了 🎉</h2>
                    <div className="bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/20 text-left max-w-3xl mx-auto">
                        <h4 className="font-black mb-3 text-sm flex items-center gap-2"><MessageCircle size={16}/> 企画者からのメッセージ</h4>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-bold">{project.completionComment}</p>
                    </div>
                </div>
            </div>
        ) : null}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* --- MAIN COLUMN --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Organizer Info & Progress */}
          <AppCard className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                    {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={56} height={56} className="object-cover" /> : <User size={24} className="text-slate-400"/>}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer</p>
                    <p className="font-black text-slate-800 text-base">{project.planner?.handleName}</p>
                </div>
            </div>
            <div className="w-full md:w-2/3">
               <UpsellAlert target={project.targetAmount} collected={project.collectedAmount} />
            </div>
          </AppCard>

          {/* App-like Segmented Tabs */}
          <div className="bg-slate-200/50 p-1.5 rounded-2xl flex overflow-x-auto w-full mb-6 no-scrollbar">
              {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                    className={cn(
                      "flex-1 min-w-[120px] py-3 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all duration-300",
                      activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    )}>
                      <tab.icon size={16} className={activeTab === tab.id ? "text-slate-900" : ""}/> 
                      <span>{tab.label}</span>
                  </button>
              ))}
          </div>
          
          {/* TAB CONTENT */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              
              {/* --- TAB: OVERVIEW --- */}
              {activeTab === 'overview' && (
                  <div className="space-y-6">
                      <AppCard>
                          <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Book className="text-slate-400"/> 企画の詳細</h2>
                          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base">
                            <JpText>{project.description}</JpText>
                          </div>
                      </AppCard>

                      {(project.designDetails || project.size || project.flowerTypes) && (
                          <AppCard className="bg-slate-50/50 border border-slate-100">
                              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><ImageIcon className="text-slate-400"/> デザインの希望</h2>
                              <div className="space-y-3">
                                  {project.designDetails && <div className="bg-white p-4 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">雰囲気・詳細</span><p className="text-slate-700 font-bold text-sm">{project.designDetails}</p></div>}
                                  <div className="grid grid-cols-2 gap-3">
                                    {project.size && <div className="bg-white p-4 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">希望サイズ</span><p className="text-slate-700 font-bold text-sm">{project.size}</p></div>}
                                    {project.flowerTypes && <div className="bg-white p-4 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">使いたい花</span><p className="text-slate-700 font-bold text-sm">{project.flowerTypes}</p></div>}
                                  </div>
                              </div>
                          </AppCard>
                      )}

                      {/* ★ 活動報告 (アプリ風UIに修正) */}
                      <div className="pt-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 px-2">
                              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">活動報告</h2>
                              {isPlanner && (
                                <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                  <PenTool size={14}/> 新規投稿
                                </button>
                              )}
                          </div>
                          
                          {/* 投稿フォーム (完全に動作するように修正) */}
                          <AnimatePresence>
                            {isPlanner && showAnnouncementForm && (
                                <motion.form 
                                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  onSubmit={handlePostAnnouncement} 
                                  className="mb-6 p-5 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden relative z-20"
                                >
                                    <input value={announcementTitle} onChange={(e)=>setAnnouncementTitle(e.target.value)} placeholder="タイトル (活動の進捗など)" disabled={isPostingAnnouncement} className="w-full p-4 mb-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-300 outline-none font-bold text-slate-800 transition-all disabled:opacity-50"/>
                                    <textarea value={announcementContent} onChange={(e)=>setAnnouncementContent(e.target.value)} placeholder="本文を入力..." rows="4" disabled={isPostingAnnouncement} className="w-full p-4 mb-4 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-300 outline-none font-medium text-slate-700 resize-none transition-all disabled:opacity-50"/>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowAnnouncementForm(false)} disabled={isPostingAnnouncement} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors disabled:opacity-50">キャンセル</button>
                                        <button type="submit" disabled={isPostingAnnouncement} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50">
                                            {isPostingAnnouncement ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} 
                                            投稿する
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                          </AnimatePresence>

                          {/* 投稿リスト (SNSフィード風) */}
                          {project.announcements?.length > 0 ? (
                              <div className="space-y-4">
                                  {project.announcements.map(a=>(
                                      <AppCard key={a.id} className="!p-6 hover:shadow-md transition-shadow">
                                          <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={40} height={40} className="object-cover" /> : <User size={16} className="text-slate-400"/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{project.planner?.handleName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                          </div>
                                          <h3 className="font-black text-slate-800 text-base mb-2">{a.title}</h3>
                                          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium"><JpText>{a.content}</JpText></p>
                                      </AppCard>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-slate-400 text-sm text-center py-16 bg-white rounded-[2rem] font-bold flex flex-col items-center shadow-sm">
                                <MessageCircle size={32} className="text-slate-200 mb-3"/>
                                まだ活動報告はありません
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* --- TAB: COLLABORATION --- */}
              {activeTab === 'collaboration' && (
                <div className="space-y-6">
                    {aiSummary && (
                        <AppCard className="bg-slate-900 text-white border-slate-800">
                            <h2 className="text-sm font-black text-slate-300 mb-4 flex items-center"><Wand2 className="mr-2" size={16}/> AI Summary</h2>
                            <div className="text-sm leading-relaxed font-medium prose prose-invert max-w-none"><Markdown>{aiSummary}</Markdown></div>
                        </AppCard>
                    )}

                    {(isPlanner || isPledger || isFlorist) && (
                        <AppCard>
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><ImageIcon className="text-slate-400"/> ムードボード</h2>
                            <MoodboardPostForm projectId={project.id} onPostSuccess={fetchProject} /> 
                            <div className="mt-8 pt-6 border-t border-slate-100"><MoodboardDisplay projectId={project.id} /></div>
                        </AppCard>
                    )}

                    {(isPlanner || isPledger || isFlorist) && (
                        <AppCard className="!p-0 overflow-hidden flex flex-col h-[600px]">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <MessageSquare className="text-slate-400" size={18}/>
                                <h2 className="text-sm font-black text-slate-800">企画チャット</h2>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <GroupChat project={project} user={user} isPlanner={isPlanner} isPledger={isPledger} socket={socket} onSummaryUpdate={setAiSummary} summary={aiSummary} />
                            </div>
                        </AppCard>
                    )}

                    {isPlanner && (
                        <AppCard>
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><CheckCircle2 className="text-slate-400"/> タスク管理</h2>
                            <div className="flex flex-col sm:flex-row gap-2 mb-6">
                                <input type="text" value={newTaskTitle} onChange={(e)=>setNewTaskTitle(e.target.value)} placeholder="新しいタスクを追加" className="p-3 border border-slate-200 rounded-xl flex-grow bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all text-sm font-bold"/>
                                <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-black text-sm">追加</button>
                            </div>
                            <div className="space-y-2">
                                {project.tasks?.map(t=>(
                                    <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={t.isCompleted} onChange={()=>handleToggleTask(t.id, t.isCompleted)} className="w-5 h-5 text-slate-900 rounded focus:ring-slate-900 border-slate-300 cursor-pointer"/>
                                            <span className={cn("text-sm font-bold transition-colors", t.isCompleted ? 'line-through text-slate-400' : 'text-slate-700')}>{t.title}</span>
                                        </div>
                                        <button onClick={()=>handleDeleteTask(t.id)} className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-white transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                {(!project.tasks || project.tasks.length === 0) && <p className="text-center text-slate-400 text-sm font-bold py-6">タスクはありません</p>}
                            </div>
                        </AppCard>
                    )}

                    <div>
                        <h2 className="text-lg font-black text-slate-800 mb-4 px-2">各種ツール</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AppCard className="!p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-black text-slate-800 mb-1 flex items-center text-base"><Box className="mr-2 text-slate-400" size={18}/> ARプレビュー</h3>
                                    <p className="text-xs font-bold text-slate-500 mb-6">スマホをかざして実際のサイズ感を確認できます。</p>
                                </div>
                                <button onClick={() => setIsArModalOpen(true)} className="w-full py-3 bg-slate-100 text-slate-700 text-sm font-black rounded-xl hover:bg-slate-200 transition-all">起動する</button>
                            </AppCard>
                            {(isPlanner || isFlorist) && (
                                <AppCard className="!p-6 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-black text-slate-800 mb-1 flex items-center text-base"><UploadCloud className="mr-2 text-slate-400" size={18}/> データ提出</h3>
                                        <p className="text-xs font-bold text-slate-500 mb-6">入稿データなどをアップロードします。</p>
                                    </div>
                                    <PanelPreviewer onImageSelected={(file) => {
                                        const dummyEvent = { target: { files: [file] } };
                                        handleUpload(dummyEvent, 'illustration');
                                    }} />
                                </AppCard>
                            )}
                        </div>
                    </div>
                </div> 
              )}

              {/* --- TAB: FINANCE --- */}
              {activeTab === 'finance' && (
                <div className="space-y-6">
                    <AppCard>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-lg font-black text-slate-800 flex items-center"><DollarSign className="mr-2 text-slate-400"/> 収支報告</h2>
                            <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-colors"><Printer size={14}/> PDF保存</button>
                        </div>
                        
                        <div className="bg-slate-50 p-5 rounded-2xl text-sm space-y-3">
                            <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">収入 (支援総額)</span><span className="font-black text-base text-slate-800">{project.collectedAmount.toLocaleString()} pt</span></div>
                            <div className="flex justify-between items-center text-rose-500"><span className="font-bold">支出合計</span><span className="font-black text-base">- {totalExpense.toLocaleString()} pt</span></div>
                            <div className="h-px bg-slate-200 my-2"></div>
                            <div className="flex justify-between items-center"><span className="font-black text-slate-800">残高 (余剰金)</span><span className="text-xl font-black text-slate-900">{balance.toLocaleString()} pt</span></div>
                        </div>
                    </AppCard>

                    <div style={{ display: 'none' }}><BalanceSheet ref={componentRef} project={project} totalExpense={totalExpense} balance={balance} /></div>
                    
                    <AppCard>
                        <h3 className="font-black text-slate-800 mb-4 text-base">支出の内訳</h3>
                        {isPlanner && (
                            <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2 mb-6 bg-slate-50 p-3 rounded-xl">
                                <input type="text" value={expenseName} onChange={(e)=>setExpenseName(e.target.value)} placeholder="項目名 (例: パネル代)" className="p-3 border border-transparent rounded-lg flex-grow text-sm font-bold focus:outline-none focus:bg-white focus:border-slate-300"/>
                                <input type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} placeholder="金額" className="p-3 border border-transparent rounded-lg w-full sm:w-32 text-sm font-bold focus:outline-none focus:bg-white focus:border-slate-300"/>
                                <button type="submit" className="p-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-black w-full sm:w-auto">追加</button>
                            </form>
                        )}
                        <div className="space-y-2">
                            {project.expenses?.map(e=>(
                                <div key={e.id} className="flex justify-between items-center text-sm bg-slate-50 p-3.5 rounded-xl">
                                    <span className="font-black text-slate-700">{e.itemName}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-800">{e.amount.toLocaleString()} pt</span>
                                        {isPlanner && <button onClick={()=>handleDeleteExpense(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={16}/></button>}
                                    </div>
                                </div>
                            ))}
                            {(!project.expenses || project.expenses.length === 0) && <p className="text-center text-slate-400 text-sm font-bold py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">支出はまだ登録されていません</p>}
                        </div>
                    </AppCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- SIDEBAR --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
              
              <PledgeForm project={project} user={user} onPledgeSubmit={onPledgeSubmit} isPledger={isPledger} />
              
              {isPlanner && (
                  <AppCard className="!p-6 bg-slate-900 text-white">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Planner Menu</h3>
                      <div className="space-y-2">
                          <button onClick={()=>setIsTargetAmountModalOpen(true)} className="w-full text-left p-3.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-colors flex items-center"><DollarSign className="mr-3 text-slate-400" size={16}/> 目標金額の変更</button>
                          <Link href={`/projects/edit/${id}`} className="w-full text-left p-3.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-colors flex items-center"><Edit3 className="mr-3 text-slate-400" size={16}/> 企画内容の編集</Link>
                          <Link href={`/florists?projectId=${id}`} className="w-full text-left p-3.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-colors flex items-center"><Search className="mr-3 text-slate-400" size={16}/> お花屋さんを探す</Link>
                          
                          {project.status==='SUCCESSFUL' && (
                              <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-4 bg-white text-slate-900 p-3.5 rounded-xl font-black transition-transform hover:scale-[1.02]">完了報告する</button>
                          )}
                          
                          {project.status !== 'CANCELED' && project.status !== 'COMPLETED' && (
                              <button onClick={() => setIsCancelModalOpen(true)} className="w-full mt-4 text-slate-500 text-xs font-bold text-center hover:text-rose-400 py-2 transition-colors">企画を中止する...</button>
                          )}
                      </div>
                  </AppCard>
              )}

              {/* 通報 */}
              <div className="text-center pt-2">
                <button onClick={() => setReportModalOpen(true)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                  <AlertTriangle size={12}/> 問題を報告する
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isImageModalOpen && <ImageLightbox url={modalImageSrc} onClose={() => setIsImageModalOpen(false)} />}
        {isReportModalOpen && <ReportModal projectId={id} user={user} onClose={() => setReportModalOpen(false)} />}
        {isCompletionModalOpen && <CompletionReportModal project={project} user={user} onClose={() => setIsCompletionModalOpen(false)} onReportSubmitted={fetchProject} />}
        {isInstructionModalOpen && <InstructionSheetModal project={project} onClose={() => setIsInstructionModalOpen(false)} />}
        {isCancelModalOpen && <ProjectCancelModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} project={project} onCancelComplete={() => { fetchProject(); router.push('/mypage'); }} />}
      </AnimatePresence>

    </div>
  );
}