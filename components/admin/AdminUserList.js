// components/admin/AdminUserList.js
'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiMail, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// トークン取得ヘルパー (AuthContextから取得する形式に変更が必要な場合があります)
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
        case case 'VENUE': return 'bg-purple-500';
        case 'ORGANIZER': return 'bg-yellow-500';
        default: return 'bg-sky-500'; // USER (ファン/企画者)
    }
};

export default function AdminUserList({ onUserSelect }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // 検索ロジック
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchKeyword.length > 2 || searchKeyword === '') {
                fetchUsers();
            } else {
                setSearchResults([]);
            }
        }, 500); // 0.5秒のディレイ

        return () => clearTimeout(delaySearch);
    }, [searchKeyword]);

    const fetchUsers = async () => {
        if (searchKeyword.length < 3 && searchKeyword !== '') return;
        
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) return;

        try {
            const params = new URLSearchParams({ keyword: searchKeyword });
            const res = await fetch(`${API_URL}/api/admin/users/search?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || 'ユーザー検索に失敗しました。');
            }
        } catch (error) {
            console.error('User search error:', error);
            toast.error('通信エラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = async (user) => {
        setSelectedUser(user);
        
        // チャットルームを生成・取得
        const token = getAuthToken();
        if (!token) return;

        const toastId = toast.loading('チャットルーム準備中...');
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
                toast.success('チャットルームをロードしました', { id: toastId });
                
                // 親コンポーネントに選択されたユーザーとルーム情報を渡す
                onUserSelect(user, room); 

            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'ルーム作成に失敗しました');
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    return (
        <div className="w-80 border-r bg-white flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800 mb-3">チャット相手を検索</h2>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="名前、メール、プラットフォーム名で検索..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-2">
                {isLoading && searchKeyword.length > 2 && (
                    <div className="text-center p-4 text-gray-500 flex items-center justify-center">
                        <FiLoader className="animate-spin mr-2" /> 検索中...
                    </div>
                )}
                
                {!isLoading && searchResults.length === 0 && searchKeyword.length > 2 && (
                    <p className="text-center p-4 text-gray-500 text-sm">該当するユーザーはいません。</p>
                )}

                {searchResults.length > 0 && (
                    <ul className="space-y-1">
                        {searchResults.map((user) => (
                            <li 
                                key={`${user.id}-${user.role}`} 
                                onClick={() => handleUserClick(user)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                                    selectedUser?.id === user.id && selectedUser?.role === user.role
                                        ? 'bg-sky-50 border border-sky-200 shadow-sm'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${getRoleColor(user.role)}`}>
                                    {user.iconUrl ? (
                                        <img src={user.iconUrl} alt={user.handleName} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        user.handleName?.[0] || user.role?.[0]
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-sm truncate">{user.handleName}</p>
                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                        <span className={`px-1 rounded-full text-white text-[10px] ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                        {user.email}
                                    </p>
                                </div>
                                <FiSend className="text-sky-500 flex-shrink-0" size={16} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}