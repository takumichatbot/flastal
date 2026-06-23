'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  Send,
  MessageCircle,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STATUS_CONFIG = {
  PENDING:    { label: '支払い待ち',  icon: Clock,         color: 'text-amber-600  bg-amber-50  border-amber-200' },
  PAID:       { label: '支払い完了',  icon: CheckCircle2,  color: 'text-sky-600    bg-sky-50    border-sky-200' },
  PROCESSING: { label: '出荷準備中',  icon: Package,       color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  SHIPPED:    { label: '発送済み',    icon: Truck,         color: 'text-violet-600 bg-violet-50 border-violet-200' },
  DELIVERED:  { label: '配達完了',    icon: CheckCircle2,  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  CANCELLED:  { label: 'キャンセル', icon: XCircle,       color: 'text-rose-600   bg-rose-50   border-rose-200' },
  REFUNDED:   { label: '返金済み',    icon: XCircle,       color: 'text-slate-600  bg-slate-50  border-slate-200' },
};

export default function OrderDetailPage() {
  const { id: orderId } = useParams();
  const { user, token } = useAuth();

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const isFlorist = user?.role === 'FLORIST';
  const isAdmin = user?.role === 'ADMIN';
  const canChat = isFlorist || isAdmin;

  // 注文情報の取得
  const fetchOrder = useCallback(async () => {
    if (!token || !orderId) return;
    try {
      const res = await fetch(`${API_URL}/api/shop/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('注文情報の取得に失敗しました');
      setOrder(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingOrder(false);
    }
  }, [token, orderId]);

  // メッセージ一覧の取得（取得と同時に既読更新）
  const fetchMessages = useCallback(async () => {
    if (!token || !orderId) return;
    try {
      const res = await fetch(`${API_URL}/api/order-chat/orders/${orderId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('メッセージの取得に失敗しました');
      setMessages(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [token, orderId]);

  // Socket.io 接続
  useEffect(() => {
    if (!token || !orderId || !canChat) return;

    const socket = io(API_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_order_chat', orderId);
    });

    socket.on('new_order_message', (msg) => {
      setMessages((prev) => {
        // 重複排除
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, orderId, canChat]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // メッセージ末尾へ自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // メッセージ送信
  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/order-chat/orders/${orderId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: inputText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'メッセージの送信に失敗しました');
      }
      const newMsg = await res.json();
      // Socket.io でも届くが、楽観的に追加しておく
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setInputText('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 送信者が自分かどうかを判定
  const isMine = (msg) => {
    if (!user) return false;
    return msg.senderId === user.id;
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // 未ログイン・権限なし
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 mb-4">ログインが必要です</p>
          <Link href="/florists/login" className="bg-sky-500 text-white px-6 py-3 rounded-xl font-bold">
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  if (!canChat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500">このページへのアクセス権限がありません。</p>
        </div>
      </div>
    );
  }

  const statusCfg = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING : null;
  const StatusIcon = statusCfg?.icon || Package;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/shop/orders" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-black text-slate-800">
              注文詳細・チャット
            </h1>
            {order && (
              <p className="text-xs text-slate-400">
                注文 #{order.id.slice(-8).toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-4 flex flex-col gap-4 flex-1">
        {/* 注文情報カード */}
        {loadingOrder ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ) : order ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg?.color}`}>
                  <StatusIcon size={13} />
                  {statusCfg?.label}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>

              {/* 商品一覧 */}
              <div className="space-y-3 mb-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          {item.product?.category?.emoji || '📦'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-400">
                        ¥{Math.round(item.price * 1.1).toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-700 shrink-0">
                      ¥{Math.round(item.price * 1.1 * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* 合計 */}
              <div className="border-t border-slate-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>小計（税抜）</span>
                  <span>¥{order.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>消費税</span>
                  <span>¥{order.tax?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>送料</span>
                  <span>{order.shippingFee === 0 ? '無料' : `¥${order.shippingFee?.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between font-black text-slate-800 text-base pt-1">
                  <span>合計</span>
                  <span>¥{order.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* 追跡番号 */}
              {order.trackingNumber && (
                <div className="mt-3 bg-violet-50 rounded-xl p-3 flex items-center gap-2">
                  <Truck size={15} className="text-violet-600" />
                  <div>
                    <p className="text-xs font-semibold text-violet-700">追跡番号</p>
                    <p className="text-sm text-violet-800 font-mono">{order.trackingNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* チャットエリア */}
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden"
          style={{ minHeight: '400px', maxHeight: '60vh' }}>
          {/* チャットヘッダー */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <MessageCircle size={16} className="text-sky-500" />
            <h2 className="text-sm font-bold text-slate-700">担当者とのチャット</h2>
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageCircle size={32} className="text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">メッセージはまだありません</p>
                <p className="text-slate-300 text-xs mt-1">担当者にお気軽にご連絡ください</p>
              </div>
            ) : (
              messages.map((msg) => {
                const mine = isMine(msg);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {/* 送信者ラベル */}
                      <span className="text-[10px] text-slate-400 px-1">
                        {mine ? 'あなた' : msg.senderType === 'ADMIN' ? '運営' : '花屋'}
                      </span>
                      {/* バブル */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          mine
                            ? 'bg-pink-500 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {/* 時刻 */}
                      <span className="text-[10px] text-slate-400 px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 入力欄 */}
          <div className="border-t border-slate-100 px-4 py-3 flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力... (Enterで送信)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 max-h-28 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="shrink-0 bg-pink-500 hover:bg-pink-600 text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {sending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
