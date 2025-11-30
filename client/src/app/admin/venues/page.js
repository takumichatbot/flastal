'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FiEdit, FiTrash2, FiPlus, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- モーダルコンポーネント ---
function VenueModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    address: '',
    password: '', // 新規時のみ使用
    isStandAllowed: true,
    standRegulation: '',
    isBowlAllowed: true,
    bowlRegulation: '',
    retrievalRequired: true,
    accessInfo: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: '', // 編集時はパスワード空欄
        // nullの場合は空文字やtrue/falseの初期値にする
        standRegulation: initialData.standRegulation || '',
        bowlRegulation: initialData.bowlRegulation || '',
        accessInfo: initialData.accessInfo || '',
      });
    } else {
      // 新規作成時の初期値 (ユニークなダミーメールを自動生成しておくと楽)
      const randomId = Math.random().toString(36).slice(-5);
      setFormData({
        venueName: '',
        email: `venue_${randomId}@flastal.temp`,
        address: '',
        password: 'flastal_venue',
        isStandAllowed: true,
        standRegulation: '',
        isBowlAllowed: true,
        bowlRegulation: '',
        retrievalRequired: true,
        accessInfo: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {initialData ? '会場情報の編集' : '新しい会場の登録'}
          </h2>

          <div className="space-y-6">
            {/* 基本情報セクション */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-1">基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">会場名 <span className="text-red-500">*</span></label>
                  <input required name="venueName" value={formData.venueName} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">住所</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">管理用Email (必須・重複不可) <span className="text-red-500">*</span></label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                </div>
                {!initialData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">初期パスワード</label>
                    <input name="password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                  </div>
                )}
              </div>
            </div>

            {/* フラスタ（スタンド花）ルール */}
            <div className={`p-4 rounded-lg border ${formData.isStandAllowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">💐 フラスタ (スタンド花)</h3>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" name="isStandAllowed" checked={formData.isStandAllowed} onChange={handleChange} className="mr-2 h-5 w-5 text-green-600" />
                  <span className="text-sm font-bold">{formData.isStandAllowed ? '受入可' : '受入不可'}</span>
                </label>
              </div>
              {formData.isStandAllowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">詳細ルール (サイズ制限など)</label>
                  <textarea name="standRegulation" value={formData.standRegulation} onChange={handleChange} rows="2" className="w-full p-2 border rounded mt-1 text-sm" placeholder="例: 高さ180cm以内、底辺40cm×40cm以内。連結スタンドは不可。" />
                </div>
              )}
            </div>

            {/* 卓上フラスタ（楽屋花）ルール */}
            <div className={`p-4 rounded-lg border ${formData.isBowlAllowed ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">🎁 卓上フラスタ (楽屋花)</h3>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" name="isBowlAllowed" checked={formData.isBowlAllowed} onChange={handleChange} className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="text-sm font-bold">{formData.isBowlAllowed ? '受入可' : '受入不可'}</span>
                </label>
              </div>
              {formData.isBowlAllowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">詳細ルール</label>
                  <textarea name="bowlRegulation" value={formData.bowlRegulation} onChange={handleChange} rows="2" className="w-full p-2 border rounded mt-1 text-sm" placeholder="例: 高さ40cm以内。持ち帰り必須。" />
                </div>
              )}
            </div>

            {/* 搬入出・その他 */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-1">搬入出・アクセス</h3>
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" name="retrievalRequired" checked={formData.retrievalRequired} onChange={handleChange} className="mr-2 h-4 w-4 text-red-600" />
                <span className="text-sm font-bold text-gray-700">回収必須 (チェックで必須)</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700">搬入口・アクセス情報</label>
                <textarea name="accessInfo" value={formData.accessInfo} onChange={handleChange} rows="2" className="w-full p-2 border rounded mt-1 text-sm" placeholder="搬入口の場所や、配送業者への指示など" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">キャンセル</button>
            <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-bold rounded hover:bg-sky-600">保存する</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- メインページコンポーネント ---
export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const fetchVenues = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/admin/venues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('会場データの取得に失敗しました');
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません');
      router.push('/login');
      return;
    }
    fetchVenues();
  }, [loading, isAuthenticated, user]);

  const handleCreateOrUpdate = async (formData) => {
    const token = localStorage.getItem('authToken');
    const url = editingVenue 
      ? `${API_URL}/api/admin/venues/${editingVenue.id}`
      : `${API_URL}/api/admin/venues`;
    const method = editingVenue ? 'PATCH' : 'POST';

    const promise = fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData),
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '保存に失敗しました');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '保存中...',
      success: () => {
        setIsModalOpen(false);
        fetchVenues();
        return '保存しました！';
      },
      error: (err) => err.message
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('本当にこの会場を削除しますか？\n紐づいている企画がある場合、削除できないことがあります。')) return;
    
    const token = localStorage.getItem('authToken');
    const promise = fetch(`${API_URL}/api/admin/venues/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) throw new Error('削除に失敗しました');
    });

    toast.promise(promise, {
      loading: '削除中...',
      success: () => {
        fetchVenues();
        return '削除しました';
      },
      error: (err) => err.message
    });
  };

  const openCreateModal = () => {
    setEditingVenue(null);
    setIsModalOpen(true);
  };

  const openEditModal = (venue) => {
    setEditingVenue(venue);
    setIsModalOpen(true);
  };

  if (loading || !isAuthenticated || user?.role !== 'ADMIN') return <div className="p-8 text-center">権限確認中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">会場データベース管理</h1>
          <div className="flex gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-sky-600 self-center">← ダッシュボードへ戻る</Link>
            <button onClick={openCreateModal} className="flex items-center bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 shadow transition">
              <FiPlus className="mr-2" /> 新規会場登録
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingData ? (
            <p className="p-8 text-center text-gray-500">読み込み中...</p>
          ) : venues.length === 0 ? (
            <p className="p-8 text-center text-gray-500">登録された会場はありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase border-b">
                  <tr>
                    <th className="px-6 py-3">会場名</th>
                    <th className="px-6 py-3">住所</th>
                    <th className="px-6 py-3 text-center">フラスタ</th>
                    <th className="px-6 py-3 text-center">卓上</th>
                    <th className="px-6 py-3 text-center">回収</th>
                    <th className="px-6 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {venues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{venue.venueName}</td>
                      <td className="px-6 py-4">{venue.address || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {venue.isStandAllowed ? <FiCheckCircle className="inline text-green-500"/> : <FiXCircle className="inline text-red-500"/>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {venue.isBowlAllowed ? <FiCheckCircle className="inline text-blue-500"/> : <FiXCircle className="inline text-red-500"/>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {venue.retrievalRequired ? <span className="text-red-600 font-bold text-xs">必須</span> : <span className="text-gray-400 text-xs">任意</span>}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3">
                        <button onClick={() => openEditModal(venue)} className="text-indigo-600 hover:text-indigo-900" title="編集">
                          <FiEdit size={18} />
                        </button>
                        <button onClick={() => handleDelete(venue.id)} className="text-red-500 hover:text-red-700" title="削除">
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <VenueModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateOrUpdate} 
        initialData={editingVenue}
      />
    </div>
  );
}