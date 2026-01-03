'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiBriefcase, FiMail, FiLock, FiGlobe, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function OrganizerRegisterContent() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

      setIsSubmitted(true);
      toast.success('主催者登録の申請を完了しました');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl border border-indigo-100 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-indigo-100 p-4 rounded-full">
              <FiCheckCircle className="text-indigo-500 w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">申請ありがとうございます</h2>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8 text-left">
            <p className="text-gray-700 font-medium mb-2">今後の流れ：</p>
            <ul className="text-sm text-gray-600 space-y-3">
              <li className="flex items-start">
                <span className="bg-indigo-200 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">1</span>
                <span>メールアドレス宛に**本人確認メール**をお送りしました。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-200 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">2</span>
                <span>メール認証後、運営にて公式アカウントとしての審査を行います。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-200 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">3</span>
                <span>承認後、ログイン可能となりダッシュボードをご利用いただけます。</span>
              </li>
            </ul>
          </div>
          <p className="text-gray-500 text-sm mb-8">※メールが届かない場合は、ログイン画面から再送が可能です。</p>
          <Link href="/organizers/login" className="block w-full py-3.5 bg-indigo-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-indigo-700 transition-all">
            ログインページへ移動
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-indigo-600 hover:text-indigo-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">主催者アカウント登録</h1>
          <p className="text-sm text-gray-500 mt-2">公式イベント情報を掲載しましょう</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">主催者名・団体名 <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiBriefcase className="text-gray-400" />
              </div>
              <input type="text" {...register('name', { required: '必須です' })} placeholder="株式会社FLASTAL" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input type="email" {...register('email', { required: '必須です' })} placeholder="contact@company.com" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input type={showPassword ? 'text' : 'password'} {...register('password', { required: '必須です', minLength: { value: 8, message: '8文字以上で入力してください' } })} placeholder="••••••••" className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 transition">{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">公式サイトURL <span className="text-gray-400 text-xs font-normal">(任意)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiGlobe className="text-gray-400" />
              </div>
              <input type="url" {...register('website')} placeholder="https://..." className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full py-3.5 bg-indigo-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-indigo-700 transition-all ${isSubmitting ? 'opacity-70' : ''}`}>
            {isSubmitting ? '登録中...' : '登録を申請する'}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/organizers/login" className="font-bold text-indigo-600 hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-indigo-500">Loading...</div>}>
      <OrganizerRegisterContent />
    </Suspense>
  );
}