'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- 会場選択・登録モーダル ---
function VenueSelectionModal({ onClose, onSelect }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('select');
  const { user } = useAuth();

  const [newVenue, setNewVenue] = useState({ venueName: '', address: '', regulations: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (res.ok) {
          const data = await res.json();
          setVenues(data);
        }
      } catch (e) {
        console.error(e);
        toast.error('会場リストの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/venues/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newVenue, userId: user.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '登録失敗');
      }

      const createdVenue = await res.json();
      toast.success('会場を登録しました！');
      onSelect(`${createdVenue.venueName} (${createdVenue.address || ''})`);
      onClose();

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            {mode === 'select' ? '会場を選択' : '新しい会場を登録'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          {mode === 'select' ? (
            <>
              <div className="mb-4 flex justify-end">
                <button 
                  onClick={() => setMode('create')}
                  className="text-sm text-green-600 hover:underline font-semibold flex items-center"
                >
                  <span className="text-xl mr-1">+</span> リストにない会場を登録する
                </button>
              </div>
              
              {loading ? (
                <p className="text-center text-gray-500">読み込み中...</p>
              ) : venues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>登録されている会場がありません。</p>
                  <button onClick={() => setMode('create')} className="mt-2 text-green-600 underline">最初の会場を登録する</button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {venues.map(venue => (
                    <button
                      key={venue.id}
                      onClick={() => {
                        onSelect(`${venue.venueName} (${venue.address || ''})`);
                        onClose();
                      }}
                      className="text-left p-3 border rounded-lg hover:bg-green-50 transition-colors group"
                    >
                      <div className="font-bold text-gray-800 group-hover:text-green-700">{venue.venueName}</div>
                      <div className="text-xs text-gray-500">{venue.address}</div>
                      {venue.regulations && <div className="text-xs text-blue-500 mt-1">※規定情報あり</div>}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateVenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">会場名 <span className="text-red-500">*</span></label>
                <input 
                  type="text" required 
                  value={newVenue.venueName} 
                  onChange={e => setNewVenue({...newVenue, venueName: e.target.value})}
                  className="w-full p-2 border rounded-md text-gray-900"
                  placeholder="例：東京ドーム"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">住所</label>
                <input 
                  type="text" 
                  value={newVenue.address} 
                  onChange={e => setNewVenue({...newVenue, address: e.target.value})}
                  className="w-full p-2 border rounded-md text-gray-900"
                  placeholder="例：東京都文京区後楽1-3-61"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">フラスタ規定・搬入情報</label>
                <textarea 
                  rows="4"
                  value={newVenue.regulations} 
                  onChange={e => setNewVenue({...newVenue, regulations: e.target.value})}
                  className="w-full p-2 border rounded-md text-gray-900"
                  placeholder="サイズ規定や搬入時間などの情報を共有してください。"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setMode('select')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">キャンセル</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
                  {isSubmitting ? '登録中...' : '登録して選択'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    deliveryAddress: '',
    deliveryDateTime: '',
    imageUrl: '',
    designDetails: '',
    size: '',
    flowerTypes: '',
    visibility: 'PUBLIC',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('企画を作成するにはログインが必要です。');
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('画像をアップロード中...');
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      if (!res.ok) throw new Error('アップロードに失敗しました');
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('画像をアップロードしました！', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          plannerId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '作成に失敗しました');

      toast.success('企画を作成しました！審査をお待ちください。');
      router.push('/mypage'); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>;
  }

  return (
    <div className="bg-sky-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">新しい企画を立てる</h1>
        <p className="text-gray-600 text-center mb-8">あなたの想いを形にする第一歩です。</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">企画タイトル <span className="text-red-500">*</span></label>
            <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className="input-field" placeholder="例：○○さん出演祝いフラスタ企画"/>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">企画の詳しい説明 <span className="text-red-500">*</span></label>
            <textarea name="description" id="description" required value={formData.description} onChange={handleChange} rows="6" className="input-field" placeholder="企画の趣旨や想いを書きましょう。"></textarea>
          </div>

          {/* お届け情報（会場選択） */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <div className="flex justify-between items-end mb-1">
                <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700">お届け先 (会場名・住所) <span className="text-red-500">*</span></label>
                <button 
                  type="button" 
                  onClick={() => setIsVenueModalOpen(true)}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 font-semibold transition-colors"
                >
                  🏢 会場リストから選択・登録
                </button>
             </div>
             <input 
               type="text" name="deliveryAddress" id="deliveryAddress" required 
               value={formData.deliveryAddress} onChange={handleChange} 
               className="input-field" placeholder="例：東京ドーム (東京都文京区後楽1-3-61)"
             />
             
             <label htmlFor="deliveryDateTime" className="block text-sm font-medium text-gray-700 mt-4">納品希望日時 <span className="text-red-500">*</span></label>
             <input type="datetime-local" name="deliveryDateTime" id="deliveryDateTime" required value={formData.deliveryDateTime} onChange={handleChange} className="input-field" />
          </div>

          {/* 目標金額 */}
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700">目標金額 (pt) <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
                {/* ★★★ 修正箇所: !pl-10 を追加し、左パディングを強制 ★★★ */}
                <input 
                  type="number" name="targetAmount" id="targetAmount" required 
                  value={formData.targetAmount} onChange={handleChange} 
                  className="input-field !pl-10" 
                  placeholder="30000"
                />
                {/* ★★★ 修正箇所: 円マークを上下中央揃えに変更 ★★★ */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            </div>
          </div>

          {/* 画像 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">メイン画像 (イメージ)</label>
            {formData.imageUrl && <img src={formData.imageUrl} alt="プレビュー" className="w-full h-48 object-cover rounded-md my-2" />}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"/>
            {isUploading && <p className="text-sm text-blue-500 mt-1">アップロード中...</p>}
          </div>

          {/* デザイン詳細（任意） */}
          <div className="border-t pt-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">デザイン・お花の希望 (任意)</h3>
             <div className="space-y-4">
                <div>
                    <label htmlFor="designDetails" className="block text-sm font-medium text-gray-700">デザインの雰囲気</label>
                    <textarea name="designDetails" id="designDetails" value={formData.designDetails} onChange={handleChange} rows="2" className="input-field" placeholder="例：青色をベースに、クールな感じで"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-700">希望サイズ</label>
                        <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} className="input-field" placeholder="例：高さ180cm程度"/>
                    </div>
                    <div>
                        <label htmlFor="flowerTypes" className="block text-sm font-medium text-gray-700">使いたいお花</label>
                        <input type="text" name="flowerTypes" id="flowerTypes" value={formData.flowerTypes} onChange={handleChange} className="input-field" placeholder="例：青いバラ、ユリ"/>
                    </div>
                </div>
             </div>
          </div>
          
          {/* 送信ボタン */}
          <div className="pt-6">
            <button type="submit" disabled={isSubmitting || isUploading} className="w-full px-4 py-3 font-bold text-white bg-sky-500 rounded-lg hover:bg-sky-600 shadow-lg transition-all transform hover:scale-[1.01] disabled:bg-gray-400 disabled:transform-none">
              {isSubmitting ? '作成中...' : '企画を作成して審査へ'}
            </button>
          </div>
        </form>
      </div>

      {isVenueModalOpen && (
        <VenueSelectionModal 
            onClose={() => setIsVenueModalOpen(false)} 
            onSelect={(address) => setFormData(prev => ({ ...prev, deliveryAddress: address }))}
        />
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          margin-top: 4px;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #111827;
          background-color: #f9fafb;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          border-color: #0ea5e9;
          outline: none;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
}