'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FiSearch, FiEye, FiCheckCircle, FiXCircle, FiClock, FiUser, FiMapPin, FiGlobe, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- 詳細確認モーダルコンポーネント ---
function FloristDetailModal({ florist, onClose, onAction, isProcessing }) {
  if (!florist) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs uppercase">Florist</span>
            申請内容の詳細
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <FiX size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">活動名 (ユーザー公開)</label>
              <p className="font-bold text-lg text-gray-900">{florist.platformName || '未設定'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">店舗名/屋号</label>
              <p className="font-medium text-gray-700">{florist.shopName || '未設定'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">担当者名</label>
              <p className="font-medium text-gray-700">{florist.contactName || '未設定'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">メールアドレス</label>
              <p className="font-medium text-gray-700">{florist.email}</p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 詳細情報 */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                <FiMapPin /> 住所・所在地
              </label>
              <p className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mt-1">
                {florist.address || '未入力'}
              </p>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                <FiGlobe /> ポートフォリオ / 参考URL
              </label>
              {florist.portfolio ? (
                <a href={florist.portfolio} target="_blank" rel="noreferrer" className="text-pink-600 underline text-sm block mt-1 hover:text-pink-800">
                  {florist.portfolio}
                </a>
              ) : (
                <p className="text-sm text-gray-400 mt-1">なし</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">自己紹介・アピール</label>
              <p className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {florist.bio || '未入力'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button
            onClick={() => onAction(florist.id, 'REJECTED')}
            disabled={isProcessing}
            className="flex-1 bg-white border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiXCircle /> 却下する
          </button>
          <button
            onClick={() => onAction(florist.id, 'APPROVED')}
            disabled={isProcessing}
            className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiCheckCircle /> 承認する
          </button>
        </div>
      </div>
    </div>
  );
}

// --- メインページ ---
export default function AdminFloristApprovalsPage() {
  const [florists, setFlorists] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlorist, setSelectedFlorist] = useState(null); // モーダル用
  const [isProcessing, setIsProcessing] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // データ取得
  const fetchPendingFlorists = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/admin/florists/pending`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) throw new Error('管理者権限がありません。');
      if (!res.ok) throw new Error('リストの取得に失敗しました。');
      
      const data = await res.json();
      setFlorists(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
      setFlorists([]);
    } finally {
      setLoadingData(false);
    }
  };

  // 認証チェック & 初期ロード
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません。');
      router.push('/mypage');
      return;
    }
    fetchPendingFlorists();
  }, [isAuthenticated, user, router, loading]);

  // ステータス更新処理
  const handleUpdateStatus = async (floristId, status) => {
    // 確認ダイアログはモーダル側のアクションで代替するため削除、または最終確認として残す
    const actionText = status === 'APPROVED' ? '承認' : '却下';
    if (!window.confirm(`${actionText}してもよろしいですか？`)) return;
    
    setIsProcessing(true);
    const toastId = toast.loading('処理中...');
    
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/admin/florists/${floristId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '処理に失敗しました');
      }

      toast.success(`申請を${actionText}しました`, { id: toastId });
      setFlorists(prev => prev.filter(f => f.id !== floristId)); // リストから削除
      setSelectedFlorist(null); // モーダル閉じる

    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // 検索フィルタリング
  const filteredFlorists = useMemo(() => {
    if (!searchTerm) return florists;
    const lowerTerm = searchTerm.toLowerCase();
    return florists.filter(f => 
      (f.platformName && f.platformName.toLowerCase().includes(lowerTerm)) ||
      (f.email && f.email.toLowerCase().includes(lowerTerm)) ||
      (f.contactName && f.contactName.toLowerCase().includes(lowerTerm))
    );
  }, [florists, searchTerm]);

  // ロード中表示
  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <FiCheckCircle className="text-pink-500"/> お花屋さん 登録審査
            </h1>
            <p className="text-sm text-gray-500 mt-1">新規登録申請の確認と承認を行います。</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              管理者: {user.name || user.email}
            </span>
            <button 
              onClick={() => { logout(); router.push('/login'); }} 
              className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors underline"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* タブナビゲーション (簡易版) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8 inline-flex flex-wrap gap-1">
          {[
            { name: 'ダッシュボード', path: '/admin' },
            { name: '出金管理', path: '/admin/payouts' },
            { name: 'チャット監視', path: '/admin/moderation' },
            { name: '花屋審査', path: '/admin/florist-approval', active: true },
            { name: '企画審査', path: '/admin/project-approval' },
          ].map((nav) => (
            <Link 
              key={nav.path}
              href={nav.path}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${nav.active 
                  ? 'bg-pink-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              {nav.name}
            </Link>
          ))}
        </div>

        {/* メインコンテンツエリア */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            
            {/* コントロールバー */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <h2 className="font-bold text-lg flex items-center gap-2">
                審査待ちリスト 
                <span className="bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">{filteredFlorists.length}件</span>
              </h2>
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="名前やメールで検索..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                />
              </div>
            </div>

            {/* リスト表示 */}
            <div className="p-6">
                {loadingData ? (
                  <div className="flex justify-center py-10 text-gray-400">読み込み中...</div>
                ) : filteredFlorists.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <FiCheckCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">現在、審査待ちの申請はありません。</p>
                    <p className="text-xs text-gray-400 mt-1">すべて処理済みです。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFlorists.map(florist => (
                      <div key={florist.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                    <FiClock /> 審査中
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(florist.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1" title={florist.platformName}>
                                {florist.platformName || '名称未設定'}
                            </h3>
                            <div className="text-xs text-gray-500 space-y-1 mb-4">
                                <p className="flex items-center gap-1"><FiUser className="shrink-0"/> {florist.contactName}</p>
                                <p className="truncate" title={florist.email}>{florist.email}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedFlorist(florist)}
                            className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group-hover:bg-pink-600"
                        >
                            <FiEye /> 詳細を確認・審査
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      <FloristDetailModal 
        florist={selectedFlorist} 
        onClose={() => setSelectedFlorist(null)} 
        onAction={handleUpdateStatus}
        isProcessing={isProcessing}
      />
    </div>
  );
}