'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiMapPin, FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueRegisterPage() {
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
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
      loading: '登録処理中...',
      success: (data) => {
        router.push('/venues/login');
        return data.message || '登録完了！確認メールを送信しました。';
      },
      error: (err) => err.message,
    });
    
    promise.finally(() => setIsLoading(false));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-green-100">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-green-600 hover:text-green-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">会場アカウント登録</h2>
          <p className="text-sm text-gray-500 mt-2">FLASTALで搬入情報を効率化しませんか？</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 会場名 */}
          <div>
            <label htmlFor="venueName" className="block text-sm font-semibold text-gray-700 mb-1">会場名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMapPin className="text-gray-400" />
              </div>
              <input 
                id="venueName" 
                name="venueName" 
                type="text" 
                required 
                value={formData.venueName} 
                onChange={handleChange} 
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" 
                placeholder="ライブハウス東京"
              />
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                value={formData.email} 
                onChange={handleChange} 
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" 
                placeholder="venue@example.com"
              />
            </div>
          </div>

          {/* パスワード */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input 
                id="password" 
                name="password" 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={formData.password} 
                onChange={handleChange} 
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" 
                placeholder="8文字以上の英数字"
              />
               <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-green-600 transition"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3.5 bg-green-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '登録中...' : '登録する'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/venues/login" className="font-bold text-green-600 hover:text-green-700 hover:underline mt-1 inline-block">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}