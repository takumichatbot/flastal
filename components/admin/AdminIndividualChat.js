// components/admin/AdminIndividualChat.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { FiLoader, FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client'; // Socket.IO クライアントをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// トークン取得ヘルパー
const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// ロールに応じた色を取得
const getRoleColor = (role) => {
    switch (role) {
        case 'ADMIN': return 'bg-red-500';
        case 'FLORIST': return 'bg-pink-500';
        case 'VENUE': return 'bg-purple-500';
        case 'ORGANIZER': return 'bg-yellow-500';
        default: return 'bg-sky-500'; // USER (ファン/企画者)
    }
};

let socket; // Socket.IO クライアントインスタンス

export default function AdminIndividualChat({ selectedUser, chatRoom }) {
    const [messages, setMessages] = useState([]);
    const [inputContent, setInputContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBottomRef = useRef(null);
    const adminUserId = chatRoom?.adminId; // 管理者ID（サーバー側で設定したID）
    const targetUserId = selectedUser?.id;

    // 1. Socket.IO 接続と切断の処理
    useEffect(() => {
        if (!chatRoom) return;

        const token = getAuthToken();
        if (!token) return;

        // 既存の接続があれば切断
        if (socket) {
            socket.disconnect();
        }

        // 新しい接続の作成
        socket = io(API_URL, {
            auth: {
                token: `Bearer ${token}` // トークンを認証ヘッダーとして渡す
            },
            // Next.jsのCORS対応設定 (index.jsの設定と一致させる)
            transports: ['polling']
        });

        socket.on('connect', () => {
            console.log(`[AdminChat] Socket Connected: ${socket.id}`);
            // チャットルームに参加
            socket.emit('joinRoom', chatRoom.id);
        });

        socket.on('disconnect', () => {
            console.log('[AdminChat] Socket Disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('[AdminChat] Connection Error:', err.message);
            toast.error('チャット接続エラーが発生しました。');
        });
        
        // 2. メッセージ受信リスナー
        socket.on('receiveAdminMessage', (newMessage) => {
            console.log('Received:', newMessage);
            setMessages(prevMessages => {
                // 重複防止チェック (オプティミスティックUIを考慮)
                const isDuplicated = prevMessages.some(msg => 
                    msg.id === newMessage.id || 
                    (msg.senderId === newMessage.senderId && msg.content === newMessage.content && (new Date() - new Date(msg.createdAt)) < 1000)
                );
                if (!isDuplicated) {
                    return [...prevMessages, newMessage];
                }
                return prevMessages;
            });
        });

        return () => {
            socket.off('receiveAdminMessage');
            socket.disconnect();
            socket = null;
        };
    }, [chatRoom]);

    // 3. 履歴のロード処理
    useEffect(() => {
        if (chatRoom) {
            fetchMessages();
        } else {
            setMessages([]);
        }
    }, [chatRoom]);

    const fetchMessages = async () => {
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/chat-rooms/${chatRoom.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || '履歴の取得に失敗しました。');
            }
        } catch (error) {
            toast.error('チャット履歴のロード中にエラーが発生しました。');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // 4. オートスクロール
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);


    // 5. メッセージ送信処理
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputContent.trim() || !socket || !chatRoom) return;

        const content = inputContent.trim();
        const tempMessage = {
            // オプティミスティックUI用の仮ID
            id: Date.now().toString(), 
            chatRoomId: chatRoom.id,
            senderId: adminUserId, // ADMINとして送信
            senderRole: 'ADMIN',
            content: content,
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        // オプティミスティックにUIを更新
        setMessages(prevMessages => [...prevMessages, tempMessage]);
        
        // Socket.IO でサーバーに送信
        socket.emit('sendAdminMessage', {
            roomId: chatRoom.id,
            content: content,
        });

        setInputContent('');
    };

    if (!selectedUser) {
        return (
            <div className="flex-grow flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <FiUser size={48} className="mx-auto mb-3" />
                    <p>左側のリストからチャット相手を選択してください。</p>
                </div>
            </div>
        );
    }

    // 相手が Florist の場合、Botキーを持っている可能性があることを示す
    const isFloristChat = selectedUser.role === 'FLORIST';
    
    return (
        <div className="flex-grow flex flex-col h-full bg-white">
            {/* ヘッダー */}
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getRoleColor(selectedUser.role)} flex-shrink-0`} title={selectedUser.role}></span>
                    <h3 className="text-lg font-bold text-gray-800">{selectedUser.handleName}</h3>
                    <span className="text-sm text-gray-500">({selectedUser.email})</span>
                    {isFloristChat && (
                        <span className="text-xs text-pink-500 bg-pink-100 px-2 py-0.5 rounded-full ml-auto">
                            LARUbot連携の可能性あり
                        </span>
                    )}
                </div>
            </div>

            {/* メッセージエリア */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-100">
                {isLoading ? (
                    <div className="text-center p-10 text-gray-500 flex items-center justify-center">
                        <FiLoader className="animate-spin mr-2" /> 履歴をロード中...
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.senderId === adminUserId && msg.senderRole === 'ADMIN';
                        const isBot = msg.isAutoResponse;
                        const senderName = isOwn ? '管理者' : selectedUser.handleName;

                        return (
                            <div key={msg.id} className={`flex items-end gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                {!isOwn && !isBot && (
                                    <div className={`w-8 h-8 rounded-full ${getRoleColor(selectedUser.role)} flex items-center justify-center text-white text-xs font-bold`}>
                                        {selectedUser.handleName?.[0]}
                                    </div>
                                )}
                                {isBot && (
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold" title="AI Bot">
                                        AI
                                    </div>
                                )}
                                
                                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-gray-500 mb-1">{senderName} ({new Date(msg.createdAt).toLocaleTimeString()})</span>
                                    <div className={`px-4 py-2 rounded-xl text-sm shadow-md ${
                                        isOwn ? 'bg-red-500 text-white rounded-br-none' : 
                                        isBot ? 'bg-indigo-100 text-indigo-800 rounded-tl-none border border-indigo-300' :
                                        'bg-white text-gray-800 rounded-tl-none border border-gray-300'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatBottomRef} />
            </div>

            {/* 入力エリア */}
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <textarea
                        value={inputContent}
                        onChange={(e) => setInputContent(e.target.value)}
                        placeholder="メッセージを入力..."
                        rows="1"
                        disabled={!socket || !chatRoom}
                        className="flex-grow p-3 border rounded-lg bg-gray-50 resize-none focus:ring-2 focus:ring-sky-500"
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        type="submit"
                        disabled={!inputContent.trim() || !socket || !chatRoom}
                        className="w-12 h-12 flex items-center justify-center bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors disabled:bg-gray-400"
                        title="送信"
                    >
                        <FiSend size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}