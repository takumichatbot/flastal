'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiEdit, FiTrash2, FiPlus, FiCheck, FiX, 
    FiMapPin, FiSearch, FiInfo, FiTruck, FiBox, FiArrowLeft 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- モーダルコンポーネント ---
function VenueModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    address: '',
    password: '', 
    isStandAllowed: true,
    standRegulation: '',
    isBowlAllowed: true,
    bowlRegulation: '',
    retrievalRequired: true,
    accessInfo: ''
  });

  // 初期値セット
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({
                ...initialData,
                password: '', // 編集時は空欄
                standRegulation: initialData.standRegulation || '',
                bowlRegulation: initialData.bowlRegulation || '',
                accessInfo: initialData.accessInfo || '',
            });
        } else {
            // 新規時のデフォルト値
            const randomId = Math.random().toString(36).slice(-5);
            setFormData({
                venueName: '',
                email: `venue_${randomId}@flastal.temp`, // ダミーメール自動生成
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
                {initialData ? '会場情報の編集' : '新規会場の登録'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
            </button>
        </div>

        {/* フォーム本体 (スクロール可能エリア) */}
        <div className="flex-1 overflow-y-auto p-6">
            <form id="venueForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. 基本情報 */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <FiInfo /> 基本情報
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">会場名 <span className="text-red-500">*</span></label>
                        <input required name="venueName" value={formData.venueName} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="例: 東京ドーム" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">住所</label>
                        <div className="relative">
                            <FiMapPin className="absolute left-3 top-3.5 text-gray-400"/>
                            <input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="東京都..." />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">管理用Email <span className="text-red-500">*</span></label>
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                        <p className="text-xs text-gray-400 mt-1">※ システム識別用。重複不可。</p>
                    </div>
                    {!initialData && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">初期パスワード</label>
                            <input name="password" value={formData.password} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm" />
                        </div>
                    )}
                </div>
            </section>

            {/* 2. レギュレーション設定 */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <FiBox /> レギュレーション・搬入ルール
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* フラスタ設定 */}
                    <div className={`p-5 rounded-xl border-2 transition-colors ${formData.isStandAllowed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2">💐 スタンド花</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="isStandAllowed" checked={formData.isStandAllowed} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                <span className="ml-2 text-sm font-medium text-gray-700">{formData.isStandAllowed ? '受入可' : '受入不可'}</span>
                            </label>
                        </div>
                        {formData.isStandAllowed && (
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">サイズ制限・ルール</label>
                                <textarea name="standRegulation" value={formData.standRegulation} onChange={handleChange} rows="3" className="w-full p-2 border border-gray-300 rounded text-sm bg-white" placeholder="例: 高さ180cm以内、底辺40cm×40cm以内..." />
                            </div>
                        )}
                    </div>

                    {/* 楽屋花設定 */}
                    <div className={`p-5 rounded-xl border-2 transition-colors ${formData.isBowlAllowed ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2">🎁 楽屋花 (卓上)</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="isBowlAllowed" checked={formData.isBowlAllowed} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                <span className="ml-2 text-sm font-medium text-gray-700">{formData.isBowlAllowed ? '受入可' : '受入不可'}</span>
                            </label>
                        </div>
                        {formData.isBowlAllowed && (
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">サイズ制限・ルール</label>
                                <textarea name="bowlRegulation" value={formData.bowlRegulation} onChange={handleChange} rows="3" className="w-full p-2 border border-gray-300 rounded text-sm bg-white" placeholder="例: 高さ40cm以内。持ち帰り必須。" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 3. 物流・アクセス */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <FiTruck /> 物流・アクセス要件
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="retrievalRequired" checked={formData.retrievalRequired} onChange={handleChange} className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                            <span className="ml-2 font-bold text-gray-800">回収必須 (スタンド花)</span>
                        </label>
                        <p className="text-xs text-yellow-700 flex-1">
                            ※「必須」にすると、花屋に対して回収注文を強制します。会場側で処分できない場合はチェックしてください。
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">搬入口・配送業者への指示</label>
                        <textarea name="accessInfo" value={formData.accessInfo} onChange={handleChange} rows="2" className="w-full p-3 border border-gray-300 rounded-lg text-sm" placeholder="関係者入り口から搬入してください。到着時にお電話ください等。" />
                    </div>
                </div>
            </section>

            </form>
        </div>

        {/* フッターアクション */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                キャンセル
            </button>
            <button type="submit" form="venueForm" className="px-8 py-2.5 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 shadow-lg hover:shadow-sky-500/30 transition-all">
                {initialData ? '更新を保存' : '会場を登録'}
            </button>
        </div>
      </div>
    </div>
  );
}

// --- メインページ ---
export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  
  // フィルター用
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // データ取得
  const fetchVenues = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/admin/venues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('データ取得エラー');
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('会場リストの読み込みに失敗しました');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      toast.error('管理者権限が必要です');
      router.push('/login');
      return;
    }
    fetchVenues();
  }, [loading, isAuthenticated, user]);

  // 更新・作成
  const handleCreateOrUpdate = async (formData) => {
    const token = localStorage.getItem('authToken');
    const url = editingVenue 
      ? `${API_URL}/api/admin/venues/${editingVenue.id}`
      : `${API_URL}/api/admin/venues`;
    const method = editingVenue ? 'PATCH' : 'POST';
    
    // パスワードが空なら送信しない（編集時）
    const bodyData = { ...formData };
    if (editingVenue && !bodyData.password) delete bodyData.password;

    const promise = fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(bodyData),
    }).then(async res => {
      if (!res.ok) throw new Error('保存エラー');
      return res.json();
    });

    toast.promise(promise, {
      loading: '保存中...',
      success: () => {
        setIsModalOpen(false);
        fetchVenues();
        return '完了しました';
      },
      error: '保存に失敗しました'
    });
  };

  // 削除
  const handleDelete = async (id) => {
    if (!window.confirm('この会場を削除しますか？')) return;
    
    const token = localStorage.getItem('authToken');
    const promise = fetch(`${API_URL}/api/admin/venues/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => { if (!res.ok) throw new Error('削除エラー'); });

    toast.promise(promise, {
      loading: '削除中...',
      success: () => {
        setVenues(prev => prev.filter(v => v.id !== id));
        return '削除しました';
      },
      error: '削除できませんでした'
    });
  };

  // フィルタリング処理
  const filteredVenues = useMemo(() => {
    if (!searchTerm) return venues;
    const lower = searchTerm.toLowerCase();
    return venues.filter(v => 
        v.venueName.toLowerCase().includes(lower) || 
        (v.address && v.address.toLowerCase().includes(lower))
    );
  }, [venues, searchTerm]);

  const openCreateModal = () => { setEditingVenue(null); setIsModalOpen(true); };
  const openEditModal = (venue) => { setEditingVenue(venue); setIsModalOpen(true); };

  if (loading || !isAuthenticated) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        
        {/* ヘッダーエリア */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <Link href="/admin" className="text-sm text-gray-500 hover:text-sky-600 flex items-center mb-1 transition-colors">
                    <FiArrowLeft className="mr-1"/> ダッシュボードに戻る
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FiMapPin className="text-sky-500"/> 会場データベース管理
                </h1>
            </div>
            <button onClick={openCreateModal} className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl hover:bg-sky-700 shadow-lg hover:shadow-sky-500/30 transition-all font-bold">
              <FiPlus size={20} /> 新規会場登録
            </button>
        </div>

        {/* 検索・コントロールバー */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="会場名、住所で検索..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
            </div>
            <div className="text-sm text-gray-500 ml-auto">
                登録数: <strong>{filteredVenues.length}</strong> 件
            </div>
        </div>

        {/* リストテーブル */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
          {loadingData ? (
            <div className="flex justify-center py-20 text-gray-400">読み込み中...</div>
          ) : filteredVenues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FiMapPin size={40} className="mb-3 text-gray-200" />
                <p>会場が見つかりません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">会場名 / 住所</th>
                    <th className="px-6 py-4 text-center">フラスタ</th>
                    <th className="px-6 py-4 text-center">楽屋花</th>
                    <th className="px-6 py-4 text-center">回収</th>
                    <th className="px-6 py-4 text-center">アクセス情報</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVenues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-sky-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-base">{venue.venueName}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <FiMapPin size={10} /> {venue.address || '住所未登録'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {venue.isStandAllowed 
                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">OK</span> 
                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">NG</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center">
                        {venue.isBowlAllowed 
                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">OK</span> 
                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">NG</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center">
                        {venue.retrievalRequired 
                            ? <span className="text-red-600 font-bold text-xs flex items-center justify-center gap-1"><FiTruck/> 必須</span> 
                            : <span className="text-gray-400 text-xs">任意</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center">
                          {venue.accessInfo 
                            ? <span className="text-gray-800 text-xs" title={venue.accessInfo}><FiInfo className="inline mr-1 text-sky-500"/>あり</span>
                            : <span className="text-gray-300 text-xs">-</span>
                          }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(venue)} className="p-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm" title="編集">
                                <FiEdit />
                            </button>
                            <button onClick={() => handleDelete(venue.id)} className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm" title="削除">
                                <FiTrash2 />
                            </button>
                        </div>
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