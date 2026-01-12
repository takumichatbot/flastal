'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiMapPin, FiCheckCircle, FiUpload, FiX, FiImage, FiPlus } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { authenticatedFetch } = useAuth();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    accessInfo: '',
    isStandAllowed: true,
    isBowlAllowed: true,
    retrievalRequired: true,
    imageUrls: []
  });

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/venues/${id}`);
        if (!response.ok) throw new Error('データ取得失敗');
        const data = await response.json();
        setFormData({
          venueName: data.venueName || '',
          address: data.address || '',
          accessInfo: data.accessInfo || '',
          isStandAllowed: data.isStandAllowed ?? true,
          isBowlAllowed: data.isBowlAllowed ?? true,
          retrievalRequired: data.retrievalRequired ?? true,
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : []
        });
      } catch (error) {
        toast.error('会場情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVenueData();
  }, [id]);

  // 画像アップロード処理 (Cloudinary等のサーバーサイドAPIを介す想定)
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const toastId = toast.loading('画像をアップロード中...');

    try {
      const uploadPromises = files.map(async (file) => {
        const fileFormData = new FormData();
        fileFormData.append('image', file);

        const res = await authenticatedFetch(`${API_URL}/api/tools/upload-image`, {
          method: 'POST',
          body: fileFormData,
          // FormDataの場合はContent-Typeを指定しない（ブラウザが自動設定する）
        });

        if (!res.ok) throw new Error('アップロード失敗');
        const data = await res.json();
        return data.url;
      });

      const newUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...newUrls]
      }));
      toast.success('画像をアップロードしました', { id: toastId });
    } catch (error) {
      toast.error('画像のアップロードに失敗しました', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authenticatedFetch(`${API_URL}/api/venues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || '更新に失敗しました');
      }

      toast.success('会場情報を更新しました！');
      router.push(`/venues/dashboard/${id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <Link href={`/venues/dashboard/${id}`} className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold transition">
          <FiArrowLeft className="mr-2" /> ダッシュボードへ戻る
        </Link>

        <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white">
            <h1 className="text-2xl font-black">会場情報の編集</h1>
            <p className="text-indigo-100 text-sm mt-1">写真やレギュレーションを最新に保ちましょう</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* 会場名・住所 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">会場名</label>
                <input
                  type="text"
                  required
                  value={formData.venueName}
                  onChange={(e) => setFormData({...formData, venueName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">住所</label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* 画像アップロードセクション */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FiImage className="text-indigo-500" /> 会場写真
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={url} alt={`Venue ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1.5 bg-white/90 text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
                
                {/* アップロードボタン */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all"
                >
                  <FiPlus size={24} />
                  <span className="text-xs font-bold">写真を追加</span>
                </button>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
                multiple 
              />
            </div>

            {/* 補足情報 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">搬入・受取に関する補足情報</label>
              <textarea
                rows="4"
                value={formData.accessInfo}
                onChange={(e) => setFormData({...formData, accessInfo: e.target.value})}
                placeholder="例：搬入口は建物北側です。回収は翌日午前中までにお願いします。"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              ></textarea>
            </div>

            {/* レギュレーションチェック */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                   スタンド花の受入
                </span>
                <input
                  type="checkbox"
                  checked={formData.isStandAllowed}
                  onChange={(e) => setFormData({...formData, isStandAllowed: e.target.checked})}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700">楽屋花（籠花）の受入</span>
                <input
                  type="checkbox"
                  checked={formData.isBowlAllowed}
                  onChange={(e) => setFormData({...formData, isBowlAllowed: e.target.checked})}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              disabled={saving || uploading}
              className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 ${(saving || uploading) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving ? '保存中...' : <><FiSave /> 設定を保存する</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}