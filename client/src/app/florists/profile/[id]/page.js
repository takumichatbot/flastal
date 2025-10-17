// client/src/app/florists/profile/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function EditFloristProfilePage({ params }) {
  const { id } = params;
  const [formData, setFormData] = useState({
    shopName: '',
    contactName: '',
    address: '',
    phoneNumber: '',
    website: '',
    portfolio: '',
    laruBotApiKey: '', 
  });
  const [loading, setLoading] = useState(true);

  // 最初に現在のプロフィール情報を読み込む
  useEffect(() => {
    if (id) {
      const fetchFlorist = async () => {
        try {
          const res = await fetch(`${API_URL}/api/florists/${id}`);
          if (!res.ok) throw new Error('データ読み込み失敗');
          const data = await res.json();
          // データベースの値がnullの場合、空文字列に変換してフォームに設定
          Object.keys(data).forEach(key => {
            if (data[key] === null) {
              data[key] = '';
            }
          });
          setFormData(data);
        } catch (error) {
          alert(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchFlorist();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ★★★ トークンを取得 ★★★
    const token = localStorage.getItem('authToken'); // useAuthで保存したトークンキー

    try {
      const res = await fetch(`${API_URL}/api/florists/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ★★★ トークンを付与 ★★★
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }
      alert('プロフィールが更新されました！');
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (loading) return <p className="text-center mt-10">読み込み中...</p>;

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md h-fit">
        <h2 className="text-2xl font-bold text-center text-gray-900">プロフィール編集</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 各フォーム要素 */}
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">店舗名</label>
            <input type="text" name="shopName" id="shopName" required value={formData.shopName} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">担当者名</label>
            <input type="text" name="contactName" id="contactName" required value={formData.contactName} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">住所</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">電話番号</label>
            <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">ウェブサイトURL</label>
            <input type="url" name="website" id="website" value={formData.website} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">ポートフォリオ・自己紹介</label>
            <textarea name="portfolio" id="portfolio" rows="5" value={formData.portfolio} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md shadow-sm"></textarea>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800">AIチャット連携</h3>
            <p className="text-sm text-gray-500 mt-1 mb-2">
              LARUbotと連携すると、ファンからの最初の問い合わせにAIが自動で応答します。<br/>
              <a href="https://larubot.tokyo" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">LARUbot公式サイト</a>でAPIキーを取得してください。
            </p>
            <label htmlFor="laruBotApiKey" className="block text-sm font-medium text-gray-700">LARUbot APIキー</label>
            <input type="text" name="laruBotApiKey" id="laruBotApiKey" value={formData.laruBotApiKey} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div className="flex gap-4">
             <Link href={`/florists/dashboard`} className="w-full">
              <span className="block text-center w-full px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                ダッシュボードに戻る
              </span>
            </Link>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600">
              更新する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}