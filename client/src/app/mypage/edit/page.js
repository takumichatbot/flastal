'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiCamera, FiArrowLeft, FiTwitter, FiInstagram, FiUser, FiLoader, FiShield, FiCheck } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const GENRE_OPTIONS = [
  'アイドル', 'Vtuber', 'アニメ/声優', 'K-POP', '舞台/俳優', 'Youtuber/配信者', 'アーティスト', 'その他'
];

export default function ProfileEditPage() {
  const { user, loading: authLoading, authenticatedFetch } = useAuth(); 
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { isSubmitting, errors } } = useForm();
  
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewIcon, setPreviewIcon] = useState('');

  // 推し色テーマの適用
  const oshiThemeStyle = useMemo(() => ({
    '--oshi-color': user?.themeColor || '#ec4899',
  }), [user?.themeColor]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }

    // フォームの初期値セット
    setValue('handleName', user.handleName || '');
    setValue('bio', user.bio || '');
    setValue('twitterUrl', user.twitterUrl || '');
    setValue('instagramUrl', user.instagramUrl || '');
    setValue('isProfilePublic', user.isProfilePublic !== false);
    
    setSelectedGenres(user.favoriteGenres || []);
    setPreviewIcon(user.iconUrl || '');

  }, [user, authLoading, router, setValue]);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(prev => prev.filter(g => g !== genre));
    } else {
      setSelectedGenres(prev => [...prev, genre]);
    }
  };

  // アイコンアップロード (S3直アップロード方式)
  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('画像サイズは2MB以下にしてください');
    }
    
    setIsUploading(true);
    const toastId = toast.loading('アイコンをアップロード中...');

    try {
      // 1. 署名付きURL取得
      const res = await authenticatedFetch('/api/tools/s3-upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      if (!res.ok) throw new Error('署名取得失敗');
      const { uploadUrl, fileUrl } = await res.json();

      // 2. S3へPUT
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      
      await new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve() : reject();
        xhr.onerror = () => reject();
        xhr.send(file);
      });

      setPreviewIcon(fileUrl);
      toast.success('画像をアップロードしました。保存ボタンを押すと確定します。', { id: toastId });
      
    } catch (error) {
      console.error(error);
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await authenticatedFetch('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          iconUrl: previewIcon, 
          favoriteGenres: selectedGenres
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      toast.success('プロフィールを更新しました！');
      router.push('/mypage');
      router.refresh();
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FiLoader className="animate-spin text-[var(--oshi-color)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 font-sans" style={oshiThemeStyle}>
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-white">
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">プロフィール編集</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Edit Your Profile</p>
            </div>
            <Link href="/mypage" className="p-2 bg-slate-50 text-slate-400 hover:text-[var(--oshi-color)] hover:bg-[var(--oshi-color)]/5 rounded-full transition-all">
              <FiArrowLeft size={24}/>
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            {/* アイコン設定 */}
            <div className="flex flex-col items-center">
                <div className="relative group w-32 h-32">
                    <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-50 ring-4 ring-[var(--oshi-color)]/10 transition-all duration-500 group-hover:ring-[var(--oshi-color)]/30">
                        {previewIcon ? (
                            <Image 
                                src={previewIcon} 
                                alt="preview" 
                                fill 
                                style={{ objectFit: 'cover' }} 
                                sizes="128px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <FiUser size={48}/>
                            </div>
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <FiLoader className="animate-spin text-[var(--oshi-color)]" size={24}/>
                            </div>
                        )}
                    </div>
                    
                    <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl cursor-pointer hover:bg-[var(--oshi-color)] transition-all shadow-xl border-4 border-white group-hover:scale-110 active:scale-95">
                        <FiCamera size={20}/>
                        <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={isUploading}/>
                    </label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6">Change Avatar</p>
            </div>

            {/* 基本情報 */}
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">ニックネーム <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      {...register('handleName', {required: '名前を入力してください'})} 
                      className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[var(--oshi-color)] outline-none transition-all font-bold text-slate-800" 
                    />
                </div>
                
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">自己紹介</label>
                    <textarea 
                      {...register('bio')} 
                      rows="4" 
                      className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[var(--oshi-color)] outline-none transition-all text-sm leading-relaxed text-slate-600 resize-none" 
                      placeholder="推しへの愛や、活動内容を書きましょう！"
                    ></textarea>
                </div>
            </div>

            {/* 推しジャンル */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">推しジャンル (複数選択)</label>
                <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map(genre => {
                        const isSelected = selectedGenres.includes(genre);
                        return (
                          <button
                              key={genre}
                              type="button"
                              onClick={() => toggleGenre(genre)}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                                  isSelected 
                                      ? 'bg-[var(--oshi-color)] text-white border-[var(--oshi-color)] shadow-lg shadow-[var(--oshi-color)]/20' 
                                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                              }`}
                          >
                              {isSelected && <FiCheck className="inline mr-1" />}
                              {genre}
                          </button>
                        );
                    })}
                </div>
            </div>

            {/* SNSリンク */}
            <div className="space-y-4 pt-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Social Links</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sky-400"><FiTwitter size={18}/></div>
                      <input type="url" {...register('twitterUrl')} placeholder="X (Twitter) URL" className="pl-12 w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-sky-400 outline-none transition-all text-sm font-medium" />
                  </div>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pink-500"><FiInstagram size={18}/></div>
                      <input type="url" {...register('instagramUrl')} placeholder="Instagram URL" className="pl-12 w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
            </div>

            {/* 公開設定 */}
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50">
                <label className="flex items-start gap-4 cursor-pointer">
                  <div className="mt-1">
                    <input type="checkbox" id="isProfilePublic" {...register('isProfilePublic')} className="hidden" />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${user?.isProfilePublic !== false ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}>
                      <FiCheck className="text-white" size={14} />
                    </div>
                  </div>
                  <div className="select-none">
                      <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                        プロフィールを公開する <FiShield className="text-emerald-500" />
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">ONにすると、あなたの参加企画やバッジが他のファンからも見えるようになり、交流のきっかけになります。</p>
                  </div>
                </label>
            </div>

            <div className="pt-4 pb-4">
              <button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white font-black text-lg rounded-[1.5rem] shadow-2xl shadow-slate-300 hover:bg-[var(--oshi-color)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : <FiSave size={22}/>}
                {isSubmitting ? '保存しています...' : 'プロフィールを更新する'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}