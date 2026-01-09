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
    if (!authLoading && !user) router.push('/organizers/login');
    if (user) {
      setValue('name', user.name || '');
      setValue('handleName', user.handleName || '');
      setValue('website', user.website || '');
      setValue('bio', user.bio || '');
      setPreviewIcon(user.iconUrl || '');
    }
  }, [user, authLoading, router, setValue]);

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading('アップロード中...');
    try {
      const res = await authenticatedFetch('/api/tools/s3-upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      const { uploadUrl, fileUrl } = await res.json();
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      await new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve() : reject();
        xhr.send(file);
      });
      setPreviewIcon(fileUrl);
      toast.success('アイコンをアップロードしました', { id: toastId });
    } catch (error) {
      toast.error('失敗しました', { id: toastId });
    } finally { setIsUploading(false); }
  };

  const onSubmit = async (data) => {
    try {
      const res = await authenticatedFetch('/api/organizers/profile', {
        method: 'PATCH',
        body: JSON.stringify({ ...data, iconUrl: previewIcon })
      });
      if (!res.ok) throw new Error('更新失敗');
      toast.success('プロフィールを更新しました');
      router.push('/organizers/dashboard');
    } catch (e) { toast.error(e.message); }
  };

  if (authLoading || !user) return <div className="p-20 text-center"><FiLoader className="animate-spin inline mr-2"/>読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-white">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-black text-slate-900">主催者情報設定</h1>
          <Link href="/organizers/dashboard" className="text-slate-400 hover:text-indigo-600 transition-colors"><FiArrowLeft size={24}/></Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-50">
                {previewIcon ? <Image src={previewIcon} alt="Icon" fill className="object-cover" /> : <FiUser size={48} className="m-auto text-slate-200"/>}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl cursor-pointer hover:bg-indigo-600 shadow-xl border-4 border-white transition-all">
                <FiCamera size={20}/>
                <input type="file" className="hidden" onChange={handleIconUpload} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">主催者名 / 団体名</label>
              <input {...register('name')} className="w-full p-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">公式サイトURL</label>
              <input {...register('website')} type="url" className="w-full p-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">紹介文</label>
              <textarea {...register('bio')} rows="4" className="w-full p-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all flex justify-center items-center gap-2">
            <FiSave size={20}/> 保存する
          </button>
        </form>
      </div>
    </div>
  );
}