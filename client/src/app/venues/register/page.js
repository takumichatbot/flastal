'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueRegisterPage() {
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const promise = fetch(`${API_URL}/api/venues/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    });

    toast.promise(promise, {
      loading: '登録中...',
      success: (data) => {
        router.push('/venues/login');
        return data.message || '会場の登録が完了しました。ログインしてください。';
      },
      error: (err) => err.message,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          ライブハウス・会場様 新規登録
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="venueName" className="block text-sm font-medium text-gray-700">会場名</label>
            <input id="venueName" name="venueName" type="text" required value={formData.venueName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/>
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input 
              id="password" 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              required value={formData.password} 
              onChange={handleChange} 
              className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"
            />
             <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-600"
              aria-label="パスワードを表示または非表示にする"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              登録する
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          すでにアカウントをお持ちですか？{' '}
          <Link href="/venues/login">
            <span className="font-medium text-sky-600 hover:underline">
              ログイン
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}