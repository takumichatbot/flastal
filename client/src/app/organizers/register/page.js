'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiBriefcase, FiMail, FiLock, FiGlobe, FiArrowLeft } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OrganizerRegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
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

      toast.success('登録完了！確認メールを送信しました。');
      router.push('/organizers/login');

    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-indigo-600 hover:text-indigo-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">主催者アカウント登録</h1>
          <p className="text-sm text-gray-500 mt-2">公式イベント情報を掲載しましょう</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 主催者名 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">主催者名・団体名 <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiBriefcase className="text-gray-400" />
              </div>
              <input 
                type="text" 
                {...register('name', { required: '必須です' })} 
                placeholder="株式会社FLASTAL"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input 
                type="email" 
                {...register('email', { required: '必須です' })} 
                placeholder="contact@company.com"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                {...register('password', { required: '必須です', minLength: { value: 6, message: '6文字以上で入力してください' } })} 
                placeholder="8文字以上の英数字"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 transition"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* 公式サイトURL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">公式サイトURL <span className="text-gray-400 text-xs font-normal">(任意)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiGlobe className="text-gray-400" />
              </div>
              <input 
                type="url" 
                {...register('website')} 
                placeholder="https://..."
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-3.5 bg-indigo-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 mt-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? '登録中...' : 'アカウントを作成'}
          </button>
          
          <p className="mt-4 text-center text-xs text-gray-500">
            登録申請後、運営による審査が行われます。
          </p>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/organizers/login" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}