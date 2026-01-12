'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2, FiImage } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueSettingsPage() {
  const { user, isAuthenticated, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    isStandAllowed: true,
    isBowlAllowed: true,
    standRegulation: '',
    bowlRegulation: '',
    retrievalRequired: true,
    imageUrls: [] // 複数画像用の配列
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'VENUE') return;
    
    // 自分の会場情報を取得
    fetch(`${API_URL}/api/venues/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          ...data,
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : []
        });
      })
      .catch(() => toast.error('情報の読み込みに失敗しました'));
  }, [user, isAuthenticated]);

  // 画像URLを追加する
  const addImageUrl = () => {
    setFormData({
      ...formData,
      imageUrls: [...formData.imageUrls, ""]
    });
  };

  // 画像URLを更新する
  const updateImageUrl = (index, value) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData({ ...formData, imageUrls: newUrls });
  };

  // 画像を削除する
  const removeImageUrl = (index) => {
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newUrls });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(`${API_URL}/api/venues/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('設定を保存しました');
        router.push('/venues/dashboard');
      }
    } catch (error) {
      toast.error('保存に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/venues/dashboard" className="flex items-center text-sm font-bold text-slate-500 mb-6 hover:text-indigo-600 transition-colors">
          <FiArrowLeft className="mr-2"/> ダッシュボードに戻る
        </Link>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-2xl font-black text-slate-800">会場設定・レギュレーション</h1>
            <p className="text-sm text-slate-500 mt-2">ファンやお花屋さんが参照する公式ルールと会場写真を設定します。</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* 基本レギュレーション */}
            <section className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FiCheckCircle className="text-indigo-500"/> 基本受入設定
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <label className="flex items-center p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={formData.isStandAllowed} onChange={(e) => setFormData({...formData, isStandAllowed: e.target.checked})} className="w-5 h-5 mr-3 text-indigo-600 rounded" />
                  <span className="font-bold text-slate-700">スタンド花 受入許可</span>
                </label>
                <label className="flex items-center p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={formData.isBowlAllowed} onChange={(e) => setFormData({...formData, isBowlAllowed: e.target.checked})} className="w-5 h-5 mr-3 text-indigo-600 rounded" />
                  <span className="font-bold text-slate-700">楽屋花 受入許可</span>
                </label>
              </div>
            </section>

            {/* 詳細テキスト */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">スタンド花の規定 (サイズ・時間など)</label>
                <textarea value={formData.standRegulation} onChange={(e) => setFormData({...formData, standRegulation: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500" placeholder="例: 高さ180cmまで、当日10時〜12時着指定" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">回収ルール</label>
                <select value={formData.retrievalRequired} onChange={(e) => setFormData({...formData, retrievalRequired: e.target.value === 'true'})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="true">回収必須 (お花屋さんが持ち帰る)</option>
                  <option value="false">会場側で処分可能</option>
                </select>
              </div>
            </div>

            {/* 会場画像管理エリア (複数枚対応) */}
            <section className="space-y-4 pt-6 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FiImage className="text-indigo-500"/> 会場写真 (複数登録可能)
              </h2>
              <p className="text-xs text-slate-500">会場の外観、ロビー、過去の設置例などの画像URLを入力してください。</p>
              
              <div className="space-y-3">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <input 
                        type="url" 
                        value={url} 
                        onChange={(e) => updateImageUrl(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <FiTrash2 size={20}/>
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                type="button" 
                onClick={addImageUrl}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 transition-colors"
              >
                <FiPlus /> 写真を追加する
              </button>

              {/* 簡易プレビュー */}
              {formData.imageUrls.some(url => url) && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {formData.imageUrls.map((url, index) => url && (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={url} alt={`Preview ${index}`} className="object-cover w-full h-full" onError={(e) => e.target.style.display='none'} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
              <FiSave /> 設定を保存する
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}