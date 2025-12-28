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

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function FloristProfileEditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // React Hook Form
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm();
  
  // Local State
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [iconUrl, setIconUrl] = useState(''); // アイコン画像用ステート追加
  
  // Upload State
  const [isPortfolioUploading, setIsPortfolioUploading] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  
  // Refs
  const iconInputRef = useRef(null);

  // データ取得
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'FLORIST') {
      router.push('/florists/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = getAuthToken();
        // ★修正: 取得先を /profile に統一。
        // バックエンドの getFloristProfile は { florist: {...} } ではなく、
        // 直接お花屋さんのオブジェクトを返すように前回の修正で行っています。
        const res = await fetch(`${API_URL}/api/florists/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const f = await res.json();
          
          // フォーム初期値設定
          setValue('shopName', f.shopName || '');
          setValue('platformName', f.platformName || '');
          setValue('contactName', f.contactName || '');
          setValue('address', f.address || '');
          setValue('phoneNumber', f.phoneNumber || '');
          setValue('website', f.website || '');
          setValue('portfolio', f.portfolio || '');
          setValue('acceptsRushOrders', f.acceptsRushOrders || false);
          
          // ステート初期値設定
          setSelectedTags(f.specialties || []);
          setPortfolioImages(f.portfolioImages || []);
          setIconUrl(f.iconUrl || '');
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'お花屋さんの情報が見つかりませんでした。');
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'プロフィールの読み込みに失敗しました');
      } finally {
        setLoadingData(false);
      }
    };
    fetchProfile();
  }, [user, authLoading, router, setValue]);

  // タグ切り替え
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  // 汎用アップロード関数
  const uploadFile = async (file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  };

  // アイコン画像アップロード
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
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsIconUploading(false);
      if(iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  // ポートフォリオ画像アップロード
  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // 枚数制限チェック (例: 最大6枚)
    if (portfolioImages.length + files.length > 6) {
        return toast.error('ポートフォリオ画像は最大6枚までです');
    }
    
    setIsPortfolioUploading(true);
    const toastId = toast.loading(`${files.length}枚の画像をアップロード中...`);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const data = await uploadFile(file);
        uploadedUrls.push(data.url);
      }
      setPortfolioImages(prev => [...prev, ...uploadedUrls]);
      toast.success('画像を追加しました', { id: toastId });
    } catch (error) {
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsPortfolioUploading(false);
      e.target.value = '';
    }
  };

  // 更新送信
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
          iconUrl: iconUrl, // アイコンも送信
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
        
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between mb-6 sticky top-0 z-20 bg-gray-50/90 backdrop-blur-sm py-4">
            <div className="flex items-center gap-4">
                <Link href="/florists/dashboard" className="p-2 bg-white rounded-full text-gray-500 hover:text-pink-600 shadow-sm border border-gray-200 transition-colors">
                    <FiArrowLeft size={20}/>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">プロフィール編集</h1>
            </div>
            {/* PC用保存ボタン */}
            <button 
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || isIconUploading || isPortfolioUploading}
                className="hidden sm:flex items-center px-6 py-2.5 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 shadow-lg shadow-pink-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? <FiLoader className="animate-spin mr-2"/> : <FiSave className="mr-2"/>}
                変更を保存
            </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
            
            {/* 1. 基本情報 & アイコン */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <FiUser className="text-pink-500"/> 基本情報
                    </h2>
                </div>
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* アイコンアップロード */}
                        <div className="flex flex-col items-center gap-3 mx-auto md:mx-0">
                            <div 
                                className="relative w-32 h-32 rounded-full border-4 border-gray-100 shadow-md bg-gray-200 overflow-hidden cursor-pointer group"
                                onClick={() => iconInputRef.current.click()}
                            >
                                {iconUrl ? (
                                    <Image src={iconUrl} alt="Icon" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <FiUser size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiCamera className="text-white text-2xl"/>
                                </div>
                            </div>
                            <input type="file" ref={iconInputRef} accept="image/*" onChange={handleIconUpload} className="hidden" />
                            <button type="button" onClick={() => iconInputRef.current.click()} className="text-sm font-bold text-pink-600 hover:underline">
                                {isIconUploading ? '更新中...' : 'アイコンを変更'}
                            </button>
                        </div>

                        {/* テキスト入力 */}
                        <div className="flex-1 w-full grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    活動名 (ユーザーに公開) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    {...register('platformName', { required: '活動名は必須です' })} 
                                    className={`w-full p-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all ${errors.platformName ? 'border-red-500' : 'border-gray-200'}`}
                                    placeholder="例: フラワーショップ FLOWER"
                                />
                                {errors.platformName && <p className="text-red-500 text-xs mt-1">{errors.platformName.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    店舗名 (正式名称・非公開)
                                </label>
                                <input 
                                    type="text" 
                                    {...register('shopName')} 
                                    className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed" 
                                    readOnly 
                                    title="変更する場合は運営にお問い合わせください"
                                />
                                <p className="text-xs text-gray-400 mt-1">※ 正式名称の変更は運営への申請が必要です</p>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">担当者名</label>
                                    <input type="text" {...register('contactName')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1"><FiPhone className="inline mr-1"/> 電話番号</label>
                                    <input type="tel" {...register('phoneNumber')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. 店舗詳細情報 */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <FiMapPin className="text-pink-500"/> 店舗詳細・Web
                    </h2>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">住所</label>
                       <input type="text" {...register('address')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all" placeholder="〒000-0000 東京都..." />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1"><FiGlobe className="inline mr-1"/> ウェブサイト / SNS</label>
                       <input type="url" {...register('website')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all" placeholder="https://instagram.com/..." />
                    </div>
                </div>
            </section>

            {/* 3. お急ぎ便設定 (Feature Toggle) */}
            <section className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6 relative overflow-hidden">
                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-yellow-400 text-white rounded-full shadow-md shrink-0">
                        <FiZap size={24}/>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">お急ぎ便 (Rush Order) 対応</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            直前の依頼も受け付けますか？ <br/>
                            <span className="font-bold">オン</span>にすると、お急ぎのユーザーの検索結果で上位に表示されやすくなります。
                        </p>
                        
                        <label className="inline-flex items-center cursor-pointer group">
                            <input 
                                type="checkbox" 
                                {...register('acceptsRushOrders')} 
                                className="sr-only peer"
                            />
                            <div className="relative w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-400 shadow-inner"></div>
                            <span className="ms-3 text-sm font-bold text-gray-600 group-hover:text-gray-800 transition-colors">
                                対応を受け付ける
                            </span>
                        </label>
                    </div>
                </div>
                <FiZap className="absolute -bottom-4 -right-4 text-9xl text-yellow-400 opacity-10 rotate-12 pointer-events-none" />
            </section>

            {/* 4. スタイルタグ */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <FiCheck className="text-pink-500"/> 得意なスタイル・特徴
                    </h2>
                </div>
                <div className="p-6 md:p-8">
                    <p className="text-sm text-gray-500 mb-4">
                        あなたの作風や強みを選択してください（複数選択可）。検索時のフィルターに使用されます。
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {STYLE_TAGS.map(tag => {
                             const isSelected = selectedTags.includes(tag);
                             return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all transform active:scale-95 border ${
                                    isSelected 
                                        ? 'bg-pink-500 text-white border-pink-500 shadow-md ring-2 ring-pink-200' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50'
                                    }`}
                                >
                                    {tag}
                                </button>
                             );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. ポートフォリオ & 自己紹介 */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <FiImage className="text-pink-500"/> ポートフォリオ & 自己紹介
                    </h2>
                </div>
                <div className="p-6 md:p-8 space-y-8">
                    
                    {/* 画像グリッド */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-bold text-gray-700">制作実績写真 (最大6枚)</label>
                            <span className="text-xs text-gray-400">{portfolioImages.length} / 6 枚</span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {portfolioImages.map((url, i) => (
                                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                    <Image src={url} alt="Portfolio" fill className="object-cover" />
                                    {/* 削除オーバーレイ */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setPortfolioImages(prev => prev.filter((_, idx) => idx !== i))}
                                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                            title="削除"
                                        >
                                            <FiTrash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {/* 追加ボタン */}
                            {portfolioImages.length < 6 && (
                                <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-pink-300 hover:text-pink-500 transition-all ${isPortfolioUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isPortfolioUploading ? (
                                        <FiLoader className="w-8 h-8 animate-spin text-pink-500"/>
                                    ) : (
                                        <>
                                            <FiCamera className="w-8 h-8 mb-1"/>
                                            <span className="text-xs font-bold">追加</span>
                                        </>
                                    )}
                                    <input type="file" multiple accept="image/*" onChange={handlePortfolioUpload} disabled={isPortfolioUploading} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 自己紹介テキスト */}
                    <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">自己紹介・アピールポイント</label>
                         <textarea 
                            {...register('portfolio')} 
                            rows="6" 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all resize-y" 
                            placeholder="お花のこだわり、得意な色味、お客様へのメッセージなどを自由に記載してください。"
                         ></textarea>
                    </div>
                </div>
            </section>

        </form>

        {/* モバイル用固定保存ボタン */}
        <div className="sm:hidden fixed bottom-6 left-4 right-4 z-30">
            <button 
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || isIconUploading || isPortfolioUploading}
                className="w-full py-3.5 bg-pink-600 text-white font-bold rounded-full shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:bg-gray-400"
            >
                {isSubmitting ? <FiLoader className="animate-spin"/> : <FiSave />}
                {isSubmitting ? '保存中...' : '変更を保存する'}
            </button>
        </div>

      </div>
    </div>
  );
}