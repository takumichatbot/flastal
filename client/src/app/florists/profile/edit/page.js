'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiSave, FiCamera, FiArrowLeft, FiZap } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STYLE_TAGS = [
  'かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン',
  'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'ニュアンスカラー',
  'バルーン装飾', 'ペーパーフラワー', '布・リボン装飾', 'キャラクター/モチーフ',
  '大型/連結', '卓上/楽屋花', 'リーズナブル'
];

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function FloristProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm();
  
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'FLORIST') {
      router.push('/florists/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_URL}/api/florists/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const f = data.florist;
          
          setValue('shopName', f.shopName);
          setValue('platformName', f.platformName);
          setValue('contactName', f.contactName);
          setValue('address', f.address || '');
          setValue('phoneNumber', f.phoneNumber || '');
          setValue('website', f.website || '');
          setValue('portfolio', f.portfolio || '');
          
          // ★★★ お急ぎ便設定の読み込み ★★★
          setValue('acceptsRushOrders', f.acceptsRushOrders || false);
          
          setSelectedTags(f.specialties || []);
          setPortfolioImages(f.portfolioImages || []);
        }
      } catch (error) {
        console.error(error);
        toast.error('プロフィールの読み込みに失敗しました');
      } finally {
        setLoadingData(false);
      }
    };
    fetchProfile();
  }, [user, authLoading, router, setValue]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    const token = getAuthToken();
    const uploadedUrls = [];

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
          uploadedUrls.push(data.url);
        }
      }
      setPortfolioImages(prev => [...prev, ...uploadedUrls]);
      toast.success('画像を追加しました');
    } catch (error) {
      toast.error('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/florists/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          specialties: selectedTags,
          portfolioImages: portfolioImages
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      toast.success('プロフィールを更新しました！');
      router.push('/florists/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || loadingData) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">プロフィール編集</h1>
            <Link href="/florists/dashboard" className="text-sm text-gray-500 hover:text-pink-600 flex items-center">
              <FiArrowLeft className="mr-1"/> ダッシュボードへ戻る
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <section>
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">基本情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">店舗名 (非公開)</label>
                  <input type="text" {...register('shopName')} className="mt-1 w-full p-2 border rounded bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">活動名 (公開用) <span className="text-red-500">*</span></label>
                  <input type="text" {...register('platformName', {required: true})} className="mt-1 w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">担当者名</label>
                  <input type="text" {...register('contactName')} className="mt-1 w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">電話番号</label>
                  <input type="text" {...register('phoneNumber')} className="mt-1 w-full p-2 border rounded" />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700">住所</label>
                   <input type="text" {...register('address')} className="mt-1 w-full p-2 border rounded" />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700">ウェブサイト / SNS</label>
                   <input type="text" {...register('website')} className="mt-1 w-full p-2 border rounded" placeholder="https://..." />
                </div>
              </div>
            </section>

            {/* ★★★ お急ぎ便 設定 ★★★ */}
            <section className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-yellow-200 rounded-full text-yellow-800">
                        <FiZap size={20}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">お急ぎ便 (Rush Order) 対応</h3>
                        <p className="text-sm text-gray-600 mb-2">直前の依頼も受け付けますか？ オンにすると検索で目立つようになります。</p>
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="acceptsRushOrders" 
                                {...register('acceptsRushOrders')} 
                                className="h-5 w-5 text-yellow-600 rounded cursor-pointer"
                            />
                            <label htmlFor="acceptsRushOrders" className="ml-2 font-semibold text-gray-800 cursor-pointer">
                                お急ぎ対応を受け付ける
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">得意なスタイル・特徴</h2>
              <div className="flex flex-wrap gap-2">
                {STYLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag) 
                        ? 'bg-pink-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">ポートフォリオ</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                {portfolioImages.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={url} alt="portfolio" className="w-full h-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setPortfolioImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <FiCamera className="w-8 h-8 text-gray-400"/>
                  <span className="text-xs text-gray-500 mt-1">{isUploading ? '...' : '追加'}</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                </label>
              </div>
            </section>
            
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介・アピールポイント</label>
              <textarea {...register('portfolio')} rows="5" className="w-full p-3 border rounded-lg" placeholder="お花のこだわりや、対応可能な範囲などを記載してください。"></textarea>
            </section>

            <div className="pt-4 border-t flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="flex items-center px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition-transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none"
              >
                <FiSave className="mr-2"/> 保存する
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}