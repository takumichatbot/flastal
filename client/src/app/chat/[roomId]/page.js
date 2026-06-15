"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { Send, ChevronLeft, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('ログインが必要です');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    if (!token || !roomId) return;
    try {
      const res = await fetch(`${API_URL}/api/chats/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages || []);
      setRecipient(data.recipient || null);
    } catch {
      toast.error('メッセージの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      content: text,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${API_URL}/api/chats/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? saved : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(text);
      toast.error('送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResize = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
    setNewMessage(el.value);
  };

  if (authLoading || (isLoading && !recipient)) {
    return (
      <div className="flex items-center justify-center bg-slate-50 font-sans" style={{ height: '100dvh' }}>
        <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-slate-50 font-sans overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* ── ヘッダー ── */}
      <div
        className="flex-shrink-0 bg-white border-b border-slate-100 flex items-center gap-3 px-4"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
            {recipient?.iconUrl ? (
              <Image src={recipient.iconUrl} alt="" width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <User size={18} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-800 text-sm truncate">{recipient?.name || '相手ユーザー'}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {recipient?.isOnline ? '● オンライン' : 'オフライン'}
            </p>
          </div>
        </div>
      </div>

      {/* ── メッセージエリア ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Send size={20} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">メッセージを送って会話を始めましょう！</p>
            <p className="text-xs text-slate-300 mt-1">企画の相談や詳細の確認などにご利用ください</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user?.id;
            const prevMsg = messages[i - 1];
            const showAvatar = !isMe && prevMsg?.senderId !== msg.senderId;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: msg._optimistic ? 0.7 : 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* 相手アイコン */}
                {!isMe && (
                  <div className={`w-7 h-7 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 mb-1 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                    {recipient?.iconUrl ? (
                      <Image src={recipient.iconUrl} alt="" width={28} height={28} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-[20px] rounded-br-[6px]'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-[20px] rounded-bl-[6px]'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-slate-300 font-medium mt-1 px-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── 入力エリア ── */}
      <div
        className="flex-shrink-0 bg-white border-t border-slate-100 px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-slate-50 rounded-[20px] border-2 border-transparent focus-within:border-pink-300 focus-within:bg-white transition-all flex items-end px-4 py-2.5">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleResize}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              rows={1}
              className="w-full bg-transparent outline-none text-[16px] text-slate-800 placeholder:text-slate-300 resize-none max-h-[100px] font-medium"
            />
          </div>

          <AnimatePresence>
            {newMessage.trim() && (
              <motion.button
                key="send"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="w-11 h-11 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-pink-200 flex-shrink-0 disabled:opacity-50 transition-opacity"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={16} className="ml-0.5" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
