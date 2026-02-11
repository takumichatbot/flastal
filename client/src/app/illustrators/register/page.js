'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiPenTool, FiMail, FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function IllustratorRegisterPage() {
  const [formData, setFormData] = useState({
    activityName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 本番用APIリクエスト
      const res = await fetch(`${API_URL}/api/illustrators/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // 本番用なので、エラーはそのままユーザーに通知する
        throw new Error(data.message || '登録処理に失敗しました');
      }

      setIsSubmitted(true);
      toast.success('申請を送信しました');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl border border-amber-100 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-amber-100 p-4 rounded-full">
              <FiCheckCircle className="text-amber-500 w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">登録申請ありがとうございます</h2>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-8 text-left">
            <p className="text-gray-700 font-medium mb-2">今後の流れ：</p>
            <ul className="text-sm text-gray-600 space-y-3">
              <li className="flex items-start">
                <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">1</span>
                <span>本人確認メールを送信しました。メール内のボタンをクリックして認証を完了してください。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">2</span>
                <span>事務局にてポートフォリオ等の審査を行います（通常1〜3営業日）。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">3</span>
                <span>承認後、ログインして案件の募集やポートフォリオの公開が可能になります。</span>
              </li>
            </ul>
          </div>
          <Link href="/illustrators/login" className="block w-full py-3.5 bg-amber-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-amber-600 transition-all">
            ログインページへ移動
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-amber-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-amber-600 hover:text-amber-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">クリエイター登録</h2>
          <p className="text-sm text-gray-500 mt-2">あなたのイラストで「推し活」を彩りましょう</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">活動名（ペンネーム）</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiPenTool className="text-gray-400" /></div>
              <input name="activityName" type="text" required value={formData.activityName} onChange={handleChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition" placeholder="FLASTAL 絵師" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMail className="text-gray-400" /></div>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition" placeholder="illustrator@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="text-gray-400" /></div>
              <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition" placeholder="8文字以上" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-amber-600 transition">{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className={`w-full py-3.5 bg-amber-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-amber-600 transition-all ${isLoading ? 'opacity-70' : ''}`}>
            {isLoading ? '登録中...' : '登録を申請する'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">すでにアカウントをお持ちですか？ <Link href="/illustrators/login" className="font-bold text-amber-600 hover:underline">ログイン</Link></p>
        </div>
      </div>
    </div>
  );
}