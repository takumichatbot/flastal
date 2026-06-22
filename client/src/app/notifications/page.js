'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, CheckCheck, Heart, MessageSquare, Trophy, Gift, Rss, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const TYPE_CONFIG = {
    PLEDGE:       { icon: Heart,        color: 'text-pink-500',   bg: 'bg-pink-50' },
    COMMENT:      { icon: MessageSquare, color: 'text-sky-500',   bg: 'bg-sky-50' },
    UPDATE:       { icon: Rss,           color: 'text-violet-500', bg: 'bg-violet-50' },
    ACHIEVEMENT:  { icon: Trophy,        color: 'text-amber-500',  bg: 'bg-amber-50' },
    GIFT:         { icon: Gift,          color: 'text-emerald-500',bg: 'bg-emerald-50' },
    SYSTEM:       { icon: AlertCircle,   color: 'text-slate-400',  bg: 'bg-slate-50' },
};

function NotificationItem({ notif, onRead }) {
    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
    const Icon = cfg.icon;
    const timeAgo = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ja });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`flex gap-3 p-4 rounded-2xl border transition-all ${
                notif.isRead
                    ? 'bg-white border-slate-100'
                    : 'bg-violet-50/60 border-violet-100 shadow-sm'
            }`}
        >
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${notif.isRead ? 'text-slate-600' : 'text-slate-800 font-bold'}`}>
                    {notif.message}
                </p>
                {notif.project?.title && (
                    <Link href={notif.projectId ? `/projects/${notif.projectId}` : '#'}
                        className="text-xs text-violet-500 font-bold hover:underline mt-0.5 block truncate">
                        {notif.project.title}
                    </Link>
                )}
                <p className="text-[11px] text-slate-400 mt-1">{timeAgo}</p>
            </div>
            {!notif.isRead && (
                <button onClick={() => onRead(notif.id)}
                    title="既読にする"
                    className="shrink-0 w-8 h-8 rounded-full hover:bg-violet-100 flex items-center justify-center text-violet-400 hover:text-violet-600 transition-colors">
                    <Check size={14} />
                </button>
            )}
        </motion.div>
    );
}

export default function NotificationsPage() {
    const { isAuthenticated, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setNotifications(await res.json());
            else throw new Error('通知の取得に失敗しました');
        } catch (e) {
            toast.error(e.message || 'データの取得に失敗しました');
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const markRead = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('既読にできませんでした');
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {
            toast.error(e.message || 'データの取得に失敗しました');
        }
    };

    const markAllRead = async () => {
        try {
            await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('すべて既読にしました');
        } catch {
            toast.error('失敗しました');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9FF]">
                <div className="text-center">
                    <BellOff size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-400 font-bold">ログインが必要です</p>
                </div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const filtered = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            {/* ヘッダー */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-violet-500" />
                        <h1 className="text-lg font-black text-slate-800">通知</h1>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-black">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead}
                            className="flex items-center gap-1.5 text-xs font-black text-violet-500 hover:text-violet-700 transition-colors">
                            <CheckCheck size={14} /> すべて既読
                        </button>
                    )}
                </div>

                {/* フィルター */}
                <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
                    {[
                        { key: 'all',    label: 'すべて' },
                        { key: 'unread', label: `未読 (${unreadCount})` },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                                filter === f.key
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-violet-400" size={28} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell size={40} className="mx-auto mb-3 text-slate-200" />
                        <p className="font-bold text-slate-400">
                            {filter === 'unread' ? '未読通知はありません' : 'まだ通知がありません'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filtered.map(notif => (
                                <NotificationItem key={notif.id} notif={notif} onRead={markRead} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
