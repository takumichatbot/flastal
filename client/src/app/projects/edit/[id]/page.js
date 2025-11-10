'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext'; // ../../.. 
import toast from 'react-hot-toast';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { id: projectId } = params; // URLから企画IDを取得
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    designDetails: '',
    size: '',
    flowerTypes: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. 企画の既存データを読み込む
  useEffect(() => {
    if (!projectId || authLoading) return;
    
    // 認証チェック
    if (!user) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}`);
        if (!res.ok) throw new Error('企画情報の読み込みに失敗しました');
        const data = await res.json();
        
        // 企画者本人かチェック
        if (data.plannerId !== user.id) {
          toast.error('権限がありません。');
          router.push(`/projects/${projectId}`);
          return;
        }

        // フォームにデータをセット
        setFormData({
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          designDetails: data.designDetails || '',
          size: data.size || '',
          flowerTypes: data.flowerTypes || '',
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('画像をアップロード中...');
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      if (!res.ok) throw new Error('アップロードに失敗しました');
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('画像をアップロードしました！', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // 2. PATCHリクエストを送信する
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const promise = fetch(`${API_URL}/api/projects/${projectId}`, { // ★ PATCHに変更
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        userId: user.id, // ★ 認証用にuserIdを送信
      }),
    }).then(async res => {
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '企画の更新に失敗しました');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '更新中...',
      success: () => {
        router.push(`/projects/${projectId}`); // 更新後に詳細ページに戻る
        return '企画を更新しました！';
      },
      error: (err) => err.message,
      finally: () => setIsSubmitting(false),
    });
  };
  
  if (loading || authLoading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }

  return (
    <div className="bg-sky-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">企画の編集</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">企画タイトル</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">企画の詳しい説明</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="6" required className="input-field"></textarea>
          </div>
          
          {/* 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700">メイン画像</label>
            {formData.imageUrl && <img src={formData.imageUrl} alt="プレビュー" className="w-full h-auto object-cover rounded-md my-2" />}
            <input type="file" onChange={handleImageUpload} disabled={isUploading} className="text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200" />
            {isUploading && <p>アップロード中...</p>}
          </div>

          {/* デザイン詳細 */}
          <div className="border-t pt-6 space-y-4">
             <div>
              <label htmlFor="designDetails" className="block text-sm font-medium text-gray-700">デザインの希望 (色、雰囲気など)</label>
              <textarea name="designDetails" id="designDetails" value={formData.designDetails} onChange={handleChange} rows="3" className="input-field"></textarea>
            </div>
             <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700">希望サイズ (例: 180cm x 90cm)</label>
              <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} className="input-field" />
            </div>
             <div>
              <label htmlFor="flowerTypes" className="block text-sm font-medium text-gray-700">使いたいお花 (例: バラ、ユリ)</label>
              <input type="text" name="flowerTypes" id="flowerTypes" value={formData.flowerTypes} onChange={handleChange} className="input-field" />
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Link href={`/projects/${projectId}`} className="w-full">
              <span className="block text-center w-full px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                キャンセル
              </span>
            </Link>
            <button type="submit" disabled={isSubmitting || isUploading} className="w-full px-4 py-3 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-400">
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
      {/* 共通CSSクラスの定義 (globals.cssにあれば不要) */}
      <style jsx>{`
        .input-field {
          width: 100%;
          margin-top: 4px;
          padding: 8px 12px;
          border-width: 2px;
          border-color: #e5e7eb;
          border-radius: 8px;
          color: #111827;
        }
        .input-field:focus {
          border-color: #0ea5e9;
          ring: 0;
        }
      `}</style>
    </div>
  );
}