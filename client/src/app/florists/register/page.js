'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristRegisterPage() {
  const [formData, setFormData] = useState({
    shopName: '',
    platformName: '',
    contactName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const promise = fetch(`${API_URL}/api/florists/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '登録申請に失敗しました。');
      }
      return data; 
    });

    toast.promise(promise, {
      loading: '申請を送信中...',
      success: (data) => {
        router.push('/'); // トップページにリダイレクト
        return data.message || '登録申請が完了しました。承認をお待ちください。'; 
      },
      error: (err) => err.message,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-pink-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          お花屋さん新規登録申請
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">店舗名（正式名称）</label>
            <input id="shopName" name="shopName" type="text" required value={formData.shopName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
            <p className="mt-1 text-xs text-gray-500">運営が確認するために使用します。この名前は公開されません。</p>
          </div>

          <div>
            <label htmlFor="platformName" className="block text-sm font-medium text-gray-700">活動名（公開される名前）</label>
            <input id="platformName" name="platformName" type="text" required value={formData.platformName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
            <p className="mt-1 text-xs text-gray-500">ユーザーに表示される名前です。実際の店名とは異なる、匿名性のある名前を設定してください。</p>
          </div>

          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">担当者名</label>
            <input id="contactName" name="contactName" type="text" required value={formData.contactName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input 
              id="password" 
              name="password" 
              type={showPassword ? 'text' : 'password'}
              required 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"
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
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
              登録を申請する
            </button>
          </div>
        </form>
         <div className="text-sm text-center">
          <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}