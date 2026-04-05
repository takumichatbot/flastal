'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { useAuth } from '@/app/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-react
import { 
    Clock, CheckCircle2, User, X, Shield, Zap, AlertCircle, ArrowLeft, Briefcase, 
    Coins, RefreshCw, PenTool, Sparkles, Image as ImageIcon, Send, Loader2
} from 'lucide-react'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
const JpText = ({ children, className }) => <span className={cn("inline-block leading-relaxed", className)}>{children}</span>;

// --- 🎨 Glassmorphism Components ---
const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(245,158,11,0.05)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-amber-300 rounded-full mix-blend-multiply filter blur-[2px] opacity-20"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.1, 0.4, 0.1], scale: [1, 2, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

// プロフィール項目表示用
const ProfileItem = ({ icon, label, value, colorClass = "text-amber-500 bg-amber-50 border-amber-100" }) => (
    <div className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-white/60 border border-white shadow-sm hover:shadow-md transition-all">
        <div className={cn("p-3 rounded-[1rem] border shadow-inner shrink-0", colorClass)}>
            {icon}
        </div>
        <div className="pt-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm md:text-base text-slate-800 font-bold break-words mt-1"><JpText>{value || '未設定'}</JpText></p>
        </div>
    </div>
);

// --- 🪄 Offer Modal ---
function OfferModal({ illustratorId, illustratorName, basePrice, onClose, onOfferSuccess }) {
    const router = useRouter();
    const { user, authenticatedFetch } = useAuth();
    const [myProjects, setMyProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [offerAmount, setOfferAmount] = useState(basePrice || 5000);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);

    // 自分の企画一覧を取得（自分が主催者で、かつイラストを依頼できる状態のもの）
    useEffect(() => {
        const fetchMyProjects = async () => {
            if (!user) return;
            try {
                const res = await authenticatedFetch(`${API_URL}/api/users/${user.id}/created-projects`);
                if (res.ok) {
                    const data = await res.json();
                    // 完了・中止以外のプロジェクトを抽出
                    const activeProjects = data.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED');
                    setMyProjects(activeProjects);
                    if (activeProjects.length > 0) setSelectedProjectId(activeProjects[0].id);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingProjects(false);
            }
        };
        fetchMyProjects();
    }, [user, authenticatedFetch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProjectId) return toast.error('依頼する企画を選択してください');
        if (!offerAmount || offerAmount < 100) return toast.error('正しい金額を入力してください');
        if (user.points < offerAmount) return toast.error('ポイントが不足しています');

        setIsSubmitting(true);
        const toastId = toast.loading('オファーを送信中...');

        try {
            // ※ バックエンドのイラストレーター用オファーAPIを叩く想定
            const res = await authenticatedFetch(`${API_URL}/api/illustrators/offers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    projectId: selectedProjectId, 
                    illustratorId, 
                    amount: parseInt(offerAmount),
                    message 
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'オファーの送信に失敗しました');
            }

            toast.success('オファーを送信しました！🎉\nクリエイターからの返答をお待ちください。', { id: toastId, duration: 6000 });
            onOfferSuccess();
            onClose();
        } catch (error) {
            toast.error(error.message, { id: toastId });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm p-4 z-[100] flex items-center justify-center">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><PenTool className="text-amber-500"/> イラスト作成を依頼する</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm transition-colors"><X size={20} /></button>
                </div>
                
                <div className="p-6 md:p-8 overflow-y-auto bg-slate-50/50">
                    <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shrink-0"><User size={24}/></div>
                         <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creator</p>
                             <p className="font-black text-slate-800">{illustratorName} <span className="text-xs font-bold text-slate-500 font-normal">さんへ</span></p>
                         </div>
                    </div>

                    <form id="offerForm" onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* 企画選択 */}
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">対象の企画</label>
                            {loadingProjects ? (
                                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-sm font-bold flex justify-center items-center gap-2"><Loader2 className="animate-spin" size={16}/>読み込み中...</div>
                            ) : myProjects.length > 0 ? (
                                <select 
                                    value={selectedProjectId} 
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none text-sm font-bold text-slate-800 transition-all cursor-pointer"
                                >
                                    {myProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                                    <p className="text-xs text-rose-600 font-bold mb-2">現在、あなたが主催している企画がありません。</p>
                                    <Link href="/projects/create" className="text-rose-500 text-xs font-black underline hover:text-rose-600">新しく企画を作成する</Link>
                                </div>
                            )}
                        </div>

                        {/* 金額 */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">依頼金額 (pt)</label>
                                <span className="text-[10px] text-slate-400 font-bold">現在の所持ポイント: <b className="text-amber-500">{user?.points?.toLocaleString() || 0}pt</b></span>
                            </div>
                            <div className="relative">
                                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18}/>
                                <input 
                                    type="number" min="100" required value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none text-lg font-black text-slate-800 transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10}/> オファーが承認されると、このポイントは仮払いとしてシステムにキープされます。</p>
                        </div>

                        {/* メッセージ */}
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">ご挨拶・要望など</label>
                            <textarea 
                                value={message} onChange={(e) => setMessage(e.target.value)} rows="4" placeholder="例: はじめまして！素敵な絵柄に惹かれてオファーさせていただきました。"
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none text-sm font-bold text-slate-800 transition-all resize-none"
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                    <button 
                        type="submit" form="offerForm" 
                        disabled={isSubmitting || !selectedProjectId || !offerAmount || (user?.points < offerAmount)} 
                        className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                        {isSubmitting ? '処理中...' : 'ポイントを使って依頼する'}
                    </button>
                    {user && user.points < offerAmount && (
                         <div className="mt-3 text-center">
                             <Link href="/points" className="text-xs font-black text-amber-500 hover:text-orange-500 underline flex items-center justify-center gap-1"><Zap size={14}/> ポイントをチャージする</Link>
                         </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

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

// ===========================================
// --- メインページコンポーネント ---
// ===========================================

function IllustratorDetailContent() { 
  const { id } = useParams();
  const { user, token, logout, authenticatedFetch } = useAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  
  const [illustrator, setIllustrator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const fetchIllustrator = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/illustrators/${id}`);
      if (!res.ok) {
          if (res.status === 404) throw new Error('クリエイターが見つかりませんでした。');
          throw new Error('情報の取得に失敗しました。');
      }
      
      const data = await res.json();
      setIllustrator(data);
    } catch (error) {
        toast.error(error.message); 
    } finally {
        setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchIllustrator(); }, [fetchIllustrator]);

  if (loading) {
      return <div className="flex items-center justify-center min-h-screen bg-amber-50/50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div></div>;
  }

  if (!illustrator) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6"><AlertCircle size={40} className="text-slate-300" /></div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Creator Not Found</h2>
            <p className="text-sm font-bold text-slate-500 mb-8">お探しのページは見つかりませんでした。</p>
            <Link href={user?.role === 'ILLUSTRATOR' ? "/illustrators/dashboard" : "/illustrators"}>
              <button className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                <ArrowLeft size={16}/> {user?.role === 'ILLUSTRATOR' ? "ダッシュボードへ戻る" : "一覧へ戻る"}
              </button>
            </Link>
        </div>
    );
  }

  const isMyProfile = user && user.role === 'ILLUSTRATOR' && user.id === illustrator.userId; 

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-amber-50/50 to-orange-50/50 font-sans relative overflow-hidden pb-24">
        <FloatingParticles />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 relative z-10">
            
            <div className="mb-6 flex justify-between items-center">
                <Link href={user?.role === 'ILLUSTRATOR' ? "/illustrators/dashboard" : "/illustrators"} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-amber-600 hover:bg-white shadow-sm border border-white transition-all">
                    <ArrowLeft size={16}/> 戻る
                </Link>
                {projectIdFromUrl && (
                    <span className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm animate-pulse">企画ID: {projectIdFromUrl} のオファー先選択中</span>
                )}
            </div>

            {/* --- Header Profile Card --- */}
            <GlassCard className="!p-0 overflow-hidden mb-8 relative">
              <div className="h-4 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"></div>

              <header className="p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left relative">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-white md:-rotate-3 z-10">
                      {illustrator.iconUrl || illustrator.user?.iconUrl ? (
                          <Image src={illustrator.iconUrl || illustrator.user.iconUrl} alt="アイコン" fill style={{objectFit: 'cover'}} />
                      ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={48} /></div>
                      )}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10 w-full">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                          <span className="px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                              <PenTool size={12}/> Illustrator
                          </span>
                          {illustrator.isAcceptingRequests && (
                              <span className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                                  <Sparkles size={12}/> 受付中
                              </span>
                          )}
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black text-slate-800 break-words tracking-tighter leading-tight"><JpText>{illustrator.name || illustrator.user?.handleName}</JpText></h1>
                      
                      {illustrator.socialLink && (
                          <a href={illustrator.socialLink} target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-sky-500 hover:text-sky-600 font-bold mt-2 flex items-center justify-center md:justify-start gap-1">
                              🔗 {illustrator.socialLink}
                          </a>
                      )}
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                          {Array.isArray(illustrator.tags) && illustrator.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">#{tag}</span>
                          ))}
                      </div>
                  </div>

                  <div className="hidden md:block z-10 shrink-0">
                     {(!user || user.role !== 'ILLUSTRATOR') && !isMyProfile ? (
                         <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if(!user) return router.push('/login');
                                setIsModalOpen(true);
                            }}
                            disabled={!illustrator.isAcceptingRequests}
                            className={cn("px-8 py-5 font-black text-white rounded-[1.5rem] shadow-xl flex items-center gap-2 text-lg transition-all", illustrator.isAcceptingRequests ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-200" : "bg-slate-300 shadow-none cursor-not-allowed")}
                          >
                            {illustrator.isAcceptingRequests ? <><Zap size={20}/> 依頼オファー</> : '現在受付停止中'}
                          </motion.button>
                     ) : null}
                  </div>
              </header>
            </GlassCard>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Bio & Details */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="h-fit space-y-6 !p-6 md:!p-8">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Creator Info</h2>
                        
                        <div className="space-y-4">
                            <ProfileItem icon={<Coins size={20}/>} label="基本料金 (目安)" value={`${illustrator.basePrice?.toLocaleString() || '---'} pt〜`} colorClass="text-amber-500 bg-amber-50 border-amber-100" />
                            <ProfileItem icon={<Clock size={20}/>} label="基本納期 (目安)" value={`約 ${illustrator.deliveryDays || '-'} 日`} colorClass="text-sky-500 bg-sky-50 border-sky-100" />
                            <ProfileItem icon={<RefreshCw size={20}/>} label="無料リテイク" value={`${illustrator.retakeCount || '0'} 回まで`} colorClass="text-emerald-500 bg-emerald-50 border-emerald-100" />
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="text-xs font-black text-slate-800 mb-2">自己紹介・ご案内</h3>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap"><JpText>{illustrator.bio || '自己紹介文はまだ設定されていません。'}</JpText></p>
                        </div>
                    </GlassCard>
                </div>

                {/* Right: Portfolio */}
                <div className="lg:col-span-2">
                    <GlassCard className="!p-6 md:!p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><ImageIcon className="text-amber-500" size={20}/> ポートフォリオ</h2>
                            <span className="text-xs font-bold text-slate-400">{illustrator.portfolioUrls?.length || 0}枚</span>
                        </div>

                        {illustrator.portfolioUrls?.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {illustrator.portfolioUrls.map((url, idx) => (
                                    <div key={idx} onClick={() => setPreviewImageUrl(url)} className="relative aspect-square rounded-2xl overflow-hidden group cursor-zoom-in bg-slate-100 border-2 border-white shadow-sm">
                                        <Image src={url} alt={`Portfolio ${idx}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn size={24} className="text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2rem]">
                                <ImageIcon className="mx-auto text-slate-300 mb-3" size={48}/>
                                <p className="text-sm font-bold text-slate-500 mb-1">ポートフォリオ画像がありません</p>
                            </div>
                        )}
                    </GlassCard>
                </div>

            </div>

            {/* Mobile Sticky Button */}
            <div className="md:hidden sticky bottom-6 z-30 mt-12 px-2">
              {(!user || user.role !== 'ILLUSTRATOR') && !isMyProfile ? ( 
                <button 
                    onClick={() => {
                        if(!user) return router.push('/login');
                        setIsModalOpen(true);
                    }} 
                    disabled={!illustrator.isAcceptingRequests}
                    className={cn("w-full py-5 font-black text-white rounded-[2rem] active:scale-95 transition-all flex items-center justify-center gap-2 text-lg shadow-2xl", illustrator.isAcceptingRequests ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-200" : "bg-slate-300 shadow-none")}
                >
                  {illustrator.isAcceptingRequests ? <><Zap size={20} /> イラスト作成を依頼する</> : '現在受付停止中'}
                </button>
              ) : null}
            </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
            <OfferModal 
                illustratorId={illustrator.id} 
                illustratorName={illustrator.name || illustrator.user?.handleName} 
                basePrice={illustrator.basePrice}
                onClose={() => setIsModalOpen(false)} 
                onOfferSuccess={() => {
                    setIsModalOpen(false);
                    router.push('/mypage');
                }}
            />
        )}
        {previewImageUrl && <ImageLightbox url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
      </AnimatePresence>
    </>
  );
}

export default function IllustratorDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-amber-50/50"><Loader2 className="animate-spin text-amber-500" size={48} /></div>}>
      <IllustratorDetailContent />
    </Suspense>
  );
}