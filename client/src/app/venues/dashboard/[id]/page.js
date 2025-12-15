// /venues/dashboard/[id]/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
// ★★★ useAuth, ApprovalPendingCard をインポート ★★★
import { useAuth } from '../../../contexts/AuthContext';
import ApprovalPendingCard from '@/app/components/ApprovalPendingCard';
// ★★★ --------------------------------------- ★★★

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueDashboardPage({ params }) {
  const { id } = params;
  const router = useRouter();
  // ★★★ useAuth を利用 ★★★
  const { user, loading: authLoading, logout, isPending, isApproved } = useAuth();
  // ★★★ ---------------- ★★★

  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    regulations: '',
  });
  const [loading, setLoading] = useState(true);
  
  // ★★★ データの取得ロジックを useCallback で整理 ★★★
  const fetchVenue = useCallback(async () => {
    // 審査待ち/却下の場合はAPIコールをスキップ
    if (isPending || !isApproved) {
        setLoading(false);
        return;
    }
      
    if (!user || user.id !== id || user.role !== 'VENUE') return;

    // トークン取得
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      
    try {
      // ★★★ 認証トークンを使用してAPIを叩く ★★★
      const res = await fetch(`${API_URL}/api/venues/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
        
      if (!res.ok) throw new Error('データ読み込みに失敗しました');
      const data = await res.json();
      
      Object.keys(data).forEach(key => {
        if (data[key] === null) data[key] = '';
      });
      setFormData(data);
    } catch (error) { 
      toast.error(error.message);
    } finally { 
      setLoading(false);
    }
  }, [id, user, isPending, isApproved]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'VENUE' || user.id !== id) {
        // ロール/IDチェック
        toast.error('アクセス権限がありません。');
        router.push('/venues/login');
        return;
    }
      
    fetchVenue();

  }, [authLoading, user, id, router, fetchVenue]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPending || !isApproved) {
        return toast.error('アカウントが承認されるまで更新できません。');
    }
      
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

    const promise = fetch(`${API_URL}/api/venues/profile`, { // ★★★ /api/venues/profile を使用 (ID不要) ★★★
      method: 'PATCH',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ★★★ トークンを付与 ★★★
      },
      body: JSON.stringify(formData),
    }).then(res => {
      if (!res.ok) throw new Error('更新に失敗しました。');
      return res.json();
    });

    toast.promise(promise, {
      loading: '更新中...',
      success: (data) => {
        setFormData(data);
        return '会場情報が更新されました！';
      },
      error: (err) => err.message,
    });
  };

  const handleLogout = () => {
    logout(); // AuthContextのlogoutを使用
    toast.success('ログアウトしました。');
    router.push('/venues/login');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>認証をチェック中...</p>
      </div>
    );
  }

  // ★★★ 審査待ち/却下UIの表示 ★★★
  if (isPending || !isApproved) {
      return <ApprovalPendingCard />;
  }
  // ★★★ -------------------- ★★★

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>データ読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">会場管理画面</h1>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
            ログアウト
          </button>
        </div>
        <div className="p-8 space-y-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900">{formData.venueName}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="venueName" className="block text-sm font-medium text-gray-700">会場名</label>
              <input type="text" name="venueName" id="venueName" required value={formData.venueName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">住所</label>
              <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/>
            </div>
            <div>
              <label htmlFor="regulations" className="block text-sm font-medium text-gray-700">フラスタ規定</label>
              <textarea name="regulations" id="regulations" rows="10" value={formData.regulations} onChange={handleChange} placeholder="サイズ制限、搬入・回収時間、注意事項などを入力してください" className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"></textarea>
              <p className="text-xs text-gray-500 mt-1">この内容は、ユーザーが企画作成時に会場を選択すると表示されます。</p>
            </div>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              更新する
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}