'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Search, Users, Mail, Shield, Filter, ArrowLeft, 
    MoreVertical, ShieldCheck, Palette, Store, Building2, User, RefreshCw, MessageSquare
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// --- ヘルパー: ロールに応じたスタイル ---
const getRoleBadge = (role) => {
    switch (role) {
        case 'ADMIN': return { bg: 'bg-rose-100', text: 'text-rose-700', label: '管理者', icon: ShieldCheck };
        case 'FLORIST': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'お花屋さん', icon: Store };
        case 'VENUE': return { bg: 'bg-blue-100', text: 'text-blue-700', label: '会場', icon: Building2 };
        case 'ORGANIZER': return { bg: 'bg-amber-100', text: 'text-amber-700', label: '主催者', icon: Shield };
        case 'ILLUSTRATOR': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'クリエイター', icon: Palette };
        default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'ファン', icon: User };
    }
};

export default function AdminUsersPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');

    // ★ パワーアップしたバックエンドAPI 1本だけを叩くシンプルで確実なロジック
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
            const usersArray = Array.isArray(data) ? data : (data.users || data.data || []);

            // バックエンドが返してくれたリレーション情報（florist, organizer等）を使って名前を抽出
            const mappedUsers = usersArray.map(u => {
                const role = u.role ? u.role.toUpperCase() : 'USER';
                let displayName = u.handleName || u.name || '未設定';
                
                if (role === 'FLORIST' && u.florist?.storeName) displayName = u.florist.storeName;
                if (role === 'ORGANIZER' && u.organizer?.organizerName) displayName = u.organizer.organizerName;
                if (role === 'ILLUSTRATOR' && u.illustrator?.penName) displayName = u.illustrator.penName;
                if (role === 'VENUE' && u.venue?.venueName) displayName = u.venue.venueName;

                return {
                    ...u,
                    role,
                    displayName,
                    email: u.email || '非公開（プロフ連携のみ）'
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
        if (activeTab === 'ALL') return users;
        if (activeTab === 'USER') return users.filter(u => u.role === 'USER' || !u.role);
        return users.filter(u => u.role === activeTab);
    }, [users, activeTab]);

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

    if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-sky-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            
            {/* ヘッダーエリア */}
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
                
                {/* 検索・フィルターエリア */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    {/* 検索バー */}
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

                    {/* タブ */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                        {[
                            { id: 'ALL', label: 'すべて' },
                            { id: 'USER', label: 'ファン' },
                            { id: 'ORGANIZER', label: '主催者' },
                            { id: 'FLORIST', label: 'お花屋さん' },
                            { id: 'ILLUSTRATOR', label: 'クリエイター' },
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
                </div>

                {/* ユーザー一覧テーブル */}
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ユーザー情報</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">連絡先</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">権限・ロール</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">登録日</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoadingData ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <RefreshCw className="animate-spin text-sky-400 mx-auto mb-4" size={32} />
                                            <p className="text-sm font-bold text-slate-500">データを読み込み中...</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <Filter className="text-slate-300 mx-auto mb-4" size={32} />
                                            <p className="text-sm font-bold text-slate-500">条件に一致するユーザーがいません</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const badge = getRoleBadge(u.role);
                                        return (
                                            <tr key={u.id} className="hover:bg-sky-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                                            {u.iconUrl ? (
                                                                <img src={u.iconUrl} alt="icon" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="text-slate-400" size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                                                                {u.displayName}
                                                            </p>
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
                                                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm", badge.bg, badge.text, badge.bg.replace('bg-', 'border-'))}>
                                                        <badge.icon size={12} /> {badge.label}
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
                                                            <MessageSquare size={14} /> 連絡
                                                        </button>
                                                        
                                                        {u.email !== '非公開（プロフ連携のみ）' && (
                                                          <a 
                                                              href={`mailto:${u.email}`}
                                                              className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                              title="メールを送信"
                                                          >
                                                              <Mail size={14} /> メール
                                                          </a>
                                                        )}
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
    );
}