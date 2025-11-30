'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // パスに注意
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OrganizerLoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const res = await fetch(`${API_URL}/api/organizers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('ログインに失敗しました。メールアドレスかパスワードを確認してください。');
      }

      const result = await res.json();
      
      // AuthContextのログイン処理を呼び出す
      login(result.token);
      
      toast.success('主催者としてログインしました');
      router.push('/organizers/dashboard');

    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-900">主催者ログイン</h1>
          <p className="text-sm text-gray-500 mt-2">イベント公式アカウント運用者向け</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input 
              type="email" 
              {...register('email', { required: '必須です' })} 
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">パスワード</label>
            <input 
              type="password" 
              {...register('password', { required: '必須です' })} 
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          >
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">アカウントをお持ちでないですか？</p>
          <Link href="/organizers/register" className="text-indigo-600 hover:underline font-semibold">
            新規主催者登録はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}