// components/admin/AdminUserList.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiUser, FiLoader, FiFilter, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// --- ヘルパー: ロールに応じたスタイル ---
const getRoleStyle = (role) => {
    switch (role) {
        case 'ADMIN': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' };
        case 'FLORIST': return { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Florist' };
        case 'VENUE': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Venue' };
        case 'ORGANIZER': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Organizer' };
        default: return { bg: 'bg-sky-100', text: 'text-sky-700', label: 'User' };
    }
};

// --- サブコンポーネント: スケルトンローディング ---
const UserListSkeleton = () => (
    <div className="space-y-3 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);

export default function AdminUserList({ onUserSelect, selectedUser }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, FLORIST, USER, etc.
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // データ取得
    const fetchUsers = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        if (!token) {
            setIsLoading(false);
            return toast.error('認証情報がありません。');
        }

        try {
            // キーワード検索API呼び出し
            const params = new URLSearchParams();
            if (searchKeyword) params.append('keyword', searchKeyword);
            
            // ★ API側で全件または検索結果を返してもらう想定
            const res = await fetch(`${API_URL}/api/admin/users/search?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                throw new Error('取得失敗');
            }
        } catch (error) {
            console.error('User fetch error:', error);
            // toast.error('ユーザーリストの更新に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    // 初回ロード & 検索デバウンス
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchKeyword]);

    // フィルタリング処理 (クライアントサイド)
    const filteredUsers = useMemo(() => {
        if (activeTab === 'ALL') return users;
        // USER (ファン/企画者) は ROLE が USER 
        if (activeTab === 'USER') return users.filter(u => u.role === 'USER' || u.role === 'ORGANIZER');
        return users.filter(u => u.role === activeTab);
    }, [users, activeTab]);

    // ユーザー選択ハンドラ
    const handleUserClick = async (user) => {
        if (selectedUser?.id === user.id) return; // 既に選択中なら何もしない

        onUserSelect(user, null); // まずUIを切り替え
        
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/chat-rooms`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    targetUserId: user.id,
                    targetUserRole: user.role,
                })
            });

            if (res.ok) {
                const room = await res.json();
                onUserSelect(user, room); // ルーム情報更新
            } else {
                throw new Error('ルーム接続失敗');
            }
        } catch (error) {
            toast.error('チャットルームへの接続に失敗しました');
        }
    };

    return (
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full flex-shrink-0 shadow-sm z-10">
            {/* ヘッダーエリア */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiUser className="text-indigo-500" /> ユーザー検索
                </h2>
                
                {/* 検索バー */}
                <div className="relative group">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="名前、メールで検索..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* フィルタタブ */}
            <div className="px-2 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto scrollbar-hide">
                {['ALL', 'FLORIST', 'VENUE', 'USER'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors
                            ${activeTab === tab 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                        `}
                    >
                        {tab === 'ALL' ? 'すべて' : tab}
                    </button>
                ))}
            </div>

            {/* ユーザーリスト */}
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {isLoading && users.length === 0 ? (
                    <UserListSkeleton />
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-xs">
                        <FiFilter size={24} className="mb-2 opacity-50"/>
                        <p>ユーザーが見つかりません</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {filteredUsers.map((user) => {
                            const isSelected = selectedUser?.id === user.id && selectedUser?.role === user.role;
                            const badge = getRoleStyle(user.role);

                            return (
                                <li 
                                    key={`${user.id}-${user.role}`} 
                                    onClick={() => handleUserClick(user)}
                                    className={`
                                        group relative p-3 cursor-pointer transition-all duration-200 border-l-4
                                        ${isSelected 
                                            ? 'bg-indigo-50 border-indigo-600' 
                                            : 'border-transparent hover:bg-gray-50 hover:border-gray-200'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* アイコン */}
                                        <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden bg-white border border-gray-100`}>
                                            {user.iconUrl ? (
                                                <img src={user.iconUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-gray-400 text-lg">
                                                    {user.handleName?.[0]?.toUpperCase() || <FiUser />}
                                                </span>
                                            )}
                                        </div>

                                        {/* テキスト情報 */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                                                    {user.handleName || 'No Name'}
                                                </p>
                                                {/* 未読バッジ等のスペース (将来実装用) */}
                                                {/* <span className="w-2 h-2 rounded-full bg-red-500"></span> */}
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                                    {badge.label}
                                                </span>
                                                <p className="text-[10px] text-gray-400 truncate max-w-[100px]" title={user.email}>
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 右矢印 (選択時のみ強調) */}
                                        <FiChevronRight 
                                            className={`
                                                flex-shrink-0 transition-transform duration-200
                                                ${isSelected ? 'text-indigo-500 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}
                                            `} 
                                            size={16} 
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            
            {/* フッター情報 (件数など) */}
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-center text-[10px] text-gray-400">
                {filteredUsers.length} Users Found
            </div>
        </div>
    );
}