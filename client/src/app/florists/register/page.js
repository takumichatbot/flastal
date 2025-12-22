'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiHome, FiTag, FiUser, FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
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
        router.push('/'); // 完了後はトップへ
        return data.message || '登録申請が完了しました。承認をお待ちください。'; 
      },
      error: (err) => err.message,
    });
    
    promise.finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl border border-pink-100">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-pink-600 hover:text-pink-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">パートナー登録申請</h2>
          <p className="text-gray-500 text-sm mt-2">素敵なお花を届けてくれるパートナーを募集しています</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 店舗情報セクション */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">店舗情報</h3>
            
            {/* 店舗名 (正式名称) */}
            <div>
              <label htmlFor="shopName" className="block text-sm font-semibold text-gray-700 mb-1">店舗名（正式名称） <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiHome className="text-gray-400" />
                </div>
                <input 
                  id="shopName" name="shopName" type="text" required 
                  value={formData.shopName} onChange={handleChange} 
                  placeholder="株式会社フラワーショップ"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">運営確認用です。一般には公開されません。</p>
            </div>

            {/* 活動名 */}
            <div>
              <label htmlFor="platformName" className="block text-sm font-semibold text-gray-700 mb-1">活動名（公開される名前） <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="text-gray-400" />
                </div>
                <input 
                  id="platformName" name="platformName" type="text" required 
                  value={formData.platformName} onChange={handleChange} 
                  placeholder="FLASTAL 花子"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">サイト上で表示される名前です。屋号やペンネームも可能です。</p>
            </div>
          </div>

          {/* 連絡先セクション */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">担当者・ログイン情報</h3>

            {/* 担当者名 */}
            <div>
              <label htmlFor="contactName" className="block text-sm font-semibold text-gray-700 mb-1">担当者名 <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" />
                </div>
                <input 
                  id="contactName" name="contactName" type="text" required 
                  value={formData.contactName} onChange={handleChange} 
                  placeholder="山田 太郎"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input 
                  id="email" name="email" type="email" required 
                  value={formData.email} onChange={handleChange} 
                  placeholder="contact@flower-shop.com"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
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
                  placeholder="8文字以上の英数字"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-pink-600 transition"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 bg-pink-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-pink-600 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '送信中...' : '登録を申請する'}
            </button>
            <p className="mt-4 text-center text-xs text-gray-500">
              登録申請後、運営による審査が行われます。<br/>審査完了まで数日かかる場合があります。
            </p>
          </div>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/florists/login" className="font-bold text-pink-600 hover:text-pink-700 hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}