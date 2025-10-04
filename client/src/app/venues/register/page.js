// client/src/app/venues/register/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ★ 1. useRouter をインポート

export default function VenueRegisterPage() {
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    password: '',
  });
  const router = useRouter(); // ★ 2. routerインスタンスを作成

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/venues/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      console.log('API通信成功。これからrouter.pushを実行します。');


      // ★ 3. 登録成功後の処理を修正
      alert('会場の登録が完了しました。ログインページに移動します。');
      router.push('/venues/login'); // '/venues/login' ページへ遷移させる

    } catch (error) {
      alert(`登録エラー: ${error.message}`);
    }
  };

  return (
    // ... (JSX部分は変更なし) ...
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          ライブハウス・会場 新規登録
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="venueName" className="block text-sm font-medium text-gray-700">会場名</label>
            <input id="venueName" name="venueName" type="text" required value={formData.venueName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-green-500 rounded-md hover:bg-green-600">
              登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}