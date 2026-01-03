'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiMapPin, FiMail, FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueRegisterPage() {
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/venues/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setIsSubmitted(true);
      toast.success('申請を送信しました');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl border border-green-100 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <FiCheckCircle className="text-green-500 w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">申請ありがとうございます</h2>
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8 text-left">
            <p className="text-gray-700 font-medium mb-2">今後の流れ：</p>
            <ul className="text-sm text-gray-600 space-y-3">
              <li className="flex items-start">
                <span className="bg-green-200 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">1</span>
                <span>本人確認メールを送信しました。メール内のボタンをクリックして認証を完了してください。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-200 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">2</span>
                <span>事務局にて会場情報の審査を行います（通常1〜3営業日）。</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-200 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 mr-2 shrink-0">3</span>
                <span>審査承認後、ご登録のメールアドレスに通知が届き、ログイン可能となります。</span>
              </li>
            </ul>
          </div>
          <p className="text-gray-500 text-sm mb-8">※メールが届かない場合は、ログイン画面から再送が可能です。</p>
          {/* ★リンク先を会場ログインに修正 */}
          <Link href="/venues/login" className="block w-full py-3.5 bg-green-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-green-700 transition-all">
            ログインページへ移動
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-green-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-green-600 hover:text-green-700 transition mb-2">
            <span className="flex items-center text-sm font-medium"><FiArrowLeft className="mr-1"/> トップへ戻る</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">会場アカウント登録</h2>
          <p className="text-sm text-gray-500 mt-2">FLASTALで搬入情報を効率化しませんか？</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">会場名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMapPin className="text-gray-400" /></div>
              <input name="venueName" type="text" required value={formData.venueName} onChange={handleChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" placeholder="ライブハウス東京" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMail className="text-gray-400" /></div>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" placeholder="venue@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="text-gray-400" /></div>
              <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" placeholder="8文字以上" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-green-600 transition">{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className={`w-full py-3.5 bg-green-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-green-700 transition-all ${isLoading ? 'opacity-70' : ''}`}>
            {isLoading ? '登録中...' : '登録を申請する'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">すでにアカウントをお持ちですか？ <Link href="/venues/login" className="font-bold text-green-600 hover:underline">ログイン</Link></p>
        </div>
      </div>
    </div>
  );
}