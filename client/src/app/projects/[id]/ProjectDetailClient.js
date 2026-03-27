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
// 🎨 UI COMPONENTS
// ===========================================
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-pink-200 rounded-full mix-blend-multiply filter blur-[2px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -100], x: [null, (Math.random() - 0.5) * 50], opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const AppCard = ({ children, className }) => (
  <div className={cn("bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-[2rem]", className)}>
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
          <AppCard className="p-8 text-center bg-gradient-to-b from-blue-50/50 to-white">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full text-blue-500 mb-4 shadow-inner"><CheckCircle2 size={32} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">支援済みです</h3>
              <p className="text-slate-500 font-bold text-sm">ご協力ありがとうございます！🌸</p>
          </AppCard>
      );
  }

  if (project.status !== 'FUNDRAISING') {
    return (
        <AppCard className="p-8 text-center bg-slate-50 border-slate-100">
            <h3 className="text-xl font-black text-slate-400 mb-2">受付終了</h3>
            <p className="text-slate-400 font-bold text-sm">現在、支援を募集していません。</p>
        </AppCard>
    );
  }

  return (
    <AppCard className="p-6 md:p-8 shadow-[0_20px_40px_rgba(244,114,182,0.06)] border-pink-100">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Heart className="text-pink-500 fill-pink-500"/> 支援して参加する</h3>
      {!user && (
        <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-amber-500" size={16}/>
            <div className="text-xs font-bold text-amber-900 leading-relaxed">現在ゲストモードです。<br/>
                <Link href={`/login?redirect=/projects/${project.id}`} className="text-amber-600 underline hover:text-amber-800">ログインするとポイントが使えます</Link>
            </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl">
          <label className={cn("flex-1 text-center py-3 rounded-xl cursor-pointer text-sm font-black transition-all", pledgeType === 'tier' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="tier" className="hidden" /> コースから選ぶ
          </label>
          <label className={cn("flex-1 text-center py-3 rounded-xl cursor-pointer text-sm font-black transition-all", pledgeType === 'free' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            <input type="radio" {...register('pledgeType')} value="free" className="hidden" /> 金額を指定
          </label>
        </div>

        {pledgeType === 'tier' && project.pledgeTiers && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 no-scrollbar">
            {project.pledgeTiers.map(tier => (
              <label key={tier.id} className={cn("block p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all group relative overflow-hidden", selectedTierId === tier.id ? 'border-pink-400 bg-pink-50/30 shadow-md ring-4 ring-pink-50' : 'border-slate-100 bg-white hover:border-pink-200 shadow-sm')}>
                <input type="radio" {...register('selectedTierId')} value={tier.id} className="hidden" />
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xl text-slate-800">{tier.amount.toLocaleString()} <span className="text-xs font-bold text-slate-400">{user ? 'pt' : '円'}</span></span>
                  {selectedTierId === tier.id ? <CheckCircle2 className="text-pink-500 fill-pink-100" size={24}/> : <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-pink-300"/>}
                </div>
                <span className="text-sm font-black text-pink-500 block mb-2">{tier.title}</span>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">{tier.description}</p>
              </label>
            ))}
          </div>
        )}

        {pledgeType === 'free' && (
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">支援金額 ({user ? 'pt' : '円'})</label>
            <input type="number" {...register('pledgeAmount')} min="1000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-800 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition-all" placeholder="1000"/>
          </div>
        )}

        {!user && (
            <div className="pt-4 space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ゲスト情報</p>
              <div className="grid grid-cols-1 gap-3">
                  <input type="text" {...register('guestName')} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 outline-none transition-all" placeholder="お名前 (ハンドルネーム)"/>
                  <input type="email" {...register('guestEmail')} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 outline-none transition-all" placeholder="メールアドレス"/>
              </div>
            </div>
        )}

        <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting || finalAmount <= 0} 
            className="w-full py-4 font-black text-white bg-slate-900 rounded-2xl disabled:opacity-50 flex justify-center items-center gap-2 text-base shadow-lg shadow-slate-900/20"
        >
            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} className="text-pink-400"/>}
            {isSubmitting ? '処理中...' : (user ? 'ポイントで支援する' : '決済へ進む')}
        </motion.button>
      </form>
    </AppCard>
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

  // Forms state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

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

  // ★ 修正: 活動報告の投稿処理を実装
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) {
        return toast.error('タイトルと本文を入力してください');
    }
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
        fetchProject(); // データを再取得して表示を更新
    } catch (error) {
        toast.error(error.message, { id: toastId });
    }
  };

  // Mock handlers (To prevent crashes)
  const handleAddExpense = (e) => { e.preventDefault(); toast('支出機能は準備中です', { icon: '🚧' }); };
  const handleDeleteExpense = () => { toast('削除機能は準備中です', { icon: '🚧' }); };
  const handleToggleTask = () => { toast('タスク管理は準備中です', { icon: '🚧' }); };
  const handleDeleteTask = () => { toast('タスク管理は準備中です', { icon: '🚧' }); };
  const onPledgeSubmit = () => { toast('ポイント決済は準備中です', { icon: '🚧' }); };

  const isAssignedFlorist = user && user.role === 'FLORIST' && project?.offer?.floristId === user.id;
  const isPledger = user && (project?.pledges || []).some(p => p.userId === user.id);
  const isPlanner = user && user.id === project?.planner?.id;
  const isFlorist = user && user.role === 'FLORIST';
  const isMounted = useIsMounted();
  
  if (!isMounted) return null;
  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500" size={40} /></div>;
  if (!project) return <div className="text-center py-32 text-slate-400 font-bold text-lg bg-slate-50 min-h-screen">企画が見つかりませんでした。</div>;

  const totalExpense = (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = project.collectedAmount - totalExpense;

  const TABS = [
    { id: 'overview', label: '概要と報告', icon: Book }, 
    { id: 'collaboration', label: '共同作業・チャット', icon: PenTool }, 
    { id: 'finance', label: '収支報告', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans text-slate-800 relative">
      
      {/* --- HERO IMAGE (App-style full bleed or large card) --- */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-8 mb-8">
        {project.status !== 'COMPLETED' && project.imageUrl ? (
            <div className="relative w-full aspect-[4/3] md:aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-sm group cursor-zoom-in" onClick={() => { setModalImageSrc(project.imageUrl); setIsImageModalOpen(true); }}>
                <Image src={project.imageUrl} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                    <div className="mb-3"><OfficialBadge projectId={project.id} isPlanner={isPlanner} /></div>
                    <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md"><JpText>{project.title}</JpText></h1>
                </div>
            </div>
        ) : project.status === 'COMPLETED' ? (
            <div className="p-10 md:p-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] shadow-lg text-center relative overflow-hidden text-white">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* --- MAIN COLUMN --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Organizer Info & Progress */}
          <AppCard className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden shadow-inner border border-slate-200 shrink-0">
                    {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} alt="" width={56} height={56} className="object-cover" /> : <User size={24} className="text-slate-400"/>}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer</p>
                    <p className="font-black text-slate-800 text-lg">{project.planner?.handleName}</p>
                </div>
            </div>
            <div className="w-full md:w-2/3">
               <UpsellAlert target={project.targetAmount} collected={project.collectedAmount} />
            </div>
          </AppCard>

          {/* App-like Segmented Tabs */}
          <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 overflow-x-auto w-full mb-6">
              {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                    className={cn(
                      "flex-1 min-w-[120px] py-3 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all duration-300",
                      activeTab === tab.id ? 'bg-white shadow-sm text-pink-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    )}>
                      <tab.icon size={16} className={activeTab === tab.id ? "text-pink-400" : ""}/> 
                      <span className="hidden sm:inline">{tab.label}</span>
                  </button>
              ))}
          </div>
          
          {/* TAB CONTENT */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              
              {/* --- TAB: OVERVIEW --- */}
              {activeTab === 'overview' && (
                  <div className="space-y-6">
                      <AppCard className="p-6 md:p-8">
                          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Book className="text-sky-500"/> 企画の詳細</h2>
                          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base">
                            <JpText>{project.description}</JpText>
                          </div>
                      </AppCard>

                      {(project.designDetails || project.size || project.flowerTypes) && (
                          <AppCard className="p-6 md:p-8 bg-pink-50/30 border-pink-100">
                              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><ImageIcon className="text-pink-500"/> デザインの希望</h2>
                              <div className="space-y-4">
                                  {project.designDetails && <div className="bg-white p-4 rounded-2xl border border-pink-50 shadow-sm"><span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1">雰囲気・詳細</span><p className="text-slate-700 font-bold text-sm">{project.designDetails}</p></div>}
                                  <div className="grid grid-cols-2 gap-4">
                                    {project.size && <div className="bg-white p-4 rounded-2xl border border-pink-50 shadow-sm"><span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1">希望サイズ</span><p className="text-slate-700 font-bold text-sm">{project.size}</p></div>}
                                    {project.flowerTypes && <div className="bg-white p-4 rounded-2xl border border-pink-50 shadow-sm"><span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1">使いたい花</span><p className="text-slate-700 font-bold text-sm">{project.flowerTypes}</p></div>}
                                  </div>
                              </div>
                          </AppCard>
                      )}

                      {/* ★ 活動報告 (修正完了部分) */}
                      <div className="pt-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><MessageCircle className="text-emerald-500"/> 活動報告</h2>
                              {isPlanner && (
                                <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-black shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                  <Plus size={16}/> 新規投稿
                                </button>
                              )}
                          </div>
                          
                          {/* 投稿フォーム (formタグで実装) */}
                          <AnimatePresence>
                            {isPlanner && showAnnouncementForm && (
                                <motion.form 
                                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  onSubmit={handlePostAnnouncement} 
                                  className="mb-8 p-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden"
                                >
                                    <input value={announcementTitle} onChange={(e)=>setAnnouncementTitle(e.target.value)} placeholder="タイトル (活動の進捗など)" className="w-full p-4 mb-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none font-bold text-slate-800 transition-all"/>
                                    <textarea value={announcementContent} onChange={(e)=>setAnnouncementContent(e.target.value)} placeholder="本文を入力..." rows="4" className="w-full p-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none font-medium text-slate-700 resize-none transition-all"/>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowAnnouncementForm(false)} className="px-6 py-3 text-sm text-slate-500 hover:bg-slate-100 rounded-full font-bold transition-colors">キャンセル</button>
                                        <button type="submit" className="px-8 py-3 bg-emerald-500 text-white text-sm font-black rounded-full hover:bg-emerald-600 shadow-md transition-all flex items-center gap-2"><Send size={16}/> 投稿する</button>
                                    </div>
                                </motion.form>
                            )}
                          </AnimatePresence>

                          {/* 投稿リスト */}
                          {project.announcements?.length > 0 ? (
                              <div className="space-y-4">
                                  {project.announcements.map(a=>(
                                      <AppCard key={a.id} className="p-6 md:p-8 hover:border-emerald-200 transition-colors">
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center"><User size={14}/></div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString('ja-JP')}</p>
                                                <p className="text-xs font-black text-slate-700">{project.planner?.handleName}</p>
                                            </div>
                                          </div>
                                          <h3 className="font-black text-slate-800 text-lg mb-3">{a.title}</h3>
                                          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium"><JpText>{a.content}</JpText></p>
                                      </AppCard>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-slate-400 text-sm text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 font-bold flex flex-col items-center">
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
                        <AppCard className="p-6 md:p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                            <h2 className="text-lg font-black text-amber-800 mb-4 flex items-center"><Wand2 className="mr-2"/> AIまとめ (最新の決定事項)</h2>
                            <div className="text-sm text-amber-900 leading-relaxed font-medium prose prose-sm max-w-none"><Markdown>{aiSummary}</Markdown></div>
                        </AppCard>
                    )}

                    {(isPlanner || isPledger || isFlorist) && (
                        <AppCard className="p-6 md:p-8">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><MessageSquare className="text-sky-500"/> 企画チャット</h2>
                            <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden bg-slate-50">
                                <GroupChat project={project} user={user} isPlanner={isPlanner} isPledger={isPledger} socket={socket} onSummaryUpdate={setAiSummary} summary={aiSummary} />
                            </div>
                        </AppCard>
                    )}

                    {(isPlanner || isPledger || isFlorist) && (
                        <AppCard className="p-6 md:p-8">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><ImageIcon className="text-pink-500"/> ムードボード</h2>
                            <MoodboardPostForm projectId={project.id} onPostSuccess={fetchProject} /> 
                            <div className="mt-8"><MoodboardDisplay projectId={project.id} /></div>
                        </AppCard>
                    )}
                </div> 
              )}

              {/* --- TAB: FINANCE --- */}
              {activeTab === 'finance' && (
                <div className="space-y-6">
                    <AppCard className="p-6 md:p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-xl font-black text-slate-800 flex items-center"><DollarSign className="mr-2 text-emerald-500 bg-emerald-100 rounded-full p-1"/> 収支報告</h2>
                            <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-full transition-colors"><Printer size={14}/> PDFで保存</button>
                        </div>
                        
                        <div className="bg-slate-50 p-6 rounded-[1.5rem] text-sm space-y-4 border border-slate-100">
                            <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">収入 (支援総額)</span><span className="font-black text-lg text-slate-800">{project.collectedAmount.toLocaleString()} pt</span></div>
                            <div className="flex justify-between items-center text-rose-500"><span className="font-bold">支出合計</span><span className="font-black text-lg">- {totalExpense.toLocaleString()} pt</span></div>
                            <div className="h-px bg-slate-200 my-4"></div>
                            <div className="flex justify-between items-center"><span className="font-black text-slate-800">残高 (余剰金)</span><span className="text-2xl font-black text-emerald-500">{balance.toLocaleString()} pt</span></div>
                        </div>
                    </AppCard>

                    <div style={{ display: 'none' }}><BalanceSheet ref={componentRef} project={project} totalExpense={totalExpense} balance={balance} /></div>
                    
                    <AppCard className="p-6 md:p-8">
                        <h3 className="font-black text-slate-800 mb-6 text-lg">支出の詳細リスト</h3>
                        <div className="space-y-3">
                            {project.expenses?.map(e=>(
                                <div key={e.id} className="flex justify-between items-center text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="font-black text-slate-700">{e.itemName}</span>
                                    <span className="font-black text-slate-800">{e.amount.toLocaleString()} pt</span>
                                </div>
                            ))}
                            {(!project.expenses || project.expenses.length === 0) && <p className="text-center text-slate-400 text-sm font-bold py-10 bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">支出はまだ登録されていません</p>}
                        </div>
                    </AppCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- SIDEBAR --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-32 space-y-6">
              
              <PledgeForm project={project} user={user} onPledgeSubmit={onPledgeSubmit} isPledger={isPledger} />
              
              {isPlanner && (
                  <AppCard className="p-6 bg-slate-900 text-white border-slate-800 shadow-xl">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><PenTool size={14}/> Planner Menu</h3>
                      <div className="space-y-3">
                          <Link href={`/projects/edit/${id}`} className="w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-bold text-white transition-colors flex items-center"><Edit3 className="mr-3 text-sky-400" size={18}/> 企画内容の編集</Link>
                          <Link href={`/florists?projectId=${id}`} className="w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-bold text-white transition-colors flex items-center"><Search className="mr-3 text-pink-400" size={18}/> お花屋さんを探す</Link>
                          
                          {project.status==='SUCCESSFUL' && (
                              <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-4 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white p-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all border border-emerald-300">🎉 完了報告する</button>
                          )}
                          
                          {project.status !== 'CANCELED' && project.status !== 'COMPLETED' && (
                              <button onClick={() => setIsCancelModalOpen(true)} className="w-full mt-6 text-slate-500 text-xs font-bold text-center hover:text-rose-400 py-2 transition-colors">企画を中止する...</button>
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

      <FlowerScrollIndicator collected={project.collectedAmount} target={project.targetAmount} />
    </div>
  );
}