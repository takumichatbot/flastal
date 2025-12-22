'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiX, FiImage, FiEdit3, FiArrowLeft, FiLoader } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { id: projectId } = params; 
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

  // 1. データ取得
  useEffect(() => {
    if (!projectId || authLoading) return;
    
    if (!user) {
      toast.error('ログインが必要です');
      router.push('/login');
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}`);
        if (!res.ok) throw new Error('企画情報の読み込みに失敗しました');
        const data = await res.json();
        
        if (data.plannerId !== user.id) {
          toast.error('編集権限がありません');
          router.push(`/projects/${projectId}`);
          return;
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          designDetails: data.designDetails || '',
          size: data.size || '',
          flowerTypes: data.flowerTypes || '',
        });
      } catch (error) {
        console.error(error);
        toast.error('データの取得に失敗しました');
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
      // トークン取得
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData,
      });
      if (!res.ok) throw new Error('アップロード失敗');
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('画像を更新しました', { id: toastId });
    } catch (error) {
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    
    try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}`, { 
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData), 
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || '更新に失敗しました');
        }

        toast.success('企画を更新しました！');
        router.push(`/projects/${projectId}`); 

    } catch (error) {
        console.error(error);
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading || authLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 font-sans text-gray-800">
      
      {/* ヘッダーエリア */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-8">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/projects/${projectId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <FiArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiEdit3 className="text-indigo-600"/> 企画の編集
                </h1>
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || isUploading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? <FiLoader className="animate-spin"/> : <FiSave />}
                保存する
              </button>
          </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 基本情報カード */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-indigo-500 pl-3">基本情報</h2>
            <div className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1">企画タイトル <span className="text-red-500">*</span></label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1">企画の詳しい説明 <span className="text-red-500">*</span></label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="8" required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
                </div>
            </div>
          </div>
          
          {/* 画像設定カード */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-indigo-500 pl-3">メイン画像</h2>
            <div className="space-y-4">
                <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group">
                    {formData.imageUrl ? (
                        <Image src={formData.imageUrl} alt="プレビュー" fill className="object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FiImage size={40} className="mb-2"/>
                            <span className="text-sm font-bold">画像が設定されていません</span>
                        </div>
                    )}
                    
                    {/* アップロードオーバーレイ */}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white font-bold">
                        <FiEdit3 size={32} className="mb-2"/>
                        <span>クリックして変更</span>
                        <input type="file" onChange={handleImageUpload} disabled={isUploading} className="hidden" accept="image/*"/>
                    </label>
                </div>
                {isUploading && <p className="text-sm text-indigo-500 font-bold animate-pulse text-center">画像をアップロード中...</p>}
            </div>
          </div>

          {/* デザイン詳細カード */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h2 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-pink-500 pl-3">デザイン・お花の希望</h2>
             <div className="space-y-6">
                 <div>
                    <label htmlFor="designDetails" className="block text-sm font-bold text-gray-700 mb-1">デザインの雰囲気</label>
                    <textarea name="designDetails" id="designDetails" value={formData.designDetails} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="size" className="block text-sm font-bold text-gray-700 mb-1">希望サイズ</label>
                        <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all" placeholder="例: 180cm x 90cm" />
                    </div>
                    <div>
                        <label htmlFor="flowerTypes" className="block text-sm font-bold text-gray-700 mb-1">使いたいお花</label>
                        <input type="text" name="flowerTypes" id="flowerTypes" value={formData.flowerTypes} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all" placeholder="例: 青いバラ、ユリ" />
                    </div>
                </div>
             </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Link href={`/projects/${projectId}`} className="flex-1 text-center py-4 font-bold text-gray-500 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                変更せずに戻る
            </Link>
            <button 
                type="submit" 
                disabled={isSubmitting || isUploading} 
                className="flex-[2] py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><FiLoader className="animate-spin"/> 保存中...</> : '変更内容を保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}