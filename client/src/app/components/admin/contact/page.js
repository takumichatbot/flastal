// app/admin/contact/page.js
'use client';

import { useState } from 'react';
import AdminUserList from '@/components/admin/AdminUserList';
import AdminIndividualChat from '@/components/admin/AdminIndividualChat';
import { useAuth } from '@/app/contexts/AuthContext'; // 認証コンテキストを使用

export default function AdminContactPage() {
    const { user } = useAuth(); // ログインユーザー（管理者）情報を取得
    const [selectedUser, setSelectedUser] = useState(null);
    const [chatRoom, setChatRoom] = useState(null);

    // 管理者ユーザーのIDを chatRoom に渡すために準備 (useAuthがADMIN権限を持つことを前提)
    // バックエンドの AdminChatRoom.adminId にこのIDが入ることを想定
    const adminUserId = user?.id; 

    const handleUserSelect = (user, room) => {
        setSelectedUser(user);
        // room オブジェクトに adminId を追加して渡す（AdminIndividualChatで利用）
        setChatRoom({ 
            ...room, 
            adminId: adminUserId 
        }); 
    };

    if (user?.role !== 'ADMIN') {
        return (
            <div className="p-10 text-center text-red-600">
                <h1 className="text-2xl font-bold">アクセス拒否</h1>
                <p>このページは管理者専用です。</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminUserList 
                onUserSelect={handleUserSelect} 
            />
            <AdminIndividualChat 
                selectedUser={selectedUser} 
                chatRoom={chatRoom} 
            />
        </div>
    );
}