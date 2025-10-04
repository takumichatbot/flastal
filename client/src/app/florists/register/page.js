// client/src/app/florists/register/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ★★★ APIのURLを環境変数から取得するように修正 ★★★
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function FloristRegisterPage() {
  const [formData, setFormData] = useState({
    shopName: '',
    platformName: '', // ★★★ Stateを追加 ★★★
    contactName: '',
    email: '',
    password: '',
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/florists/register`, { // ★★★ URLを修正 ★★★
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '登録に失敗しました。');
      }

      // ★★★ 登録申請完了後の動作を修正 ★★★
      alert(data.message); // バックエンドからのメッセージを表示 (例: 「運営による承認をお待ちください。」)
      router.push('/'); // トップページにリダイレクト

    } catch (error) {
      alert(`登録エラー: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          お花屋さん新規登録申請
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            {/* ★★★ 店舗名の説明を修正 ★★★ */}
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">店舗名（正式名称）</label>
            <input id="shopName" name="shopName" type="text" required value={formData.shopName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            <p className="mt-1 text-xs text-gray-500">運営が確認するために使用します。この名前は公開されません。</p>
          </div>

          {/* ★★★ 活動名の入力欄を追加 ★★★ */}
          <div>
            <label htmlFor="platformName" className="block text-sm font-medium text-gray-700">活動名（公開される名前）</label>
            <input id="platformName" name="platformName" type="text" required value={formData.platformName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            <p className="mt-1 text-xs text-gray-500">ユーザーに表示される名前です。実際の店名とは異なる、匿名性のある名前を設定してください。</p>
          </div>

          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">担当者名</label>
            <input id="contactName" name="contactName" type="text" required value={formData.contactName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600">
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