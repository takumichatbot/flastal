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

    const fetchProjectDetails = useCallback(async () => {
        if (!id || !user) return;
        try {
            setLoading(true);
            const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`);
            if (!res.ok) throw new Error('企画情報の取得に失敗しました');
            const data = await res.json();
            setProject(data);
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
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-sky-500" size={40}/></div>;
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 md:pt-12">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/florists/projects/${id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-sm font-black text-slate-500 hover:text-sky-600 shadow-sm border border-slate-200 transition-all">
                        <ArrowLeft size={16}/> 案件詳細（管理画面）へ戻る
                    </Link>
                </div>
                
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 md:p-8 bg-sky-50 border-b border-sky-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
                            <MessageSquare size={24}/>
                        </div>
                        <div>
                            <h1 className="font-black text-slate-800 text-lg md:text-xl tracking-tight">専用グループチャット</h1>
                            <p className="text-xs font-bold text-slate-500 mt-1">企画名: {project.title}</p>
                        </div>
                    </div>
                    
                    <div className="p-4 md:p-6 bg-white">
                        <div className="flex items-start gap-2 text-xs text-sky-700 font-bold mb-6 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                                このチャットは企画者と支援者（参加者）が見ています。<br/>
                                デザインのすり合わせや、進捗状況（完成した写真など）を共有して企画を盛り上げましょう！
                            </p>
                        </div>

                        {/* ここに既存のGroupChatを埋め込み */}
                        <div className="border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <GroupChat 
                                project={project} 
                                user={user} 
                                isFlorist={true}  /* ★ 花屋権限を渡す */
                                socket={socket} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}