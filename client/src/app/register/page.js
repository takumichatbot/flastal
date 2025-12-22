"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiGift, FiArrowLeft } from 'react-icons/fi';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handleName, setHandleName] = useState('');
  const [referralCode, setReferralCode] = useState(''); // ★追加: 紹介コード
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth(); // AuthContextのregister関数が第4引数(referralCode)に対応しているか要確認

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // AuthContextのregister関数を呼び出す
    // ※ Context側の実装も (email, password, handleName, referralCode) を受け取るように修正が必要です
    // もしContext修正が手間なら、ここで直接fetchしてもOKです
    const promise = register(email, password, handleName, referralCode);

    toast.promise(promise, {
      loading: 'アカウントを作成中...',
      success: () => {
        router.push('/login');
        return '登録完了！認証メールを確認してください。';
      },
      error: (err) => err.message || '登録に失敗しました。',
    });
    
    // promiseが解決/拒否されたらローディング解除
    promise.finally(() => setIsLoading(false));
  };

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
          {/* ハンドルネーム */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ハンドルネーム <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input type="text" value={handleName} onChange={(e) => setHandleName(e.target.value)} required placeholder="フラスタ太郎" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" />
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@email.com" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" />
            </div>
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
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
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

          {/* 紹介コード (任意) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">紹介コード <span className="text-gray-400 text-xs font-normal">(お持ちの方のみ)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiGift className="text-gray-400" />
              </div>
              <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="コードを入力" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-gray-50 focus:bg-white" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3.5 bg-sky-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-sky-600 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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