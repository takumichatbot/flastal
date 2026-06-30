'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import {
    ArrowLeft, ShoppingCart, RefreshCw, ChevronDown, ChevronUp,
    Truck, CheckCircle2, XCircle, Package, Clock, CreditCard
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const GlassCard = ({ children, className }) => (
    <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]", className)}>
        {children}
    </div>
);

const STATUS_CONFIG = {
    PENDING:    { label: '未払い',     bg: 'bg-slate-100',  text: 'text-slate-600',  icon: Clock },
    PAID:       { label: '支払完了',   bg: 'bg-sky-100',    text: 'text-sky-700',    icon: CreditCard },
    PROCESSING: { label: '準備中',     bg: 'bg-amber-100',  text: 'text-amber-700',  icon: Package },
    SHIPPED:    { label: '発送済み',   bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck },
    DELIVERED:  { label: '配達完了',   bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
    CANCELLED:  { label: 'キャンセル', bg: 'bg-rose-100',   text: 'text-rose-700',   icon: XCircle },
};

const STATUS_FILTERS = [
    { id: '',           label: 'すべて' },
    { id: 'PAID',       label: '支払完了' },
    { id: 'PROCESSING', label: '準備中' },
    { id: 'SHIPPED',    label: '発送済み' },
    { id: 'DELIVERED',  label: '配達完了' },
    { id: 'CANCELLED',  label: 'キャンセル' },
];

const NEXT_STATUS_OPTIONS = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl", cfg.bg, cfg.text)}>
            <Icon size={12} />
            {cfg.label}
        </span>
    );
}

