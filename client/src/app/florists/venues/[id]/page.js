'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiInfo, FiPlus, FiThumbsUp, FiArrowLeft, FiCamera, 
  FiTruck, FiCheckCircle, FiExternalLink, FiUser, FiX 
} from 'react-icons/fi';

// 簡易的な画像拡大モーダル（コンポーネントがない場合用）
const SimpleImageModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-screen w-full h-full flex items-center justify-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors">
          <FiX size={24} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Enlarged" className="max-w-full max-h-full object-contain rounded-lg" />
      </div>
    </div>
  );
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function VenueLogisticsPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [venue, setVenue] = useState(null);
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // モーダル関連
  const [modalImage, setModalImage] = useState(null);

  // 投稿フォーム
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', imageUrls: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // データ取得
  const fetchData = useCallback(async () => {
    const token = getAuthToken();
    try {
      const [venueRes, logisticsRes] = await Promise.all([
        fetch(`${API_URL}/api/venues/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
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
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'FLORIST') {
      router.push('/florists/login');
      return;
    }
    fetchData();
  }, [id, user, authLoading, router, fetchData]);

  // 画像アップロード (並行処理化)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // 枚数制限
    if (formData.imageUrls.length + files.length > 4) {
      return toast.error('画像は一度に4枚まで投稿できます');
    }

    setIsUploading(true);
    const token = getAuthToken();
    const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        return await res.json();
    });

    try {
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.url);
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      toast.success(`${files.length}枚の画像を追加しました`);
    } catch (e) {
      toast.error('画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // 投稿送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return toast.error('タイトルと詳細を入力してください');
    
    setIsSubmitting(true);
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
      
      toast.success('情報を共有しました！ご協力ありがとうございます🌸');
      setShowForm(false);
      setFormData({ title: '', description: '', imageUrls: [] });
      fetchData(); // リロード
    } catch (e) {
      toast.error('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 「役に立った」ボタン
  const handleHelpful = async (infoId) => {
    const token = getAuthToken();
    // 楽観的UI更新 (即座に反応させる)
    setLogistics(prev => prev.map(item => 
      item.id === infoId ? { ...item, helpfulCount: (item.helpfulCount || 0) + 1 } : item
    ));

    try {
        await fetch(`${API_URL}/api/logistics/${infoId}/helpful`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('「役に立った」を送りました');
    } catch (e) {
        // エラーなら戻す等の処理が必要だが今回は省略
        console.error(e);
    }
  };

  // 画像削除
  const removeImage = (index) => {
      setFormData(prev => ({
          ...prev,
          imageUrls: prev.imageUrls.filter((_, i) => i !== index)
      }));
  };

  if (loading || authLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
  }

  if (!venue) return <div className="p-10 text-center text-gray-500">会場が見つかりません</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        
        {/* ナビゲーション */}
        <div className="mb-6">
            <Link href="/florists/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                <FiArrowLeft className="mr-2"/> ダッシュボードへ戻る
            </Link>
        </div>

        {/* ヘッダーカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                <FiTruck /> 搬入情報Wiki
                             </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">{venue.venueName}</h1>
                        <p className="flex items-center text-indigo-100 text-sm">
                            <FiMapPin className="mr-2"/> {venue.address}
                        </p>
                    </div>
                    {/* Google Mapリンク */}
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.venueName + ' ' + venue.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                    >
                        <FiExternalLink /> 地図アプリで開く
                    </a>
                </div>
            </div>

            {/* 公式アクセス情報 */}
            {venue.accessInfo && (
                <div className="p-6 bg-yellow-50 border-b border-yellow-100">
                    <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-2 mb-2">
                        <FiInfo className="text-yellow-600"/> 会場からの公式アクセス情報
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {venue.accessInfo}
                    </p>
                </div>
            )}
        </div>

        {/* 投稿フォームエリア */}
        <div className="mb-8">
            {!showForm ? (
                <button 
                    onClick={() => setShowForm(true)} 
                    className="w-full py-4 bg-white border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
                >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <FiPlus size={24} />
                    </div>
                    <span>新しい搬入情報を共有する</span>
                    <span className="text-xs text-indigo-400 font-normal">駐車場、搬入口、注意点など</span>
                </button>
            ) : (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 animate-fadeIn relative">
                    <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={20}/></button>
                    
                    <h3 className="font-bold text-lg mb-1 text-gray-800">情報を共有する</h3>
                    <p className="text-xs text-gray-500 mb-6">あなたの情報が、他の花屋さんの助けになります。</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">タイトル <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                required 
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="例: 搬入口の段差について / 控え室へのルート"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">詳細情報 <span className="text-red-500">*</span></label>
                            <textarea 
                                required 
                                rows="4"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="例: 裏口のシャッターは10時に開きます。台車はスロープあり。担当者の〇〇さんに声をかけるとスムーズです。"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
                            />
                        </div>
                        
                        {/* 画像アップロード */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">写真 (任意・最大4枚)</label>
                            <div className="flex flex-wrap gap-3">
                                {formData.imageUrls.map((url, i) => (
                                    <div key={i} className="relative group w-20 h-20">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="Uploaded" className="w-full h-full object-cover rounded-lg border border-gray-200"/>
                                        <button 
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                ))}
                                
                                {formData.imageUrls.length < 4 && (
                                    <label className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {isUploading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                                        ) : (
                                            <>
                                                <FiCamera size={20} className="mb-1"/>
                                                <span className="text-[10px] font-bold">追加</span>
                                            </>
                                        )}
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading}/>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">キャンセル</button>
                            <button type="submit" disabled={isSubmitting || isUploading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:bg-gray-300 transition-all">
                                {isSubmitting ? '送信中...' : '情報を投稿する'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {/* タイムライン */}
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <FiTruck /> 共有された情報 <span className="text-gray-400 text-sm font-normal">({logistics.length}件)</span>
                </h2>
            </div>
            
            {logistics.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="bg-gray-50 p-4 rounded-full inline-block mb-3">
                        <FiTruck className="text-gray-400 text-2xl"/>
                    </div>
                    <p className="text-gray-500 font-bold">まだ情報がありません</p>
                    <p className="text-sm text-gray-400 mt-1">最初の投稿者になって、みんなを助けましょう！</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {logistics.map(info => (
                        <div key={info.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${info.isOfficial ? 'border-yellow-400 ring-4 ring-yellow-50' : 'border-gray-100'}`}>
                            
                            {/* カードヘッダー */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {info.contributor?.iconUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={info.contributor.iconUrl} alt="User" className="w-10 h-10 rounded-full border border-gray-100 object-cover"/>
                                        ) : (
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center">
                                                <FiUser />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-gray-900">{info.title}</h3>
                                            {info.isOfficial && (
                                                <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-yellow-200">
                                                    <FiCheckCircle size={10}/> 公式
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <span>{info.contributor?.platformName || '匿名ユーザー'}</span>
                                            <span>•</span>
                                            <span>{new Date(info.createdAt).toLocaleDateString('ja-JP')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 本文 */}
                            <div className="bg-slate-50 p-4 rounded-xl mb-4">
                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{info.description}</p>
                            </div>
                            
                            {/* 画像ギャラリー */}
                            {info.imageUrls && info.imageUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {info.imageUrls.map((url, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            key={i} 
                                            src={url} 
                                            alt="Logistics info"
                                            onClick={() => setModalImage(url)}
                                            className="w-24 h-24 object-cover rounded-xl border border-gray-200 hover:opacity-90 cursor-zoom-in transition-opacity"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* フッターアクション */}
                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={() => handleHelpful(info.id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                                >
                                    <FiThumbsUp className={info.helpfulCount > 0 ? "text-indigo-500" : ""}/> 
                                    <span>役に立った</span>
                                    {info.helpfulCount > 0 && <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs ml-1">{info.helpfulCount}</span>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* 簡易画像モーダル */}
        {modalImage && <SimpleImageModal src={modalImage} onClose={() => setModalImage(null)} />}
      </div>
    </div>
  );
}