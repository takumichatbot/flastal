"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Send, ChevronLeft, User, Loader2, ExternalLink, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return '今日';
  if (d.toDateString() === yesterday.toDateString()) return '昨日';
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { token, isAuthenticated, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionUnstable, setConnectionUnstable] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('ログインが必要です');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    if (!token || !roomId) return;
    try {
      const res = await fetch(`${API_URL}/api/project-details/chat/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoom(data);
      setMessages(prev => {
        const incoming = data.messages || [];
        prevMsgCountRef.current = prev.length;
        return incoming;
      });
      setConnectionUnstable(false);
    } catch {
      // バックグラウンドの定期ポーリングでは、失敗のたびにトーストを積み上げず
      // 初回読み込み時のみ通知（固定IDで重複も防止）。以降は控えめなインライン表示に留める。
      if (isLoading) {
        toast.error('メッセージの読み込みに失敗しました', { id: 'chat-poll' });
      }
      setConnectionUnstable(true);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, token, isLoading]);

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
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // iOSキーボードを閉じる
    if (Capacitor.isNativePlatform()) {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        await Keyboard.hide();
      } catch { /* ignore */ }
    }

    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      content: text,
      senderType: 'USER',
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${API_URL}/api/project-details/chat/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setNewMessage(el.value);

    // タイピングインジケーター: 入力中は表示、1.5秒無入力で非表示
    if (el.value.trim()) {
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
    } else {
      setIsTyping(false);
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const florist = room?.offer?.florist;
  const project = room?.offer?.project;
  const floristName = florist?.platformName || florist?.shopName || 'お花屋さん';

  if (authLoading || (isLoading && !room)) {
    return (
      <div className="flex items-center justify-center bg-[#F7F7FA] font-sans" style={{ height: '100dvh' }}>
        <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Build rendered items: inject date separators and track grouping
  const renderedItems = [];
  let lastDateStr = null;
  messages.forEach((msg, i) => {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== lastDateStr) {
      renderedItems.push({ type: 'date', label: formatDateLabel(msg.createdAt), key: `date-${i}` });
      lastDateStr = dateStr;
    }
    const prevMsg = messages[i - 1];
    const nextMsg = messages[i + 1];
    const isFirst = !prevMsg || prevMsg.senderType !== msg.senderType || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
    const isLast = !nextMsg || nextMsg.senderType !== msg.senderType || new Date(nextMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
    renderedItems.push({ type: 'msg', msg, isFirst, isLast, key: msg.id });
  });

  return (
    <div
      className="flex flex-col bg-[#F7F7FA] font-sans overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* ── ヘッダー ── */}
      <div
        className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm flex items-center gap-3 px-4"
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

        <Link href={florist?.id ? `/florists/${florist.id}` : '#'} className="flex items-center gap-2.5 flex-1 min-w-0 active:opacity-70 transition-opacity">
          <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
            {florist?.iconUrl ? (
              <Image src={florist.iconUrl} alt={florist?.shopName || '花屋アイコン'} width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <User size={18} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-slate-800 text-sm truncate leading-tight">{floristName}</p>
            {project?.title && (
              <p className="text-[10px] text-pink-500 font-bold truncate">📌 {project.title}</p>
            )}
          </div>
        </Link>

        {project?.id && (
          <Link href={`/projects/${project.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200 transition-colors flex-shrink-0">
            <ExternalLink size={16} />
          </Link>
        )}
      </div>

      {/* ── 接続不安定インジケーター ── */}
      <AnimatePresence>
        {connectionUnstable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 bg-amber-50 border-b border-amber-100 text-amber-600 text-[11px] font-bold text-center py-1.5"
          >
            接続が不安定です。再接続を試みています…
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── メッセージエリア ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-16">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
              <Send size={20} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">メッセージを送って会話を始めましょう！</p>
            <p className="text-xs text-slate-300 mt-1">企画の相談や詳細の確認などにご利用ください</p>
          </div>
        ) : (
          renderedItems.map(item => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="flex items-center gap-3 py-3 select-none">
                  <div className="flex-1 h-px bg-slate-200/60" />
                  <span className="text-[10px] font-bold text-slate-400 bg-[#F7F7FA] px-2">{item.label}</span>
                  <div className="flex-1 h-px bg-slate-200/60" />
                </div>
              );
            }

            const { msg, isFirst, isLast } = item;
            const isMe = msg.senderType === 'USER';

            const bubbleRadius = 'rounded-2xl';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: msg._optimistic ? 0.75 : 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}
              >
                {/* 相手アイコン */}
                {!isMe && (
                  <div className={`w-7 h-7 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100 transition-opacity ${isLast ? 'opacity-100' : 'opacity-0'}`}>
                    {florist?.iconUrl ? (
                      <Image src={florist.iconUrl} alt={florist?.shopName || '花屋アイコン'} width={28} height={28} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User size={14} className="text-slate-300" /></div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${bubbleRadius} ${
                      isMe
                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                        : 'bg-white text-slate-800 border border-slate-100/80'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Timestamp + read receipt (my messages only, last in group) */}
                  {isLast && (
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[9px] text-slate-300 font-medium">{formatTime(msg.createdAt)}</span>
                      {isMe && (
                        <span className="text-[9px] text-slate-300 flex items-center">
                          {msg._optimistic
                            ? <Check size={10} className="text-slate-300" />
                            : <CheckCheck size={10} className="text-pink-400" />
                          }
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        {/* タイピングインジケーター */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400"
            >
              <span className="flex gap-0.5 items-center">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>入力中...</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── 入力エリア ── */}
      <div
        className="flex-shrink-0 bg-white border-t border-slate-100 px-3 py-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 flex flex-col bg-[#F7F7FA] rounded-[22px] border-2 border-transparent focus-within:border-pink-300 focus-within:bg-white transition-all px-4 py-2.5 min-h-[44px]">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleResize}
              onKeyDown={handleKeyDown}
              placeholder="メッセージ..."
              rows={1}
              maxLength={500}
              className="w-full bg-transparent outline-none text-[16px] text-slate-800 placeholder:text-slate-400 resize-none max-h-[120px] font-medium leading-relaxed"
            />
            {newMessage.length > 0 && (
              <div className={`text-right text-[10px] font-medium mt-0.5 ${newMessage.length >= 480 ? 'text-rose-400' : 'text-slate-400'}`}>
                {newMessage.length}/500
              </div>
            )}
          </div>

          <AnimatePresence>
            {newMessage.trim() ? (
              <motion.button
                key="send"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="w-11 h-11 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-pink-200 flex-shrink-0 disabled:opacity-50 transition-opacity"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
              </motion.button>
            ) : (
              <div className="w-11 h-11 flex-shrink-0" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
