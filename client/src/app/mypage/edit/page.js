'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EditUserProfilePage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth(); // ★ login 関数も取得

  const [formData, setFormData] = useState({
    handleName: '',
    iconUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  const iconFileInputRef = useRef(null);

  // 1. ユーザー情報をフォームにセット
  useEffect(() => {
    if (authLoading) return; // AuthContextの読み込み待ち
    
    if (!user) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }

    setFormData({
      handleName: user.handleName || '',
      iconUrl: user.iconUrl || '',
    });
    setLoading(false);

  }, [user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  // 2. アイコンアップロード処理
  const handleIconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsIconUploading(true);
    const toastId = toast.loading('アイコンをアップロード中...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    try {
        const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: uploadFormData });
        if (!res.ok) throw new Error('アップロードに失敗');
        const data = await res.json();
        
        setFormData(prev => ({ ...prev, iconUrl: data.url }));
        toast.success('アイコンをアップロードしました！', { id: toastId });

    } catch (error) {
        toast.error('アップロードに失敗しました。', { id: toastId });
    } finally {
        setIsIconUploading(false);
    }
  };

  // 3. フォーム送信処理 (PATCH /api/users/profile)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return; 

    setIsSubmitting(true);
    const promise = fetch(`${API_URL}/api/users/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id, // ★ APIが要求する userId を送信
        handleName: formData.handleName,
        iconUrl: formData.iconUrl,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '更新に失敗しました。');
      }
      return res.json(); // ★ APIは新しいトークンを返す
    });

    toast.promise(promise, {
      loading: '更新中...',
      success: (data) => {
        // ★ APIから返された「新しいトークン」で AuthContext を更新する
        login(data.token);
        
        router.push('/mypage'); // マイページに戻る
        return 'プロフィールが更新されました！';
      },
      error: (err) => err.message,
      finally: () => setIsSubmitting(false),
    });
  };

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p>読み込み中...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-lg mx-auto p-8 space-y-6 bg-white rounded-xl shadow-lg h-fit">
        <h2 className="text-3xl font-bold text-center text-gray-900">プロフィール編集</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* アイコンアップロードUI */}
          <div>
            <label className="block text-sm font-medium text-gray-700">プロフィールアイコン</label>
            <div className="mt-2 flex items-center gap-4">
              {formData.iconUrl ? (
                <img src={formData.iconUrl} alt="Icon preview" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
                </div>
              )}
              <button type="button" onClick={() => iconFileInputRef.current.click()} disabled={isIconUploading} className="px-4 py-2 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 disabled:bg-slate-200">
                {isIconUploading ? 'アップロード中...' : '画像を選択'}
              </button>
              <input type="file" accept="image/*" ref={iconFileInputRef} onChange={handleIconUpload} className="hidden" />
            </div>
          </div>

          {/* ハンドルネーム編集 */}
          <div>
            <label htmlFor="handleName" className="block text-sm font-medium text-gray-700">ハンドルネーム（公開）</label>
            <input 
              type="text" 
              name="handleName" 
              id="handleName" 
              required 
              value={formData.handleName} 
              onChange={handleChange} 
              className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-0 transition"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
             <Link href="/mypage" className="w-full">
              <span className="block text-center w-full px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                マイページに戻る
              </span>
            </Link>
            <button type="submit" disabled={isSubmitting || isIconUploading} className="w-full px-4 py-3 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400">
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}