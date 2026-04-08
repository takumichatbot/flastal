// src/app/illustrators/projects/[id]/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
import { 
    Clock, User, Calendar, FileText, Send, 
    ArrowLeft, DollarSign, CheckCircle2, AlertTriangle, 
    MessageSquare, Briefcase, Loader2, Image as ImageIcon,
    UploadCloud, X, Brush
} from 'lucide-react';

// --- Components ---
// 企画者側のチャットコンポーネントを再利用します
import GroupChat from '@/app/projects/[id]/components/GroupChat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 🎨 ヘルパーコンポーネント
const AppCard = ({ children, className }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-8 ${className}`}>
        {children}
    </div>
);
const JpText = ({ children }) => <span className="inline-block leading-relaxed">{children}</span>;

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

export default function IllustratorProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; // projectId
    const { user, authenticatedFetch, loading: authLoading } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const fetchProjectDetails = useCallback(async () => {
        if (!id || !user) return;
        try {
            setLoading(true);
            const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`);
            if (!res.ok) throw new Error('企画情報の取得に失敗しました');
            const data = await res.json();
            
            // この企画の担当絵師が自分でない場合は弾く
            if (data.illustratorId !== user.id) {
                toast.error('この企画の担当クリエイターではありません');
                router.push('/illustrators/dashboard');
                return;
            }
            
            setProject(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id, user, authenticatedFetch, router]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'ILLUSTRATOR') {
                router.push('/illustrators/login');
                return;
            }
            fetchProjectDetails();
        }
    }, [authLoading, user, fetchProjectDetails, router]);

    // WebSocket (チャット) の接続
    useEffect(() => {
        if (!user || !id) return;
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        if (!token) return;
        
        const newSocket = io(API_URL, { transports: ['polling'], auth: { token: `Bearer ${token}` } });
        setSocket(newSocket);
        newSocket.emit('joinProjectRoom', id);
        
        newSocket.on('receiveGroupChatMessage', (msg) => {
            setProject(prev => prev ? { ...prev, groupChatMessages: [...(prev.groupChatMessages || []), msg] } : null);
        });
        
        return () => newSocket.disconnect();
    }, [id, user]);

    // --- イラストの納品 (アップロード) ---
    const handleUploadDelivery = async (e) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        
        const toastId = toast.loading('イラストをアップロードして納品しています...');
        setIsUploading(true);

        try {
            // 1. 画像のアップロード (S3等のURL取得を想定)
            const formData = new FormData();
            formData.append('image', file);
            const uploadRes = await authenticatedFetch(`${API_URL}/api/tools/upload-image`, {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました');
            const data = await uploadRes.json();
            const uploadedUrl = data.url;

            // 2. プロジェクトのイラストURLを更新（isIllustrationAccepted は false でリセット）
            const updateRes = await authenticatedFetch(`${API_URL}/api/projects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    illustrationDataUrl: uploadedUrl,
                    isIllustrationAccepted: false 
                })
            });
            
            if (!updateRes.ok) throw new Error('納品処理に失敗しました');

            setProject(prev => ({ 
                ...prev, 
                illustrationDataUrl: uploadedUrl,
                isIllustrationAccepted: false
            }));
            toast.success('イラストを納品しました！企画者の確認をお待ちください。', { id: toastId });
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };


    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-amber-500" size={40}/></div>;
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/50 to-orange-50/50 pb-24 font-sans text-slate-800 relative">
            {/* --- 背景装飾 --- */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
                <Link href="/illustrators/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-amber-600 shadow-sm border border-white transition-all mb-8">
                    <ArrowLeft size={16}/> ダッシュボードへ戻る
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner border border-white">
                        <PenTool size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                            <JpText>{project.title}</JpText>
                        </h1>
                        <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                            <User size={12}/> 企画者: {project.planner?.handleName || '不明'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    
                    {/* 左カラム：チャット ＆ アクション */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* アクションエリア（納品・ステータス） */}
                        <AppCard className="!p-0 overflow-hidden border-2 border-white shadow-xl">
                            <div className="p-6 md:p-8 bg-slate-900 text-white">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest mb-2">納品状況</p>
                                        <div className="flex items-center gap-3">
                                            {project.isIllustrationAccepted ? (
                                                <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><CheckCircle2 size={16}/> 検収完了 (報酬確定)</span>
                                            ) : project.illustrationDataUrl ? (
                                                <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><Clock size={16}/> 企画者の確認待ち</span>
                                            ) : (
                                                <span className="bg-slate-700 text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><Brush size={16}/> 制作中</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">決定した報酬額</p>
                                        <p className="text-2xl font-black text-amber-400 font-mono tracking-tighter">
                                            {project.illustratorReward?.toLocaleString() || 0} <span className="text-xs text-slate-400">pt</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-white">
                                {!project.isIllustrationAccepted && (
                                    <div className="text-center">
                                        {project.illustrationDataUrl ? (
                                            <>
                                                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                                                    <Send size={24}/>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800 mb-2">イラストを提出しました</h3>
                                                <p className="text-sm font-bold text-slate-500 mb-6">企画者が確認し、問題なければ報酬が支払われます。<br/>修正依頼がある場合はチャットで連絡が来ます。</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <Brush size={24}/>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800 mb-2">イラストを納品しましょう</h3>
                                                <p className="text-sm font-bold text-slate-500 mb-6">完成したイラストのデータをアップロードして、企画者に提出してください。</p>
                                            </>
                                        )}
                                        
                                        <label className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-xl shadow-lg hover:shadow-orange-500/30 cursor-pointer transition-all active:scale-95 w-full sm:w-auto">
                                            {isUploading ? <Loader2 className="animate-spin" size={18}/> : <UploadCloud size={18}/>}
                                            {project.illustrationDataUrl ? 'データを再提出 (上書き) する' : '完成データをアップロード'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleUploadDelivery} disabled={isUploading} />
                                        </label>
                                    </div>
                                )}

                                {project.isIllustrationAccepted && (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                            <CheckCircle2 size={32}/>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-2">お疲れ様でした！🎉</h3>
                                        <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                            イラストの検収が完了し、報酬の {project.illustratorReward?.toLocaleString()} pt が売上残高に反映されました。<br/>
                                            引き続き、マイページから新しいオファーや公募を探してみましょう！
                                        </p>
                                    </div>
                                )}
                            </div>
                        </AppCard>

                        {/* チャット */}
                        <AppCard className="!p-0 flex flex-col h-[600px] border-2 border-white shadow-xl overflow-hidden ring-4 ring-amber-50">
                            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="text-amber-500" size={18}/>
                                    <h2 className="text-sm font-black text-slate-800">企画チャット</h2>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden relative bg-white">
                                {/* 企画者側のチャットコンポーネントを流用 */}
                                <GroupChat 
                                    project={project} 
                                    user={user} 
                                    isPlanner={false} 
                                    isPledger={false} 
                                    socket={socket} 
                                />
                            </div>
                        </AppCard>
                    </div>

                    {/* 右カラム：企画の詳細 */}
                    <div className="lg:col-span-4 space-y-6">
                        <AppCard className="space-y-6">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <FileText className="text-amber-500" size={20}/> 依頼内容
                            </h3>
                            
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">フラスタの希望納期</p>
                                <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
                                    <Calendar size={14} className="text-slate-400"/>
                                    {new Date(project.deliveryDateTime).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">※イラストの納期はチャットで企画者と相談してください。</p>
                            </div>

                            {project.designDetails && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">デザインの希望・詳細</p>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap"><JpText>{project.designDetails}</JpText></p>
                                    </div>
                                </div>
                            )}

                            {project.illustrationDataUrl && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">提出済みのイラスト</p>
                                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 cursor-zoom-in hover:border-amber-200 transition-colors" onClick={() => { setModalImageSrc(project.illustrationDataUrl); setIsImageModalOpen(true); }}>
                                        <Image src={project.illustrationDataUrl} alt="納品イラスト" fill className="object-contain" />
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <ImageIcon className="text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-md" size={32}/>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AppCard>
                    </div>
                </div>
            </div>

            {/* --- モーダル --- */}
            <AnimatePresence>
                {isImageModalOpen && <ImageLightbox url={modalImageSrc} onClose={() => setIsImageModalOpen(false)} />}
            </AnimatePresence>
        </div>
    );
}