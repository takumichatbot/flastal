// client/src/app/florists/register/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FloristRegisterPage() {
  const [formData, setFormData] = useState({
    shopName: '',
    contactName: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/florists/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '登録に失敗しました。');
      }

      alert(data.message);
      // 成功したらフォームをリセット
      setFormData({ shopName: '', contactName: '', email: '', password: '' });

    } catch (error) {
      alert(`登録エラー: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          お花屋さん新規登録
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">店舗名</label>
            <input id="shopName" name="shopName" type="text" required value={formData.shopName} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
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
              登録する
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