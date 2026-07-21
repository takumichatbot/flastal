// src/app/florists/projects/[id]/chat/page.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MessageSquare, Loader2, Info, Send, Image as ImageIcon, User } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = window.__flastalToken;
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function FloristPrivateChatPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params; 
    const { user, authenticatedFetch, loading: authLoading } = useAuth();
    
    const [project, setProject] = useState(null);
    const [chatRoom, setChatRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    
    const [freeText, setFreeText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef(null);
    const chatBottomRef = useRef(null);

    // 1. プロジェクト情報とチャットルーム情報を取得
    const fetchProjectDetails = useCallback(async () => {
        if (!id || !user) return;
        try {
            setLoading(true);
            const res = await authenticatedFetch(`${API_URL}/api/projects/${id}`);
            if (!res.ok) throw new Error('企画情報の取得に失敗しました');
            const data = await res.json();
            setProject(data);

            // この花屋さんに紐づくオファーを探す
            const myOffer = data.offers?.find(o => o.floristId === user.id);
            if (!myOffer || !myOffer.chatRoom) {
                toast.error('有効なチャットルームが見つかりません');
                router.push(`/florists/projects/${id}`);
                return;
            }

            setChatRoom(myOffer.chatRoom);
            // バックエンドから messages が返ってきている場合はセット
            if (myOffer.chatRoom.messages) {
                setMessages(myOffer.chatRoom.messages);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id, user, authenticatedFetch, router]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'FLORIST') {
                router.push('/florists/login');
                return;
            }
            fetchProjectDetails();
        }
    }, [authLoading, user, fetchProjectDetails, router]);

    // 2. Socket.io の接続（1対1ルームに接続）
    useEffect(() => {
        if (!user || !chatRoom) return;
        const token = getAuthToken();
        if (!token) return;
        
        const newSocket = io(API_URL, { transports: ['polling'], auth: { token: `Bearer ${token}` } });
        setSocket(newSocket);
        
        // 1対1のルームに参加
        newSocket.emit('joinRoom', chatRoom.id);
        
        // メッセージ受信
        newSocket.on('receiveMessage', (msg) => {
            setMessages(prev => [...prev, msg]);
        });
        
        newSocket.on('messageError', (msg) => toast.error(msg));
        
        return () => newSocket.disconnect();
    }, [chatRoom, user]);

    // 3. オートスクロール
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 4. 送信処理
    const handleSendMessage = (content, messageType = 'TEXT', fileUrl = null, fileName = null) => {
        if (!socket || !user || !chatRoom) return toast.error('接続エラー');
        socket.emit('sendMessage', {
            roomId: chatRoom.id,
            content,
            messageType,
            fileUrl,
            fileName
        });
    };

    const handleFreeTextSubmit = (e) => {
        e?.preventDefault();
        if (freeText.trim()) {
            handleSendMessage(freeText);
            setFreeText('');
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const toastId = toast.loading('画像を送信中...');
        
        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData 
            });
            if (!res.ok) throw new Error('アップロード失敗');
            const data = await res.json();
            
            const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
            handleSendMessage(null, messageType, data.url, file.name);
            toast.success('送信しました', { id: toastId });
        } catch (error) {
            toast.error(`送信失敗: ${error.message}`, { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500" size={40}/></div>;
    }

    if (!project || !chatRoom) return null;

    return (
        <div className="min-h-screen bg-[#fdfcff] pb-24 font-sans text-slate-800 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-pink-100/50 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-sky-100/50 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/florists/projects/${id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full text-sm font-black text-slate-500 hover:text-sky-600 shadow-sm border border-slate-200 transition-all">
                        <ArrowLeft size={16}/> 案件詳細（管理画面）へ戻る
                    </Link>
                </div>
                
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-lg border border-white overflow-hidden flex flex-col h-[700px]">
                    
                    {/* ヘッダー */}
                    <div className="p-5 md:p-6 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-sky-200 shrink-0">
                                <MessageSquare size={24}/>
                            </div>
                            <div>
                                <h1 className="font-black text-slate-800 text-lg md:text-xl tracking-tight mb-0.5">企画者との専用チャット</h1>
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 line-clamp-1">
                                    <span className="bg-sky-200 text-sky-700 px-2 py-0.5 rounded shadow-sm uppercase tracking-widest shrink-0">1 on 1</span>
                                    {project.title}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* チャットエリア */}
                    <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-slate-50/50 space-y-6 scrollbar-thin scrollbar-thumb-slate-300">
                        <div className="flex items-start gap-3 text-xs text-sky-700 font-bold mb-6 bg-sky-50 p-4 rounded-2xl border border-sky-100 shadow-sm mx-auto max-w-lg">
                            <Info size={18} className="shrink-0 mt-0.5 text-sky-500" />
                            <p className="leading-relaxed">
                                このチャットは企画者とあなた（お花屋さん）だけが見られる機密チャットです。支援者には公開されません。
                            </p>
                        </div>

                        {messages.length > 0 ? (
                            messages.map(msg => {
                                const isOwn = msg.floristId === user.id;
                                const senderName = isOwn ? (msg.florist?.platformName || 'あなた') : (msg.user?.handleName || '企画者');
                                const iconUrl = isOwn ? msg.florist?.iconUrl : msg.user?.iconUrl;

                                return (
                                    <div key={msg.id} className={`flex items-end gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        <div className="flex-shrink-0 mb-1">
                                            {iconUrl ? (
                                                <img src={iconUrl} alt={senderName} className="h-9 w-9 rounded-full object-cover shadow-sm border border-slate-100" loading="lazy" />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-500 flex items-center justify-center font-bold shadow-sm">
                                                    <User size={16}/>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                            {!isOwn && (
                                                <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                                                    <span className="text-xs text-slate-700 font-bold">{senderName}</span>
                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded shadow-sm font-bold tracking-wider">企画者</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            )}

                                            <div className="relative">
                                                <div className={`px-4 py-2.5 rounded-2xl relative text-sm leading-relaxed whitespace-pre-wrap break-words font-medium ${isOwn ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white rounded-br-sm shadow-md shadow-sky-200/50' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm'}`}>
                                                    {msg.messageType === 'IMAGE' ? (
                                                        <img src={msg.fileUrl} alt="画像" className="max-w-full h-auto rounded-xl my-1 cursor-zoom-in hover:opacity-90 transition-opacity border border-black/5" onClick={()=>{ const win = window.open(msg.fileUrl,'_blank','noopener,noreferrer'); if(win) win.opener=null; }} loading="lazy" />
                                                    ) : msg.messageType === 'FILE' ? (
                                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 font-bold hover:underline p-2 rounded-xl ${isOwn ? 'bg-black/10' : 'bg-slate-50 text-sky-600'}`}>📎 {msg.fileName}</a>
                                                    ) : (
                                                        <p>{msg.content}</p>
                                                    )}
                                                </div>

                                                {isOwn && (
                                                    <span className="absolute bottom-1 right-full mr-2 text-[10px] text-slate-400 font-medium whitespace-nowrap">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 pt-10">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><MessageSquare size={24} className="text-slate-300"/></div>
                                <p className="text-sm font-bold text-center leading-relaxed">
                                    まだメッセージはありません。<br/>挨拶をしてデザインの打ち合わせを始めましょう！🌸
                                </p>
                            </div>
                        )}
                        <div ref={chatBottomRef} />
                    </div>

                    {/* 入力エリア */}
                    <div className="p-3 md:p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 z-10">
                        <div className="flex items-end gap-2 bg-slate-100 p-1.5 rounded-3xl border border-slate-200 focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-50 transition-all">
                            <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} className="p-3 bg-white text-slate-500 hover:text-sky-500 rounded-full shadow-sm hover:shadow transition-all flex-shrink-0 disabled:opacity-50"><ImageIcon size={20} /></button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                            
                            <div className="flex-grow pl-2">
                            <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFreeTextSubmit(e); } }} placeholder={isUploading ? "送信中..." : "企画者にメッセージを送信..."} disabled={isUploading} rows="1" className="w-full bg-transparent border-0 px-2 py-3.5 focus:ring-0 outline-none resize-none text-[16px] font-medium max-h-32 disabled:opacity-50 placeholder:text-slate-400 placeholder:font-bold" style={{ minHeight: '48px' }} />
                            </div>

                            <button onClick={handleFreeTextSubmit} disabled={isUploading || !freeText.trim()} aria-label="送信" className={`p-3.5 rounded-full text-white shadow-md transition-all flex-shrink-0 flex items-center justify-center ${(!freeText.trim() || isUploading) ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:scale-105 active:scale-95'}`}><Send size={18} className="ml-0.5" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}