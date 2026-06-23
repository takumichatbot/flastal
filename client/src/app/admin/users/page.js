'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Search, Users, Mail, Shield, Filter, ArrowLeft,
    ShieldCheck, Palette, Store, Building2, User, RefreshCw,
    MessageSquare, Trash2, EyeOff, CheckCircle, Coins, X, Crown, Sparkles
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const getRoleBadge = (role) => {
    switch (role) {
        case 'ADMIN': return { bg: 'bg-rose-100', text: 'text-rose-700', label: '管理者', icon: ShieldCheck };
        case 'FLORIST': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'お花屋さん', icon: Store };
        case 'VENUE': return { bg: 'bg-blue-100', text: 'text-blue-700', label: '会場', icon: Building2 };
        case 'ORGANIZER': return { bg: 'bg-amber-100', text: 'text-amber-700', label: '主催者', icon: Shield };
        case 'ILLUSTRATOR_OLD': 
        case 'ILLUSTRATOR': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'イラストレーター', icon: Palette };
        default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'ファン', icon: User };
    }
};

// ★ 追加: ステータスバッジの取得ロジック
const getStatusBadge = (status) => {
    if (status === 'SUSPENDED') return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', label: '非表示 (BAN)' };
    if (status === 'PENDING') return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: '審査中' };
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: '有効' }; // ACTIVE または APPROVED
};

