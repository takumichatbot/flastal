// src/app/mypage/edit/page.js 全文修正

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiSave, FiCamera, FiArrowLeft, FiUser, FiLoader } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FanProfileEditPage() {
  const { user, isLoading: authLoading, authenticatedFetch, updateUser } = useAuth();
  const router = useRouter();
  
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();
  const [iconUrl, setIconUrl] = useState('');
  const [isIconUploading, setIsIconUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    // 一般ユーザー(USER)以外が迷い込んだ場合はログインまたはトップへ
    if (!user || user.role !== 'USER') {
      router.push('/login');
      return;
    }

    // 初期値のセット
    setValue('handleName', user.handleName || '');
    setValue('bio', user.bio || '');
    setIconUrl(user.iconUrl || '');
  }, [user, authLoading, setValue, router]);

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsIconUploading(true);
    const toastId = toast.loading('アイコンをアップロード中...');
    
    try {
      // S3署名付きURL取得
      const res = await authenticatedFetch(`${API_URL}/api/tools/s3-upload-url`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      const { uploadUrl, fileUrl } = await res.json();
      
      // S3へ直接PUT
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      
      setIconUrl(fileUrl);
      toast.success('アイコンをアップロードしました', { id: toastId });
    } catch (error) {
      toast.error('失敗しました', { id: toastId });
    } finally {
      setIsIconUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ ...data, iconUrl }),
      });
      if (!res.ok) throw new Error('更新に失敗しました');

      // 共通コンテキストのユーザー情報を更新して即時反映させる
      updateUser({ ...data, iconUrl });
      toast.success('プロフィールを保存しました');
      router.push('/mypage');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-pink-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/mypage" className="p-2 bg-white rounded-full text-slate-400 hover:text-pink-600 shadow-sm border border-slate-100 transition-all">
            <FiArrowLeft size={24}/>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">プロフィール編集</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-2xl group cursor-pointer" 
              onClick={() => document.getElementById('icon-input').click()}
            >
              {iconUrl ? (
                <Image src={iconUrl} alt="Icon" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><FiUser size={48}/></div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <FiCamera className="text-white" size={24}/>
              </div>
            </div>
            <input id="icon-input" type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">タップして画像を変更</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">ハンドルネーム</label>
              <input 
                {...register('handleName', { required: true })} 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-800" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">自己紹介</label>
              <textarea 
                {...register('bio')} 
                rows="4" 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-medium leading-relaxed text-slate-600" 
                placeholder="好きな推しや活動について自由に書いてください"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || isIconUploading} 
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl shadow-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <FiLoader className="animate-spin" /> : <FiSave />} プロフィールを保存
          </button>
        </form>
      </div>
    </div>
  );
}