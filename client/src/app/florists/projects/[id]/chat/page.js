// src/app/florists/projects/[id]/chat/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Loader2, Info } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

import GroupChat from '@/app/projects/[id]/components/GroupChat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function FloristChatPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; 
    const { user, authenticatedFetch, loading: authLoading } = useAuth();
    
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [summary, setSummary] = useState(null); // ★追加: AI要約用ステート

    const fetchProjectDetails = useCallback(async () => {
        if (!id || !user) return;
        try {
            setLoading(true);
            const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`);
            if (!res.ok) throw new Error('企画情報の取得に失敗しました');
            const data = await res.json();
            setProject(data);
            if (data?.summary) setSummary(data.summary);
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

    useEffect(() => {
        if (!user || !id) return;
        const token = getAuthToken();
        if (!token) return;
        
        const newSocket = io(API_URL, { transports: ['polling'], auth: { token: `Bearer ${token}` } });
        setSocket(newSocket);
        
        newSocket.emit('joinProjectRoom', id);
        
        newSocket.on('receiveGroupChatMessage', (msg) => {
            setProject(prev => prev ? { ...prev, groupChatMessages: [...(prev.groupChatMessages || []), msg] } : null);
        });
        
        newSocket.on('messageError', (msg) => toast.error(msg));
        
        return () => newSocket.disconnect();
    }, [id, user]);

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500" size={40}/></div>;
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-[#fdfcff] pb-24 font-sans text-slate-800 relative overflow-hidden">
            {/* 背景装飾 */}
            <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-pink-100/50 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-sky-100/50 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/florists/projects/${id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full text-sm font-black text-slate-500 hover:text-sky-600 shadow-sm border border-slate-200 transition-all">
                        <ArrowLeft size={16}/> 案件詳細（管理画面）へ戻る
                    </Link>
                </div>
                
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-lg border border-white overflow-hidden">
                    <div className="p-6 md:p-8 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100/50 flex items-center gap-5">
                        <div className="w-14 h-14 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-sky-200 shrink-0">
                            <MessageSquare size={26}/>
                        </div>
                        <div>
                            <h1 className="font-black text-slate-800 text-xl md:text-2xl tracking-tight mb-1">専用グループチャット</h1>
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 line-clamp-1">
                                <span className="bg-sky-200 text-sky-700 px-2 py-0.5 rounded shadow-sm text-[10px] uppercase tracking-widest shrink-0">Target</span>
                                {/* ★ 修正: クラッシュ防止のオプショナルチェーン */}
                                {project?.title || '企画タイトル未設定'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="p-4 md:p-8 bg-white/50">
                        <div className="flex items-start gap-3 text-xs text-sky-700 font-bold mb-8 bg-sky-50 p-5 rounded-2xl border border-sky-100 shadow-sm">
                            <Info size={18} className="shrink-0 mt-0.5 text-sky-500" />
                            <p className="leading-relaxed">
                                このチャットは企画者と支援者（参加者）が見ています。<br/>
                                デザインのすり合わせや、進捗状況（完成した写真など）を共有して企画を盛り上げましょう！
                            </p>
                        </div>

                        {/* ここに既存のGroupChatを埋め込み */}
                        <div className="rounded-[2rem] overflow-hidden shadow-sm border border-slate-200 bg-white">
                            <GroupChat 
                                project={project} 
                                user={user} 
                                isFlorist={true}  /* ★ 花屋権限を渡す */
                                socket={socket}
                                summary={summary}
                                onSummaryUpdate={(newSummary) => setSummary(newSummary)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}