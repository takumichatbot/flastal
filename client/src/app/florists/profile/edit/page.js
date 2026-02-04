'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  FiSave, FiCamera, FiArrowLeft, FiZap, FiCheck, FiMapPin, 
  FiPhone, FiGlobe, FiUser, FiImage, FiTrash2, FiLoader 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STYLE_TAGS = [
  'かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン',
  'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'ニュアンスカラー',
  'バルーン装飾', 'ペーパーフラワー', '布・リボン装飾', 'キャラクター/モチーフ',
  '大型/連結', '卓上/楽屋花', 'リーズナブル'
];

export default function FloristProfileEditPage() {
  const { user, isLoading: authLoading, authenticatedFetch, logout } = useAuth();
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors, isSubmitting } 
  } = useForm();
  
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [iconUrl, setIconUrl] = useState('');
  
  const [isPortfolioUploading, setIsPortfolioUploading] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  
  const iconInputRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'FLORIST') {
      router.push('/florists/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/api/florists/profile`);
        
        if (res.ok) {
          const f = await res.json();
          setValue('shopName', f.shopName || '');
          setValue('platformName', f.platformName || '');
          setValue('contactName', f.contactName || '');
          setValue('address', f.address || '');
          setValue('phoneNumber', f.phoneNumber || '');
          setValue('website', f.website || '');
          setValue('portfolio', f.portfolio || '');
          setValue('acceptsRushOrders', f.acceptsRushOrders || false);
          
          setSelectedTags(f.specialties || []);
          setPortfolioImages(f.portfolioImages || []);
          setIconUrl(f.iconUrl || '');
        } else if (res.status === 401) {
          logout();
        }
      } catch (error) {
        console.error(error);
        toast.error('プロフィールの読み込みに失敗しました');
      } finally {
        setLoadingData(false);
      }
    };
    fetchProfile();
  }, [user, authLoading, authenticatedFetch, setValue, router, logout]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // ★修正: S3への直接アップロード方式に変更
  const uploadFile = async (file) => {
    try {
      // 1. 署名付きURLを取得
      const res = await authenticatedFetch(`${API_URL}/api/tools/s3-upload-url`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      
      if (!res.ok) throw new Error('アップロード用URLの取得に失敗しました');
      const { uploadUrl, fileUrl } = await res.json();

      // 2. S3へ直接アップロード
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadRes.ok) throw new Error('S3への保存に失敗しました');

      // 3. 完了したURLを返す
      return { url: fileUrl };
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsIconUploading(true);
    const toastId = toast.loading('アイコンを更新中...');
    try {
      const data = await uploadFile(file);
      setIconUrl(data.url);
      toast.success('アイコンを変更しました', { id: toastId });
    } catch (error) {
      toast.error('失敗しました: ' + error.message, { id: toastId });
    } finally {
      setIsIconUploading(false);
    }
  };

  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (portfolioImages.length + files.length > 6) return toast.error('最大6枚です');
    setIsPortfolioUploading(true);
    const toastId = toast.loading('アップロード中...');
    try {
      for (const file of files) {
        const data = await uploadFile(file);
        setPortfolioImages(prev => [...prev, data.url]);
      }
      toast.success('追加しました', { id: toastId });
    } catch (error) {
      toast.error('失敗しました: ' + error.message, { id: toastId });
    } finally {
      setIsPortfolioUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          iconUrl: iconUrl,
          specialties: selectedTags,
          portfolioImages: portfolioImages
        }),
      });
      if (!res.ok) throw new Error('更新失敗');
      toast.success('保存しました');
      router.push('/florists/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || loadingData) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 z-20 bg-gray-50/90 backdrop-blur-sm py-4">
            <div className="flex items-center gap-4">
                <Link href="/florists/dashboard" className="p-2 bg-white rounded-full text-gray-500 hover:text-pink-600 border border-gray-200">
                    <FiArrowLeft size={20}/>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">プロフィール編集</h1>
            </div>
            <button 
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || isIconUploading || isPortfolioUploading}
                className="hidden sm:flex items-center px-6 py-2.5 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 disabled:bg-gray-400 transition-colors"
            >
                {isSubmitting ? <FiLoader className="animate-spin mr-2"/> : <FiSave className="mr-2"/>}
                変更を保存
            </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center gap-3">
                        <div 
                            className="relative w-32 h-32 rounded-full border-4 border-gray-100 shadow-md bg-gray-200 overflow-hidden cursor-pointer group"
                            onClick={() => iconInputRef.current.click()}
                        >
                            {iconUrl ? <Image src={iconUrl} alt="Icon" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><FiUser size={48} /></div>}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><FiCamera className="text-white text-2xl"/></div>
                        </div>
                        <input type="file" ref={iconInputRef} accept="image/*" onChange={handleIconUpload} className="hidden" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">活動名</label>
                            <input type="text" {...register('platformName', { required: true })} className="w-full p-3 bg-gray-50 border rounded-xl outline-none" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold">担当者名</label><input type="text" {...register('contactName')} className="w-full p-3 bg-gray-50 border rounded-xl" /></div>
                            <div><label className="block text-sm font-bold">電話番号</label><input type="tel" {...register('phoneNumber')} className="w-full p-3 bg-gray-50 border rounded-xl" /></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <label className="block text-sm font-bold mb-2">住所</label>
                <input type="text" {...register('address')} className="w-full p-3 bg-gray-50 border rounded-xl mb-4" />
                <label className="block text-sm font-bold mb-2">サイト/SNS</label>
                <input type="url" {...register('website')} className="w-full p-3 bg-gray-50 border rounded-xl" />
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                    <div><h3 className="font-bold">お急ぎ便対応</h3><p className="text-xs text-gray-500">直前の依頼も受け付けます</p></div>
                    <input type="checkbox" {...register('acceptsRushOrders')} className="w-6 h-6 accent-pink-500" />
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold mb-4">特徴タグ</h3>
                <div className="flex flex-wrap gap-2">
                    {STYLE_TAGS.map(tag => (
                        <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-4 py-2 rounded-full text-xs font-bold border ${selectedTags.includes(tag) ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600'}`}>{tag}</button>
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold mb-4">制作実績写真</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {portfolioImages.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                            <Image src={url} alt="work" fill className="object-cover" />
                            <button type="button" onClick={() => setPortfolioImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><FiTrash2 size={14}/></button>
                        </div>
                    ))}
                    {portfolioImages.length < 6 && (
                        <label className="aspect-square border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all"><FiCamera size={24}/><input type="file" multiple accept="image/*" onChange={handlePortfolioUpload} className="hidden"/></label>
                    )}
                </div>
                <label className="block text-sm font-bold mb-2">自己紹介</label>
                <textarea {...register('portfolio')} rows="5" className="w-full p-4 bg-gray-50 border rounded-xl outline-none" placeholder="メッセージを入力"></textarea>
            </section>
        </form>

        <div className="sm:hidden fixed bottom-6 left-4 right-4 z-30"><button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full py-4 bg-pink-600 text-white font-bold rounded-full shadow-lg">変更を保存</button></div>
      </div>
    </div>
  );
}