// components/admin/AdminIndividualChat.js
'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  FiLoader, FiSend, FiUser, FiMessageSquare, FiAlertTriangle, 
  FiCheck, FiCheckCircle, FiInfo, FiImage, FiMoreVertical 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// --- ヘルパー関数 ---

// 日付フォーマット (例: 12:30)
const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

// 日付ヘッダー用フォーマット (例: 2024/12/23 (月))
const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
};

// 日付が変わったか判定
const isNewDay = (current, prev) => {
    if (!prev) return true;
    const currentDate = new Date(current).toDateString();
    const prevDate = new Date(prev).toDateString();
    return currentDate !== prevDate;
};

// ロールごとの色定義
const getRoleBadge = (role) => {
    const configs = {
        ADMIN: { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' },
        FLORIST: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Florist' },
        VENUE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Venue' },
        ORGANIZER: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Organizer' },
        USER: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'User' },
    };
    return configs[role] || configs.USER;
};

export default function AdminIndividualChat({ selectedUser, chatRoom, adminUserId }) {
    const [messages, setMessages] = useState([]);
    const [inputContent, setInputContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // connected, disconnected, error
    
    const socketRef = useRef(null);
    const chatBottomRef = useRef(null);
    const textareaRef = useRef(null);

    // テキストエリアの高さ自動調整
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // 最大120px
        }
    };

    // 1. Socket.IO 接続管理
    useEffect(() => {
        if (!chatRoom) return;

        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        if (!token) return;

        // 切断処理
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // 接続開始
        const socket = io(API_URL, {
            auth: { token: `Bearer ${token}` },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnectionStatus('connected');
            console.log(`[AdminChat] Connected: ${socket.id}`);
            socket.emit('joinRoom', chatRoom.id);
        });

        socket.on('disconnect', () => {
            setConnectionStatus('disconnected');
        });

        socket.on('connect_error', () => {
            setConnectionStatus('error');
        });

        // メッセージ受信
        socket.on('receiveAdminMessage', (newMessage) => {
            setMessages(prev => {
                // 重複排除ロジック
                if (prev.some(m => m.id === newMessage.id || (m.isTemp && m.content === newMessage.content))) {
                    // tempメッセージを正規メッセージに置換する処理があればここに記述
                    return prev.map(m => (m.isTemp && m.content === newMessage.content) ? newMessage : m);
                }
                return [...prev, newMessage];
            });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [chatRoom]);

    // 2. 履歴取得
    useEffect(() => {
        if (chatRoom?.id) {
            fetchMessages();
        } else {
            setMessages([]);
        }
    }, [chatRoom]);

    const fetchMessages = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/chat-rooms/${chatRoom.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            } else {
                toast.error('履歴の取得に失敗しました');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. オートスクロール (メッセージ更新時)
    useLayoutEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, chatRoom]);

    // 4. 送信処理
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputContent.trim() || connectionStatus !== 'connected' || !chatRoom) return;

        const content = inputContent.trim();
        const tempId = `temp_${Date.now()}`;
        
        const tempMessage = {
            id: tempId,
            chatRoomId: chatRoom.id,
            senderId: adminUserId,
            senderRole: 'ADMIN',
            content: content,
            createdAt: new Date().toISOString(),
            isTemp: true,
        };

        setMessages(prev => [...prev, tempMessage]);
        
        socketRef.current.emit('sendAdminMessage', {
            roomId: chatRoom.id,
            content: content,
        });

        setInputContent('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    // ユーザー未選択時
    if (!selectedUser) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 h-full text-gray-400">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <FiMessageSquare size={40} className="text-gray-300" />
                </div>
                <p className="font-bold text-lg text-gray-600">チャットを選択してください</p>
                <p className="text-sm">左側のリストからユーザーをクリックして会話を開始します。</p>
            </div>
        );
    }

    const badge = getRoleBadge(selectedUser.role);

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            
            {/* --- ヘッダーエリア --- */}
            <div className="px-6 py-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner
                            ${selectedUser.role === 'FLORIST' ? 'bg-pink-500' : 'bg-gray-400'}`}>
                            {selectedUser.iconUrl ? 
                                <img src={selectedUser.iconUrl} alt="" className="w-full h-full rounded-full object-cover"/> : 
                                <FiUser />
                            }
                        </div>
                        {/* オンラインステータスバッジ (擬似的) */}
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-800">{selectedUser.handleName || 'No Name'}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                                {badge.label}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                </div>

                {/* 接続ステータス表示 */}
                <div className="flex items-center gap-2">
                    {connectionStatus === 'connected' ? (
                        <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                            接続中
                        </span>
                    ) : (
                        <span className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                            <FiAlertTriangle className="mr-1" /> 切断
                        </span>
                    )}
                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <FiMoreVertical />
                    </button>
                </div>
            </div>

            {/* --- メッセージエリア --- */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-[#F3F4F6] scroll-smooth">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <FiLoader className="animate-spin text-3xl" />
                        <span className="text-sm">メッセージを読み込み中...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <FiMessageSquare size={48} className="mb-2" />
                        <p>メッセージ履歴はありません</p>
                        <p className="text-xs">最初のメッセージを送信しましょう</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg, index) => {
                            const isOwn = msg.senderId === adminUserId && msg.senderRole === 'ADMIN';
                            const isBot = msg.isAutoResponse;
                            
                            // 日付区切り線の判定
                            const showDateSeparator = isNewDay(msg.createdAt, messages[index - 1]?.createdAt);

                            return (
                                <div key={msg.id || index}>
                                    {/* 日付セパレーター */}
                                    {showDateSeparator && (
                                        <div className="flex justify-center my-6">
                                            <span className="bg-gray-200 text-gray-600 text-[10px] px-3 py-1 rounded-full font-medium">
                                                {formatDateHeader(msg.createdAt)}
                                            </span>
                                        </div>
                                    )}

                                    {/* メッセージ本体 */}
                                    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                        
                                        {/* アバター (相手のみ) */}
                                        {!isOwn && (
                                            <div className="flex-shrink-0 mt-auto">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs overflow-hidden shadow-sm ${isBot ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                                                    {isBot ? 'AI' : (selectedUser.iconUrl ? <img src={selectedUser.iconUrl} alt="" className="w-full h-full object-cover"/> : <FiUser />)}
                                                </div>
                                            </div>
                                        )}

                                        <div className={`flex flex-col max-w-[70%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                            
                                            {/* 名前 (Botの場合のみ表示など調整可) */}
                                            {!isOwn && isBot && <span className="text-[10px] text-gray-500 mb-1 ml-1">自動応答</span>}

                                            {/* 吹き出し */}
                                            <div className={`
                                                px-4 py-2.5 shadow-sm text-sm whitespace-pre-wrap break-words leading-relaxed
                                                ${isOwn 
                                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl rounded-tr-none' 
                                                    : isBot 
                                                        ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl rounded-tl-none'
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'
                                                }
                                            `}>
                                                {msg.content}
                                            </div>

                                            {/* メタ情報 (時間・ステータス) */}
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 px-1">
                                                {formatTime(msg.createdAt)}
                                                {isOwn && (
                                                    <span>
                                                        {msg.isTemp ? ' 送信中...' : (msg.isRead ? ' • 既読' : ' • 未読')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={chatBottomRef} />
            </div>

            {/* --- 入力エリア --- */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form 
                    onSubmit={handleSendMessage} 
                    className={`flex items-end gap-2 p-2 rounded-2xl border transition-all ${connectionStatus === 'connected' ? 'border-gray-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100' : 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed'}`}
                >
                    <button type="button" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <FiImage size={20} />
                    </button>
                    
                    <textarea
                        ref={textareaRef}
                        value={inputContent}
                        onChange={(e) => {
                            setInputContent(e.target.value);
                            adjustTextareaHeight();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder={connectionStatus === 'connected' ? "メッセージを入力..." : "接続待機中..."}
                        rows={1}
                        disabled={connectionStatus !== 'connected'}
                        className="flex-grow bg-transparent border-none focus:ring-0 resize-none py-2.5 px-2 max-h-[120px] text-sm text-gray-800 placeholder-gray-400"
                    />
                    
                    <button
                        type="submit"
                        disabled={!inputContent.trim() || connectionStatus !== 'connected'}
                        className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                            inputContent.trim() && connectionStatus === 'connected'
                                ? 'bg-sky-500 text-white shadow-md hover:bg-sky-600 transform active:scale-95' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <FiSend size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}