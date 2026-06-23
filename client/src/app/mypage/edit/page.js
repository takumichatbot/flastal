'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Camera, ArrowLeft, User, Loader2, Lock, Mail } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FanProfileEditPage() {
  const { user, isLoading: authLoading, authenticatedFetch, updateUser } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { isSubmitting, errors } } = useForm();
  const [iconUrl, setIconUrl] = useState('');
  const [isIconUploading, setIsIconUploading] = useState(false);

  // パスワード変更
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // メールアドレス変更
  const [newEmail, setNewEmail] = useState('');
  const [requestingEmailChange, setRequestingEmailChange] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
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
      const res = await authenticatedFetch(`${API_URL}/api/tools/s3-upload-url`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const { uploadUrl, fileUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setIconUrl(fileUrl);
      toast.success('アイコンをアップロードしました', { id: toastId });
    } catch {
      toast.error('失敗しました', { id: toastId });
    } finally {
      setIsIconUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error('全項目を入力してください');
    setChangingPassword(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/users/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('パスワードを変更しました');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        toast.error(data.message || 'エラーが発生しました');
      }
    } catch {
      toast.error('通信エラーが発生しました');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail) return toast.error('新しいメールアドレスを入力してください');
    setRequestingEmailChange(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/users/request-email-change`, {
        method: 'POST',
        body: JSON.stringify({ newEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || '確認メールを送信しました');
        setNewEmail('');
      } else {
        toast.error(data.message || 'エラーが発生しました');
      }
    } catch {
      toast.error('通信エラーが発生しました');
    } finally {
      setRequestingEmailChange(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ ...data, iconUrl }),
      });
      if (!res.ok) throw new Error('更新に失敗しました');
      updateUser({ ...data, iconUrl });
      toast.success('プロフィールを保存しました');
      router.push('/mypage');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-400" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/mypage" className="p-2 bg-white rounded-full text-slate-400 hover:text-pink-500 shadow-sm border border-slate-100 transition-all">
            <ArrowLeft size={24} />
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
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <User size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <input id="icon-input" type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">タップして画像を変更</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                ハンドルネーム <span className="text-pink-400 normal-case tracking-normal">*</span>
              </label>
              <input
                {...register('handleName', { required: 'ハンドルネームは必須です' })}
                className={`w-full p-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none font-bold text-slate-800 transition-all ${errors.handleName ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
              />
              {errors.handleName && (
                <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.handleName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">自己紹介</label>
              <textarea
                {...register('bio')}
                rows="4"
                className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none font-medium leading-relaxed text-slate-600 transition-all"
                placeholder="好きな推しや活動について自由に書いてください"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isIconUploading}
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl shadow-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            プロフィールを保存
          </button>
        </form>

        {/* パスワード変更 */}
        <div className="bg-white mt-6 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={18} className="text-slate-500" />
            <h2 className="text-base font-black text-slate-800">パスワード変更</h2>
          </div>
          <input
            type="password"
            placeholder="現在のパスワード"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none font-medium text-slate-800 transition-all"
          />
          <input
            type="password"
            placeholder="新しいパスワード（8文字以上）"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none font-medium text-slate-800 transition-all"
          />
          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {changingPassword ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
            {changingPassword ? '変更中...' : 'パスワードを変更'}
          </button>
        </div>

        {/* メールアドレス変更 */}
        <div className="bg-white mt-6 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-slate-500" />
            <h2 className="text-base font-black text-slate-800">メールアドレス変更</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">現在: {user?.email}</p>
          <input
            type="email"
            placeholder="新しいメールアドレス"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            autoComplete="email"
            className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none font-medium text-slate-800 transition-all"
          />
          <button
            onClick={handleRequestEmailChange}
            disabled={requestingEmailChange}
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {requestingEmailChange ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
            {requestingEmailChange ? '送信中...' : '確認メールを送信'}
          </button>
          <p className="text-[11px] text-slate-400 text-center">新しいメールアドレスに確認メールを送信します。リンクをクリックすると変更が確定されます。</p>
        </div>
      </div>
    </div>
  );
}
