'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext'; // パス調整
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiMapPin, FiInfo, FiPlus, FiThumbsUp, FiArrowLeft, FiCamera } from 'react-icons/fi';
import ImageModal from '../../../components/ImageModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function VenueLogisticsPage() {
  const { id } = useParams(); // venueId
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [venue, setVenue] = useState(null);
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');

  // 投稿フォーム用ステート
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', imageUrls: [] });
  const [isUploading, setIsUploading] = useState(false);

  // データ取得
  const fetchData = async () => {
    const token = getAuthToken();
    try {
      const [venueRes, logisticsRes] = await Promise.all([
        fetch(`${API_URL}/api/venues/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }), // 既存の公開APIだと住所等が取れる
        fetch(`${API_URL}/api/venues/${id}/logistics`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (venueRes.ok) setVenue(await venueRes.json());
      if (logisticsRes.ok) setLogistics(await logisticsRes.json());
    } catch (error) {
      console.error(error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // fetchDataをuseCallbackで囲むのがベストですが、今回は依存配列に追加するだけで対処
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'FLORIST') {
      router.push('/florists/login');
      return;
    }
    fetchData();
  }, [id, user, authLoading, router]); // routerを追加 (fetchDataは関数定義ごとuseEffect内に入れるか、useCallback化推奨だが、一旦警告消しのために外すか無視設定にするのが早道)

  // 画像アップロード
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    const token = getAuthToken();
    const urls = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.url);
        }
      }
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      toast.success('画像をアップロードしました');
    } catch (e) {
      toast.error('アップロード失敗');
    } finally {
      setIsUploading(false);
    }
  };

  // 投稿送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/venues/${id}/logistics`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('投稿失敗');
      
      toast.success('搬入情報を共有しました！ありがとうございます！');
      setShowForm(false);
      setFormData({ title: '', description: '', imageUrls: [] });
      fetchData(); // リロード
    } catch (e) {
      toast.error('投稿に失敗しました');
    }
  };

  // 「役に立った」ボタン
  const handleHelpful = async (infoId) => {
    const token = getAuthToken();
    try {
        await fetch(`${API_URL}/api/logistics/${infoId}/helpful`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('「役に立った」を送りました！');
        fetchData(); // リロードしてカウント更新
    } catch (e) {}
  };

  if (loading) return <div className="p-10 text-center">読み込み中...</div>;
  if (!venue) return <div className="p-10 text-center">会場が見つかりません</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/florists/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center mb-4">
            <FiArrowLeft className="mr-2"/> ダッシュボードへ戻る
        </Link>

        {/* ヘッダー */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded mr-3">搬入Wiki</span>
                {venue.venueName}
            </h1>
            <div className="flex items-center text-gray-600 text-sm">
                <FiMapPin className="mr-2"/> {venue.address}
            </div>
            {venue.accessInfo && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                    <strong>📍 公式アクセス情報:</strong><br/>
                    {venue.accessInfo}
                </div>
            )}
        </div>

        {/* 投稿フォームトグル */}
        <div className="mb-6">
            {!showForm ? (
                <button 
                    onClick={() => setShowForm(true)} 
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md flex items-center justify-center transition-all"
                >
                    <FiPlus className="mr-2"/> 新しい搬入情報を共有する
                </button>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200 animate-fadeIn">
                    <h3 className="font-bold text-lg mb-4 text-indigo-900">情報を共有する</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">タイトル</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="例: 搬入口の段差について / 控え室へのルート"
                                className="w-full p-2 border rounded mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">詳細情報</label>
                            <textarea 
                                required 
                                rows="3"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="例: 裏口のシャッターは10時に開きます。台車はスロープあり。"
                                className="w-full p-2 border rounded mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">写真 (任意)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.imageUrls.map((url, i) => (
                                    <img key={i} src={url} className="w-20 h-20 object-cover rounded border"/>
                                ))}
                                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                                    <FiCamera className="text-gray-400"/>
                                    <span className="text-[10px] text-gray-500">{isUploading ? '...' : '追加'}</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading}/>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">キャンセル</button>
                            <button type="submit" disabled={isUploading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700">投稿する</button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {/* 情報一覧 */}
        <div className="space-y-6">
            <h2 className="font-bold text-gray-800 text-lg border-b pb-2">共有された情報 ({logistics.length})</h2>
            
            {logistics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">まだ情報がありません。最初の投稿者になりましょう！</p>
            ) : (
                logistics.map(info => (
                    <div key={info.id} className={`bg-white p-6 rounded-xl shadow-sm border ${info.isOfficial ? 'border-yellow-400 ring-1 ring-yellow-100' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                {info.isOfficial && <span className="bg-yellow-400 text-white text-[10px] px-2 py-0.5 rounded font-bold">OFFICIAL</span>}
                                <h3 className="font-bold text-lg text-gray-900">{info.title}</h3>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(info.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <p className="text-gray-700 whitespace-pre-wrap mb-4 text-sm leading-relaxed">{info.description}</p>
                        
                        {info.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {info.imageUrls.map((url, i) => (
                                    <img 
                                        key={i} 
                                        src={url} 
                                        onClick={() => { setModalImage(url); setIsModalOpen(true); }}
                                        className="w-24 h-24 object-cover rounded-lg border hover:opacity-90 cursor-pointer"
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                {info.contributor.iconUrl ? <img src={info.contributor.iconUrl} className="w-6 h-6 rounded-full"/> : <div className="w-6 h-6 bg-gray-200 rounded-full"></div>}
                                <span className="text-xs text-gray-500">by {info.contributor.platformName}</span>
                            </div>
                            <button 
                                onClick={() => handleHelpful(info.id)}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                            >
                                <FiThumbsUp/> 役に立った ({info.helpfulCount})
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {isModalOpen && <ImageModal src={modalImage} onClose={() => setIsModalOpen(false)} />}
      </div>
    </div>
  );
}