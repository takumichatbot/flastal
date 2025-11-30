'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiSave, FiCamera, FiArrowLeft, FiTwitter, FiInstagram } from 'react-icons/fi';

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
  const { user, login, loading: authLoading } = useAuth(); 
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm();
  
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
    // 公開設定: デフォルトは true (undefinedの場合もtrue扱い)
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
    const toastId = toast.loading('アイコンをアップロード中...');
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    try {
      // 画像アップロード
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('アップロード失敗');
      const { url } = await uploadRes.json();
      
      // アイコンURLだけ先に更新
      setPreviewIcon(url);
      
      // ユーザー情報も更新しておく（保存ボタン忘れ対策）
      await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...user, iconUrl: url })
      });
      
      toast.success('アイコンを更新しました', { id: toastId });
      
    } catch (error) {
      toast.error('アイコンの更新に失敗しました', { id: toastId });
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
          iconUrl: previewIcon, // アイコンURLも含める
          favoriteGenres: selectedGenres
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      // 更新されたユーザー情報を取得（もしトークン再発行が必要な仕様ならここで処理）
      const updatedUser = await res.json();
      
      toast.success('プロフィールを更新しました！');
      router.push('/mypage?tab=profile');
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || !user) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-sky-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">プロフィール編集</h1>
            <Link href="/mypage?tab=profile" className="text-sm text-gray-500 hover:text-sky-600 flex items-center">
              <FiArrowLeft className="mr-1"/> マイページへ戻る
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* アイコン設定 */}
            <div className="flex flex-col items-center">
                <div className="relative group">
                    {previewIcon ? (
                        <img src={previewIcon} className="w-24 h-24 rounded-full object-cover border-4 border-sky-100 shadow-sm"/>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-sky-500 text-white p-2 rounded-full cursor-pointer hover:bg-sky-600 transition-colors shadow-md">
                        <FiCamera/>
                        <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={isUploading}/>
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">{isUploading ? 'アップロード中...' : 'アイコンを変更'}</p>
            </div>

            {/* 基本情報 */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">ニックネーム <span className="text-red-500">*</span></label>
                    <input type="text" {...register('handleName', {required: true})} className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-200 outline-none" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">自己紹介 (推しへの愛などを自由に！)</label>
                    <textarea {...register('bio')} rows="4" className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-200 outline-none" placeholder="例: 〇〇ちゃん推しです！フラスタ企画初心者ですがよろしくお願いします。"></textarea>
                </div>
            </div>

            {/* 推しジャンル */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">推しジャンル (複数選択可)</label>
                <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map(genre => (
                        <button
                            key={genre}
                            type="button"
                            onClick={() => toggleGenre(genre)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                selectedGenres.includes(genre) 
                                    ? 'bg-pink-500 text-white shadow-md transform scale-105' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* SNSリンク */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold text-gray-500">SNS連携 (任意)</h3>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FiTwitter/></div>
                    <input type="url" {...register('twitterUrl')} placeholder="X (Twitter) プロフィールURL" className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-200 outline-none" />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FiInstagram/></div>
                    <input type="url" {...register('instagramUrl')} placeholder="Instagram プロフィールURL" className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-200 outline-none" />
                </div>
            </div>

            {/* 公開設定 */}
            <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                <input type="checkbox" id="isProfilePublic" {...register('isProfilePublic')} className="h-5 w-5 text-sky-600 rounded" />
                <label htmlFor="isProfilePublic" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    プロフィールを一般公開する (参加した企画がギャラリーとして表示されます)
                </label>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-xl hover:shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSubmitting ? '保存中...' : 'プロフィールを更新する'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}