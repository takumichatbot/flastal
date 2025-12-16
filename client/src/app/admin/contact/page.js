// app/admin/contact/page.js
'use client';

import { useState } from 'react';
// ★★★ 修正: エイリアス (@/) から相対パス (../../../components/admin/) に変更 ★★★
import AdminUserList from '../../components/admin/AdminUserList'; 
import AdminIndividualChat from '../../components/admin/AdminIndividualChat';
// ★★★ 修正: AuthContextのパスも確認 ★★★
// ※ AuthContextが app/contexts/AuthContext.js にある場合はこのパスでOK
import { useAuth } from '@/app/contexts/AuthContext'; 

export default function AdminContactPage() {
    const { user } = useAuth(); // ログインユーザー（管理者）情報を取得
    const [selectedUser, setSelectedUser] = useState(null);
    const [chatRoom, setChatRoom] = useState(null);

    // 認証チェック (フロント側)
    if (typeof window !== 'undefined' && user?.role !== 'ADMIN') {
        // ロード中は何も表示しないか、ローディング画面を表示
        return (
            <div className="p-10 text-center text-red-600">
                <h1 className="text-2xl font-bold">アクセス拒否</h1>
                <p>このページは管理者専用です。</p>
            </div>
        );
    }

    const handleUserSelect = (user, room) => {
        setSelectedUser(user);
        // ルーム情報と、管理者のIDをチャットコンポーネントに渡す
        setChatRoom(room); 
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminUserList 
                onUserSelect={handleUserSelect} 
                selectedUser={selectedUser}
            />
            <AdminIndividualChat 
                selectedUser={selectedUser} 
                chatRoom={chatRoom} 
                adminUserId={user?.id} // ログイン中の管理者のID
            />
        </div>
    );
}