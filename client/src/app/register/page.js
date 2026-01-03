"use client";

import { useState } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiGift, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    handleName: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(formData.email, formData.password, formData.handleName, formData.referralCode);
      setIsSubmitted(true);
      toast.success('アカウントを作成しました！');
    } catch (err) {
      toast.error(err.message || '登録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl border border-sky-100 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-sky-100 p-4 rounded-full">
              <FiCheckCircle className="text-sky-500 w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">登録ありがとうございます</h2>
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-6 mb-8 text-left">
            <p className="text-gray-700 font-medium mb-2">ログインまでの流れ：</p>
            <ul className="text-sm text-gray-600 space-y-3">
              <li className="flex items-start">
                <span className="bg-sky-200 text-sky-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">1</span>
                <span>本人確認メールを送信しました。メール内のボタンをクリックして認証を完了させてください。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-sky-200 text-sky-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">2</span>
                <span>認証完了後、すぐにログインしてサービスをご利用いただけます。</span>
              </li>
            </ul>
          </div>
          <Link href="/login" className="block w-full py-3.5 bg-sky-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-sky-600 transition-all">
            ログインページへ移動
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 border border-gray-100 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-sky-600 hover:text-sky-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">新規登録</h1>
          <p className="text-gray-500 text-sm mt-2">FLASTALで推しへの想いを形にしよう</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ハンドルネーム <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input type="text" value={formData.handleName} onChange={(e) => setFormData({...formData, handleName: e.target.value})} required placeholder="フラスタ太郎" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required placeholder="example@email.com" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
                placeholder="8文字以上の英数字"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-sky-600 transition"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">紹介コード <span className="text-gray-400 text-xs font-normal">(お持ちの方のみ)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiGift className="text-gray-400" />
              </div>
              <input type="text" value={formData.referralCode} onChange={(e) => setFormData({...formData, referralCode: e.target.value})} placeholder="コードを入力" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-gray-50 focus:bg-white" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3.5 bg-sky-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-sky-600 hover:shadow-lg transition-all duration-200 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '登録中...' : 'アカウントを作成'}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="font-bold text-sky-600 hover:text-sky-700 hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}