export default function AdminShopOrdersPage() {
    const { user, token, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PAID');
    const [expandedId, setExpandedId] = useState(null);

    // Per-order status update state
    const [updateState, setUpdateState] = useState({}); // { [orderId]: { status, trackingNumber } }

    // ---- Auth guard ----
    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません');
            router.push('/');
        }
    }, [loading, isAuthenticated, user, router]);

    const getToken = useCallback(() => {
        if (token) return token;
        return window.__flastalToken || ''|window.__flastalToken;
    }, [token]);

    // ---- Fetch orders ----
    const fetchOrders = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const params = new URLSearchParams({ page: '1', limit: '50' });
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`${API_URL}/api/shop/admin/orders?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error('注文の取得に失敗しました');
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.orders || []);
            setOrders(list);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setIsLoadingData(false);
        }
    }, [getToken, statusFilter]);

    useEffect(() => {
        if (!loading && isAuthenticated && user?.role === 'ADMIN') {
            fetchOrders();
        }
    }, [loading, isAuthenticated, user, fetchOrders]);

    // ---- Update status ----
    const handleStatusUpdate = async (orderId) => {
        const state = updateState[orderId];
        if (!state?.status) {
            toast.error('ステータスを選択してください');
            return;
        }
        const toastId = toast.loading('更新中...');
        try {
            const body = { status: state.status };
            if (state.trackingNumber) body.trackingNumber = state.trackingNumber;
            const res = await fetch(`${API_URL}/api/shop/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || '更新に失敗しました');
            }
            toast.success('ステータスを更新しました', { id: toastId });
            fetchOrders();
        } catch (e) {
            toast.error(e.message, { id: toastId });
        }
    };

    const setOrderUpdateField = (orderId, field, value) => {
        setUpdateState(prev => ({
            ...prev,
            [orderId]: { ...prev[orderId], [field]: value },
        }));
    };

    const toggleExpand = (id) => setExpandedId(prev => (prev === id ? null : id));

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <RefreshCw className="animate-spin text-sky-500" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 pb-24">

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/shop" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <ShoppingCart className="text-sky-500" size={24} /> 注文管理
                                </h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Order Management Console</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-inner">
                                <span className="text-sky-600 font-black">{orders.length}</span> 件
                            </span>
                            <button
                                onClick={fetchOrders}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                            >
                                <RefreshCw size={18} className={isLoadingData ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Status filter tabs */}
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={cn(
                                "px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap",
                                statusFilter === f.id
                                    ? "bg-sky-500 text-white shadow-sky-200"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Orders list */}
                <GlassCard className="overflow-hidden">
                    {isLoadingData ? (
                        <div className="flex items-center justify-center py-20">
                            <RefreshCw className="animate-spin text-sky-400" size={28} />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-bold">注文がありません</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {orders.map((order) => {
                                const isExpanded = expandedId === order.id;
                                const upd = updateState[order.id] || {};
                                const floristName =
                                    order.florist?.platformName ||
                                    order.florist?.name ||
                                    order.user?.displayName ||
                                    order.user?.name ||
                                    '不明';

                                return (
                                    <div key={order.id}>
                                        {/* Row */}
                                        <div
                                            className="px-6 py-4 flex items-center gap-4 hover:bg-sky-50/30 transition-colors cursor-pointer"
                                            onClick={() => toggleExpand(order.id)}
                                        >
                                            <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                                                <div>
                                                    <div className="text-xs text-slate-400 font-mono mb-0.5">
                                                        #{String(order.id).slice(-8).toUpperCase()}
                                                    </div>
                                                    <div className="font-bold text-slate-800 text-sm truncate">{floristName}</div>
                                                </div>
                                                <div className="text-right md:text-left">
                                                    <div className="font-black text-slate-800">
                                                        ¥{(order.total ?? order.totalAmount ?? 0).toLocaleString()}
                                                    </div>
                                                    {order.itemCount != null && (
                                                        <div className="text-xs text-slate-400">{order.itemCount} 点</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                                <div className="text-xs text-slate-400 hidden md:block">
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
                                                        : '—'}
                                                </div>
                                            </div>
                                            <div className="text-slate-400 flex-shrink-0">
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>

                                        {/* Expanded detail */}
                                        {isExpanded && (
                                            <div className="px-6 pb-6 bg-slate-50/60 border-t border-slate-100">
                                                <div className="pt-4 grid md:grid-cols-2 gap-6">

                                                    {/* Items */}
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">注文アイテム</p>
                                                        {Array.isArray(order.items) && order.items.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {order.items.map((item, i) => (
                                                                    <div key={item.id || i} className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-100 text-sm">
                                                                        <div>
                                                                            <span className="font-bold text-slate-700">
                                                                                {item.product?.name || item.name || `商品 ${i + 1}`}
                                                                            </span>
                                                                            <span className="text-slate-400 ml-2">×{item.quantity}</span>
                                                                        </div>
                                                                        <span className="font-bold text-slate-800">
                                                                            ¥{((item.price ?? item.unitPrice ?? 0) * item.quantity).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                <div className="flex justify-between px-3 py-2 bg-sky-50 rounded-xl border border-sky-100 text-sm font-black text-sky-800">
                                                                    <span>合計</span>
                                                                    <span>¥{(order.total ?? order.totalAmount ?? 0).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-slate-400">アイテム情報なし</p>
                                                        )}

                                                        {/* Tracking */}
                                                        {order.trackingNumber && (
                                                            <div className="mt-3 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-700">
                                                                追跡番号: {order.trackingNumber}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status update */}
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ステータス更新</p>
                                                        <div className="space-y-3">
                                                            <select
                                                                value={upd.status || ''}
                                                                onChange={e => setOrderUpdateField(order.id, 'status', e.target.value)}
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all"
                                                            >
                                                                <option value="">ステータスを選択...</option>
                                                                {NEXT_STATUS_OPTIONS.map(s => (
                                                                    <option key={s} value={s}>
                                                                        {STATUS_CONFIG[s]?.label || s}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <input
                                                                type="text"
                                                                placeholder="追跡番号（任意）"
                                                                value={upd.trackingNumber || ''}
                                                                onChange={e => setOrderUpdateField(order.id, 'trackingNumber', e.target.value)}
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all"
                                                            />
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id)}
                                                                disabled={!upd.status}
                                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                                                            >
                                                                <Truck size={15} />
                                                                更新する
                                                            </button>
                                                        </div>

                                                        {/* Order meta */}
                                                        <div className="mt-4 space-y-1 text-xs text-slate-400">
                                                            {order.createdAt && (
                                                                <div>注文日時: {new Date(order.createdAt).toLocaleString('ja-JP')}</div>
                                                            )}
                                                            {order.updatedAt && (
                                                                <div>最終更新: {new Date(order.updatedAt).toLocaleString('ja-JP')}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>

            </div>
        </div>
    );
}
