"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; // 提示されたAuthContextをインポート
import { FiSend, FiImage, FiArrowLeft, FiMoreVertical, FiPaperclip } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ChatRoomPage() {
  const { id: roomId } = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState(null); // チャット相手の情報
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('ログインが必要です');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // チャットデータの取得
  useEffect(() => {
    if (!token || !roomId) return;

    const fetchChatData = async () => {
      try {
        // 注: バックエンドの実装に合わせてエンドポイントを調整してください
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('チャット情報の取得に失敗しました');

        const data = await res.json();
        setMessages(data.messages || []);
        setRecipient(data.recipient || { name: '相手ユーザー', iconUrl: null }); // デフォルト値
      } catch (error) {
        console.error(error);
        toast.error('メッセージの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();

    // リアルタイム更新（ポーリング例）※Socket.ioがあればそちらに置き換え推奨
    const interval = setInterval(fetchChatData, 10000); // 10秒ごとに更新
    return () => clearInterval(interval);

  }, [roomId, token]);

  // 最新メッセージまでスクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // テキストエリアの高さ自動調整
  const handleInputResize = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`; // 最大120pxまで拡張
    setNewMessage(target.value);
  };

  // メッセージ送信
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${roomId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (!res.ok) throw new Error('送信エラー');

      const savedMessage = await res.json();
      
      // UIを即時更新
      setMessages(prev => [...prev, savedMessage]);
      setNewMessage('');
      if(textareaRef.current) textareaRef.current.style.height = 'auto'; // 高さリセット
      scrollToBottom();

    } catch (error) {
      toast.error('メッセージを送信できませんでした');
    } finally {
      setIsSending(false);
    }
  };

  // Enterキーで送信（Shift+Enterで改行）
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ロード中表示
  if (authLoading || (isLoading && !recipient)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100 md:bg-slate-50 max-w-4xl mx-auto md:my-4 md:rounded-2xl md:shadow-xl md:border md:border-slate-200 overflow-hidden">
      
      {/* --- ヘッダー --- */}
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            {/* 相手のアイコン */}
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
              {recipient?.iconUrl ? (
                <img src={recipient.iconUrl} alt={recipient.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg">👤</div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                {recipient?.name || 'Unknown User'}
              </h2>
              <p className="text-xs text-slate-500">
                {recipient?.isOnline ? '● オンライン' : 'オフライン'}
              </p>
            </div>
          </div>
        </div>
        
        {/* メニュー（通報やブロックなど用） */}
        <button className="text-slate-400 hover:text-slate-600 p-2">
          <FiMoreVertical size={20} />
        </button>
      </header>

      {/* --- メッセージエリア --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-100 scrollbar-thin scrollbar-thumb-slate-300">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <div className="bg-slate-200 p-4 rounded-full mb-3">
              <FiSend size={24} className="ml-1" />
            </div>
            <p>メッセージを送って会話を始めましょう！</p>
            <p className="text-xs mt-1">企画の相談や詳細の確認などにご利用ください。</p>
          </div>
        ) : (
          // 日付ごとにグループ化などを将来的に実装可能
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            const showTime = index === messages.length - 1 || messages[index+1]?.senderId !== msg.senderId;

            return (
              <div key={msg.id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* 相手のアイコン（連続投稿時は省略などのロジックも可） */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 mt-1 overflow-hidden">
                       {recipient?.iconUrl ? (
                          <img src={recipient.iconUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="flex items-center justify-center h-full text-xs">👤</span>
                        )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* 吹き出し */}
                    <div className={`
                      px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words
                      ${isMe 
                        ? 'bg-pink-500 text-white rounded-2xl rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-none'}
                    `}>
                      {msg.content}
                    </div>
                    
                    {/* タイムスタンプ */}
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- 入力エリア --- */}
      <div className="bg-white border-t border-slate-200 p-3 md:p-4">
        <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-4xl mx-auto">
          {/* ファイル添付ボタン（機能未実装ならUIのみ） */}
          <button type="button" className="p-3 text-slate-400 hover:text-pink-500 hover:bg-slate-50 rounded-full transition-colors" title="画像を添付">
            <FiImage size={20} />
          </button>
          
          <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-pink-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-100 transition-all">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm text-slate-800 placeholder-slate-400 max-h-[120px] py-2"
              rows={1}
            />
          </div>

          <button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className={`
              p-3 rounded-full shadow-md transition-all flex items-center justify-center shrink-0
              ${!newMessage.trim() || isSending
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-pink-500 text-white hover:bg-pink-600 hover:scale-105'}
            `}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiSend size={18} className="ml-0.5" /> // アイコンの視覚調整
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ユーティリティ: 日付フォーマット
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  // 今日なら時刻のみ
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
  // それ以外なら日付と時刻
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}