export default function AdminUsersPage() {
    const { user, isAuthenticated, loading, authenticatedFetch } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [premiumOnly, setPremiumOnly] = useState(false);

    const [pointModal, setPointModal] = useState(null); // { id, name, currentPoints }
    const [pointDelta, setPointDelta] = useState('');
    const [pointReason, setPointReason] = useState('');

    const [suspendModal, setSuspendModal] = useState(null); // { id, name, role, newStatus, actionName }
    const [suspendReason, setSuspendReason] = useState('');

    const fetchUsers = async () => {
        setIsLoadingData(true);
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const params = new URLSearchParams();
            if (searchKeyword) params.append('keyword', searchKeyword);

            const res = await fetch(`${API_URL}/api/admin/users/search?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('ユーザー情報の取得に失敗しました');
            
            const data = await res.json();
            const rawUsers = Array.isArray(data) ? data : [];

            const mappedUsers = rawUsers.map(u => {
                let role = u.role ? String(u.role).toUpperCase() : 'USER';
                let displayName = u.displayName || u.handleName || u.name || '未設定';

                if (u.illustratorProfile) {
                    role = 'ILLUSTRATOR';
                    displayName = u.illustratorProfile.penName || displayName;
                }

                if (role === 'FLORIST' && u.platformName) displayName = u.platformName;
                if (role === 'ORGANIZER' && u.name) displayName = u.name;
                if (role === 'VENUE' && u.venueName) displayName = u.venueName;

                return {
                    ...u,
                    role: role,
                    displayName: displayName,
                    email: u.email || '非公開（プロフ連携のみ）',
                    status: u.status || 'ACTIVE' // ステータスを保持
                };
            });

            setUsers(mappedUsers);
            
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('ユーザー一覧の取得に失敗しました');
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません');
            router.push('/login');
            return;
        }
        
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [isAuthenticated, user, loading, router, searchKeyword]);

    const filteredUsers = useMemo(() => {
        let result = users;
        if (activeTab !== 'ALL') {
            if (activeTab === 'USER') result = result.filter(u => u.role === 'USER' || !u.role);
            else if (activeTab === 'ILLUSTRATOR') result = result.filter(u => u.role === 'ILLUSTRATOR' || u.role === 'ILLUSTRATOR_OLD');
            else result = result.filter(u => u.role === activeTab);
        }
        if (premiumOnly) result = result.filter(u => u.isPremium || u.plan === 'PREMIUM' || u.subscriptionStatus === 'active');
        return result;
    }, [users, activeTab, premiumOnly]);

    // 今日の新規登録判定 (24時間以内)
    const isNewToday = (createdAt) => {
        if (!createdAt) return false;
        return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
    };

    const handleStartChat = async (targetUser) => {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        if (!token) return;

        const toastId = toast.loading('チャットルームを準備中...');
        try {
            const res = await fetch(`${API_URL}/api/admin/chat-rooms`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    targetUserId: targetUser.id,
                    targetUserRole: targetUser.role,
                })
            });

            if (res.ok) {
                toast.success('チャットルームを開きます', { id: toastId });
                router.push(`/admin/contact?userId=${targetUser.id}&role=${targetUser.role}`);
            } else {
                throw new Error('ルーム接続失敗');
            }
        } catch (error) {
            toast.error('チャットルームへの接続に失敗しました', { id: toastId });
        }
    };

    // ★ ステータス(BAN/復旧)の切り替えロジック — 停止時は理由入力モーダルを開く
    const handleToggleStatus = (targetUserId, targetUserName, targetRole, currentStatus) => {
        // BAN状態なら適切な「有効化」ステータスに戻し、それ以外なら「SUSPENDED」にする
        const newStatus = currentStatus === 'SUSPENDED'
            ? (['FLORIST', 'VENUE', 'ORGANIZER'].includes(targetRole) ? 'APPROVED' : 'ACTIVE')
            : 'SUSPENDED';

        const actionName = newStatus === 'SUSPENDED' ? '利用停止（BAN）' : '有効化（復旧）';

        if (newStatus === 'SUSPENDED') {
            // 停止時は理由入力モーダルを表示
            setSuspendReason('');
            setSuspendModal({ id: targetUserId, name: targetUserName, role: targetRole, newStatus, actionName });
        } else {
            // 復旧は即時実行（確認ダイアログのみ）
            if (!window.confirm(`本当にアカウント「${targetUserName}」を${actionName}にしますか？`)) return;
            execToggleStatus(targetUserId, targetRole, newStatus, null, actionName);
        }
    };

    const execToggleStatus = async (targetUserId, targetRole, newStatus, reason, actionName) => {
        const toastId = toast.loading('更新中...');
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/users/${targetUserId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: targetRole, status: newStatus, reason })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || '更新に失敗しました');
            }

            setSuspendModal(null);
            toast.success(`アカウントを${actionName}にしました。`, { id: toastId });
            fetchUsers();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handleAdjustPoints = async () => {
        const delta = parseInt(pointDelta, 10);
        if (!pointModal || isNaN(delta) || delta === 0) return;
        const toastId = toast.loading('ポイントを更新中...');
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/users/${pointModal.id}/points`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ delta, reason: pointReason }),
            });
            if (!res.ok) throw new Error((await res.json()).message || '失敗しました');
            const data = await res.json();
            toast.success(`${data.message} (残高: ${data.user.points}pt)`, { id: toastId });
            setPointModal(null);
            setPointDelta('');
            setPointReason('');
            fetchUsers();
        } catch (e) {
            toast.error(e.message, { id: toastId });
        }
    };

    const handleDeleteUser = async (targetUserId, targetUserName, targetRole) => {
        if (!window.confirm(`本当にアカウント「${targetUserName}」を物理削除しますか？\n※基本的には「BAN（非表示）」を推奨します。物理削除は紐づく全データが消去されます。`)) {
            return;
        }

        const toastId = toast.loading('削除中...');
        try {
            const res = await authenticatedFetch(`${API_URL}/api/admin/users/${targetUserId}?role=${targetRole}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || '削除に失敗しました');
            }

            toast.success('アカウントを削除しました。', { id: toastId });
            fetchUsers();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-sky-500" /></div>;

    return (
        <>
        <div className="min-h-screen bg-slate-50 pb-24">
            
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Users className="text-sky-500" size={24} /> 全ユーザー管理
                                </h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">User Management Console</p>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-inner">
                            合計: <span className="text-sky-600 font-black">{filteredUsers.length}</span> アカウント
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="名前、メールアドレスで検索..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium shadow-inner"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {[
                                { id: 'ALL', label: 'すべて' },
                                { id: 'USER', label: 'ファン' },
                                { id: 'ORGANIZER', label: '主催者' },
                                { id: 'FLORIST', label: 'お花屋さん' },
                                { id: 'ILLUSTRATOR', label: 'イラストレーター' },
                                { id: 'VENUE', label: '会場' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 shadow-sm",
                                        activeTab === tab.id
                                            ? "bg-slate-900 text-white shadow-md border border-slate-800"
                                            : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {/* プレミアム会員フィルター */}
                        <button
                            onClick={() => setPremiumOnly(v => !v)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 shadow-sm border",
                                premiumOnly
                                    ? "bg-amber-500 text-white border-amber-500 shadow-md"
                                    : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
                            )}
                        >
                            <Crown size={13} /> プレミアム会員のみ
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ユーザー情報</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">連絡先</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">権限・ロール</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">状態</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">登録日</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoadingData ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <RefreshCw className="animate-spin text-sky-400 mx-auto mb-4" size={32} />
                                            <p className="text-sm font-bold text-slate-500">データを読み込み中...</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <Filter className="text-slate-300 mx-auto mb-4" size={32} />
                                            <p className="text-sm font-bold text-slate-500">条件に一致するユーザーがいません</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const roleBadge = getRoleBadge(u.role);
                                        const statusBadge = getStatusBadge(u.status); // ★ 状態バッジを取得

                                        return (
                                            <tr key={u.id} className={cn("transition-colors group", u.status === 'SUSPENDED' ? 'bg-slate-50 opacity-60' : isNewToday(u.createdAt) ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-sky-50/30')}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-10 h-10 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                                            {u.iconUrl ? (
                                                                <img src={u.iconUrl} alt="icon" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="text-slate-400" size={20} />
                                                            )}
                                                            {isNewToday(u.createdAt) && (
                                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" title="今日の新規登録">
                                                                    <Sparkles size={8} className="text-white" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className={cn("text-sm font-bold transition-colors", u.status === 'SUSPENDED' ? 'text-slate-500 line-through' : 'text-slate-800 group-hover:text-sky-600')}>
                                                                    {u.displayName}
                                                                </p>
                                                                {isNewToday(u.createdAt) && (
                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200">
                                                                        <Sparkles size={8} /> NEW
                                                                    </span>
                                                                )}
                                                                {(u.isPremium || u.plan === 'PREMIUM' || u.subscriptionStatus === 'active') && (
                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full border border-amber-200">
                                                                        <Crown size={8} /> PRO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {u.id.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Mail size={14} className="text-slate-400" />
                                                        {u.email !== '非公開（プロフ連携のみ）' ? (
                                                          <a href={`mailto:${u.email}`} className="hover:text-sky-500 hover:underline transition-colors">
                                                              {u.email}
                                                          </a>
                                                        ) : (
                                                          <span className="text-slate-400">{u.email}</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm", roleBadge.bg, roleBadge.text, roleBadge.bg.replace('bg-', 'border-'))}>
                                                        <roleBadge.icon size={12} /> {roleBadge.label}
                                                    </span>
                                                </td>

                                                {/* ★ 状態(ステータス)カラム */}
                                                <td className="px-6 py-4">
                                                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black border", statusBadge.bg, statusBadge.text, statusBadge.border)}>
                                                        {statusBadge.label}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 font-medium">
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ja-JP') : '-'}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStartChat(u)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                            title="チャットを開始"
                                                        >
                                                            <MessageSquare size={14} /> <span className="hidden sm:inline">連絡</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setPointModal({ id: u.id, name: u.displayName, currentPoints: u.points ?? 0 }); setPointDelta(''); setPointReason(''); }}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                            title="ポイント調整"
                                                        >
                                                            <Coins size={14} /> <span className="hidden sm:inline">Pt</span>
                                                        </button>
                                                        
                                                        {/* ★ BAN/復旧トグルボタン */}
                                                        {u.status === 'SUSPENDED' ? (
                                                            <button 
                                                                onClick={() => handleToggleStatus(u.id, u.displayName, u.role, u.status)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-600 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                                title="アカウントを復旧させる"
                                                            >
                                                                <CheckCircle size={14} /> <span className="hidden sm:inline">復旧</span>
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleToggleStatus(u.id, u.displayName, u.role, u.status)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-amber-600 hover:bg-amber-600 hover:text-white border border-slate-200 hover:border-amber-600 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                                title="サイトから非表示にする(BAN)"
                                                            >
                                                                <EyeOff size={14} /> <span className="hidden sm:inline">BAN</span>
                                                            </button>
                                                        )}

                                                        <button 
                                                            onClick={() => handleDeleteUser(u.id, u.displayName, u.role)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-200 hover:border-rose-500 rounded-lg transition-all text-xs font-bold shadow-sm ml-2"
                                                            title="ユーザーを物理削除"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>

        {/* 利用停止理由入力モーダル */}
        {suspendModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                            <EyeOff size={18} className="text-rose-500" /> 利用停止
                        </h2>
                        <button onClick={() => setSuspendModal(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                        対象: <span className="font-bold">{suspendModal.name}</span> を利用停止にします。
                    </p>
                    <label className="block text-xs font-bold text-slate-600 mb-1">停止理由（任意）</label>
                    <input
                        type="text"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        placeholder="例: 規約違反、不正利用など"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setSuspendModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50">キャンセル</button>
                        <button
                            onClick={() => execToggleStatus(suspendModal.id, suspendModal.role, suspendModal.newStatus, suspendReason || '管理者による停止', suspendModal.actionName)}
                            className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-black hover:bg-rose-600 transition-colors"
                        >
                            停止する
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ポイント調整モーダル */}
        {pointModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                            <Coins size={18} className="text-amber-500" /> ポイント調整
                        </h2>
                        <button onClick={() => setPointModal(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">対象: <span className="font-bold">{pointModal.name}</span></p>
                    <p className="text-xs text-slate-400 mb-4">現在の残高: {pointModal.currentPoints.toLocaleString()} pt</p>
                    <label className="block text-xs font-bold text-slate-600 mb-1">増減量（例: +500 or -200）</label>
                    <input
                        type="number"
                        value={pointDelta}
                        onChange={(e) => setPointDelta(e.target.value)}
                        placeholder="例: 500 または -200"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <label className="block text-xs font-bold text-slate-600 mb-1">理由（任意）</label>
                    <input
                        type="text"
                        value={pointReason}
                        onChange={(e) => setPointReason(e.target.value)}
                        placeholder="例: キャンペーン付与"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setPointModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50">キャンセル</button>
                        <button onClick={handleAdjustPoints} className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 transition-colors">適用する</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}