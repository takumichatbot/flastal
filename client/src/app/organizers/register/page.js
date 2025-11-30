'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OrganizerRegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const res = await fetch(`${API_URL}/api/organizers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '登録に失敗しました。');
      }

      toast.success('登録が完了しました！ログインしてください。');
      router.push('/organizers/login');

    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-900">主催者アカウント登録</h1>
          <p className="text-sm text-gray-500 mt-2">公式イベント情報を掲載しましょう</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">主催者名・団体名 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              {...register('name', { required: '必須です' })} 
              placeholder="例: 株式会社FLASTALプロモーション"
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              {...register('email', { required: '必須です' })} 
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">パスワード <span className="text-red-500">*</span></label>
            <input 
              type="password" 
              {...register('password', { required: '必須です', minLength: { value: 6, message: '6文字以上で入力してください' } })} 
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">公式サイトURL (任意)</label>
            <input 
              type="url" 
              {...register('website')} 
              placeholder="https://..."
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          >
            {isSubmitting ? '登録中...' : 'アカウントを作成'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/organizers/login" className="text-indigo-600 hover:underline">
            ログインはこちら
          </Link>
        </div>
      </div>
    </div>
  );
}