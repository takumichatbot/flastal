'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiCamera, FiArrowLeft, FiUser, FiLoader, FiGlobe } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OrganizerProfilePage() {
  const { user, loading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();
  const [previewIcon, setPreviewIcon] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/organizers/login');
      return;
    }
    if (user) {
      // 初期値をセット
      setValue('name', user.name || '');
      setValue('website', user.website || '');
      setValue('bio', user.bio || '');
      setPreviewIcon(user.iconUrl || '');
    }
  }, [user, authLoading, router, setValue]);

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('画像サイズは2MB以下にしてください');
    }

    setIsUploading(true);
    const toastId = toast.loading('アップロード中...');

    try {
      // 1. 署名付きURLの取得
      const res = await authenticatedFetch('/api/tools/s3-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      
      if (!res.ok) throw new Error('署名の取得に失敗しました');
      const { uploadUrl, fileUrl } = await res.json();

      // 2. S3 (またはストレージ) へ直接アップロード
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      
      await new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve() : reject();
        xhr.onerror = () => reject();
        xhr.send(file);
      });

      setPreviewIcon(fileUrl);
      toast.success('画像を仮アップロードしました。保存すると確定します。', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      // バックエンドの /api/organizers/profile (PATCH) を叩く
      const res = await authenticatedFetch(`${API_URL}/api/organizers/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...data, 
          iconUrl: previewIcon 
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '更新に失敗しました');
      }

      toast.success('プロフィールを更新しました！');
      router.push('/organizers/dashboard');
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FiLoader className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-white">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">主催者情報設定</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Organizer Settings</p>
          </div>
          <Link href="/organizers/dashboard" className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
            <FiArrowLeft size={24}/>
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* プロフィール画像 (1枚) */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 group">
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-50 ring-4 ring-indigo-500/5 transition-all group-hover:ring-indigo-500/20">
                {previewIcon ? (
                  <Image 
                    src={previewIcon} 
                    alt="Organizer Icon" 
                    fill 
                    className="object-cover" 
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <FiUser size={48}/>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <FiLoader className="animate-spin text-indigo-600" size={24}/>
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl cursor-pointer hover:bg-indigo-600 shadow-xl border-4 border-white transition-all active:scale-95">
                <FiCamera size={20}/>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleIconUpload} 
                  disabled={isUploading}
                />
              </label>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6">Logo / Avatar</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">主催者名 / 団体名</label>
              <input 
                {...register('name', { required: true })} 
                className="w-full p-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-800" 
                placeholder="団体名を入力"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">公式サイト / SNS URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FiGlobe size={18}/>
                </div>
                <input 
                  {...register('website')} 
                  type="url" 
                  className="w-full pl-12 p-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" 
                  placeholder="https://example.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">紹介文</label>
              <textarea 
                {...register('bio')} 
                rows="4" 
                className="w-full p-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed text-slate-600" 
                placeholder="活動目的や過去の実績などを紹介してください"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || isUploading} 
            className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-indigo-600 transition-all flex justify-center items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <FiLoader className="animate-spin" size={20}/> : <FiSave size={20}/>}
            {isSubmitting ? '保存中...' : '設定を保存する'}
          </button>
        </form>
      </div>
    </div>
  );
}