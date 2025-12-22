'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiCamera, FiArrowLeft, FiTwitter, FiInstagram, FiUser } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const GENRE_OPTIONS = [
  'アイドル', 'Vtuber', 'アニメ/声優', 'K-POP', '舞台/俳優', 'Youtuber/配信者', 'アーティスト', 'その他'
];

// トークン取得ヘルパー
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function ProfileEditPage() {
  const { user, loading: authLoading } = useAuth(); 
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();
  
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewIcon, setPreviewIcon] = useState('');

  // 1. 初期値をフォームにセット
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }

    setValue('handleName', user.handleName);
    setValue('bio', user.bio || '');
    setValue('twitterUrl', user.twitterUrl || '');
    setValue('instagramUrl', user.instagramUrl || '');
    setValue('isProfilePublic', user.isProfilePublic !== false);
    
    setSelectedGenres(user.favoriteGenres || []);
    setPreviewIcon(user.iconUrl || '');

  }, [user, authLoading, router, setValue]);

  // 2. ジャンル選択トグル
  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(prev => prev.filter(g => g !== genre));
    } else {
      setSelectedGenres(prev => [...prev, genre]);
    }
  };

  // 3. アイコンアップロード
  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const toastId = toast.loading('画像を処理中...');
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    try {
      // 画像アップロードAPIへ送信
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('アップロードに失敗しました');
      const { url } = await uploadRes.json();
      
      setPreviewIcon(url);
      
      // アイコンだけ先に保存しておく（UX向上）
      await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...user, iconUrl: url })
      });
      
      toast.success('アイコンを変更しました', { id: toastId });
      
    } catch (error) {
      console.error(error);
      toast.error('画像のアップロードに失敗しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // 4. 保存処理
  const onSubmit = async (data) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          iconUrl: previewIcon, 
          favoriteGenres: selectedGenres
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      toast.success('プロフィールを更新しました！');
      router.push('/mypage?tab=profile');
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || !user) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-sky-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-sky-100">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">プロフィール編集</h1>
            <Link href="/mypage?tab=profile" className="text-sm font-bold text-gray-500 hover:text-sky-600 flex items-center transition-colors">
              <FiArrowLeft className="mr-1"/> 戻る
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* アイコン設定 */}
            <div className="flex flex-col items-center">
                <div className="relative group w-32 h-32">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md relative bg-gray-100">
                        {previewIcon ? (
                            <Image 
                                src={previewIcon} 
                                alt="preview" 
                                fill 
                                style={{ objectFit: 'cover' }} 
                                sizes="128px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <FiUser size={48}/>
                            </div>
                        )}
                        {/* オーバーレイ */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                    
                    <label className="absolute bottom-1 right-1 bg-sky-500 text-white p-2.5 rounded-full cursor-pointer hover:bg-sky-600 transition-colors shadow-lg border-2 border-white group-hover:scale-110">
                        <FiCamera size={18}/>
                        <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={isUploading}/>
                    </label>
                </div>
                <p className="text-xs text-gray-400 mt-3">タップしてアイコンを変更</p>
            </div>

            {/* 基本情報 */}
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">ニックネーム <span className="text-red-500">*</span></label>
                    <input type="text" {...register('handleName', {required: true})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition" />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">自己紹介</label>
                    <textarea {...register('bio')} rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition" placeholder="推しへの愛や、活動内容を書きましょう！"></textarea>
                </div>
            </div>

            {/* 推しジャンル */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">推しジャンル (複数選択可)</label>
                <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map(genre => (
                        <button
                            key={genre}
                            type="button"
                            onClick={() => toggleGenre(genre)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                selectedGenres.includes(genre) 
                                    ? 'bg-sky-500 text-white border-sky-500 shadow-md' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* SNSリンク */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">SNS連携</h3>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-400"><FiTwitter size={20}/></div>
                    <input type="url" {...register('twitterUrl')} placeholder="X (Twitter) URL" className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none transition" />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-pink-500"><FiInstagram size={20}/></div>
                    <input type="url" {...register('instagramUrl')} placeholder="Instagram URL" className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none transition" />
                </div>
            </div>

            {/* 公開設定 */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input type="checkbox" id="isProfilePublic" {...register('isProfilePublic')} className="h-5 w-5 text-sky-600 rounded focus:ring-sky-500 border-gray-300" />
                <label htmlFor="isProfilePublic" className="text-sm text-gray-700 cursor-pointer font-medium select-none">
                    プロフィールを一般公開する
                    <p className="text-xs text-gray-400 font-normal mt-0.5">ONにすると、参加した企画が他のユーザーからも見えるようになります。</p>
                </label>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-70 disabled:scale-100"
              >
                <FiSave size={20}/> {isSubmitting ? '保存中...' : 'プロフィールを更新する'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}