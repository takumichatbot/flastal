// components/admin/AdminIndividualChat.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { FiLoader, FiSend, FiUser, FiMessageSquare, FiAlertTriangle } from 'react-icons/fi';
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

export default function AdminIndividualChat({ selectedUser, chatRoom, adminUserId }) {
    const [messages, setMessages] = useState([]);
    const [inputContent, setInputContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const chatBottomRef = useRef(null);
    
    // 1. Socket.IO 接続と切断の処理
    useEffect(() => {
        if (!chatRoom) return;

        const token = getAuthToken();
        if (!token) return;

        // 既存の接続があれば切断
        if (socket) {
            socket.off('receiveAdminMessage');
            socket.disconnect();
            socket = null;
        }

        // 新しい接続の作成
        socket = io(API_URL, {
            auth: {
                token: `Bearer ${token}` // トークンを認証ヘッダーとして渡す
            },
            transports: ['websocket', 'polling'] // WebSocketを優先
        });

        socket.on('connect', () => {
            setSocketConnected(true);
            console.log(`[AdminChat] Socket Connected: ${socket.id}`);
            // チャットルームに参加
            socket.emit('joinRoom', chatRoom.id);
        });

        socket.on('disconnect', () => {
            setSocketConnected(false);
            console.log('[AdminChat] Socket Disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('[AdminChat] Connection Error:', err.message);
            toast.error('チャット接続エラーが発生しました。');
            setSocketConnected(false);
        });
        
        // 2. メッセージ受信リスナー
        socket.on('receiveAdminMessage', (newMessage) => {
            setMessages(prevMessages => {
                // 仮メッセージとの重複を防ぎ、最新メッセージを追加
                const isDuplicated = prevMessages.some(msg => 
                    msg.content === newMessage.content && 
                    msg.senderId === newMessage.senderId && 
                    (new Date(msg.createdAt).getTime() === new Date(newMessage.createdAt).getTime())
                );
                if (!isDuplicated) {
                    return [...prevMessages.filter(msg => typeof msg.id !== 'string' || !msg.id.startsWith('temp_')), newMessage];
                }
                return prevMessages;
            });
        });

        return () => {
            socket.off('receiveAdminMessage');
            socket.disconnect();
            socket = null;
            setSocketConnected(false);
        };
    }, [chatRoom]);

    // 3. 履歴のロード処理
    useEffect(() => {
        if (chatRoom?.id) {
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
            // API: /api/admin/chat-rooms/:roomId/messages を呼び出し
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
        if (!inputContent.trim() || !socketConnected || !chatRoom) return;

        const content = inputContent.trim();
        const tempId = `temp_${Date.now()}`;
        
        // オプティミスティックUI用の仮メッセージ
        const tempMessage = {
            id: tempId, 
            chatRoomId: chatRoom.id,
            senderId: adminUserId, 
            senderRole: 'ADMIN',
            content: content,
            isRead: false,
            createdAt: new Date().toISOString(),
            isTemp: true, // 仮メッセージであることを示すフラグ
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
                {!socketConnected && (
                     <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg flex items-center gap-2">
                        <FiAlertTriangle/> リアルタイム接続が切断されています。
                     </div>
                )}
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
                                {/* アイコン表示 (相手ユーザーまたはBot) */}
                                {!isOwn && (
                                    <div className={`w-8 h-8 rounded-full ${isBot ? 'bg-blue-500' : getRoleColor(selectedUser.role)} flex items-center justify-center text-white text-xs font-bold`} title={isBot ? 'AI Bot' : senderName}>
                                        {isBot ? 'AI' : (selectedUser.iconUrl ? <img src={selectedUser.iconUrl} alt={selectedUser.handleName} className="w-full h-full rounded-full object-cover" /> : selectedUser.handleName?.[0] || selectedUser.role?.[0])}
                                    </div>
                                )}
                                
                                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-gray-500 mb-1">
                                        {senderName} ({new Date(msg.createdAt).toLocaleTimeString()})
                                        {msg.isTemp && <span className="text-red-500 ml-1">(送信中...)</span>}
                                    </span>
                                    <div className={`px-4 py-2 rounded-xl text-sm shadow-md ${
                                        isOwn ? 'bg-red-500 text-white rounded-br-none' : 
                                        isBot ? 'bg-indigo-100 text-indigo-800 rounded-tl-none border border-indigo-300' :
                                        'bg-white text-gray-800 rounded-tl-none border border-gray-300'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                                {/* アイコン表示 (管理者本人) */}
                                {isOwn && (
                                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold" title="管理者">
                                        管
                                    </div>
                                )}
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder="管理者としてメッセージを入力..."
                        rows="1"
                        disabled={!socketConnected || !chatRoom}
                        className="flex-grow p-3 border rounded-lg bg-gray-50 resize-none focus:ring-2 focus:ring-sky-500"
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        type="submit"
                        disabled={!inputContent.trim() || !socketConnected || !chatRoom}
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