'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import toast from 'react-hot-toast'; // Import toast

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EditFloristProfilePage({ params }) {
  const { id } = params;
  const router = useRouter(); // Initialize router
  const [formData, setFormData] = useState({
    shopName: '',
    platformName: '', // Add platformName
    contactName: '',
    address: '',
    phoneNumber: '',
    website: '',
    portfolio: '',
    laruBotApiKey: '', 
  });
  const [loading, setLoading] = useState(true);
  const [florist, setFlorist] = useState(null); // Store logged-in florist

  // Authentication and Data Fetching
  useEffect(() => {
    const storedFlorist = localStorage.getItem('flastal-florist');
    if (!storedFlorist) {
      toast.error("ログインが必要です。");
      router.push('/florists/login');
      return;
    }
    try {
      const floristInfo = JSON.parse(storedFlorist);
      // Check if the logged-in florist matches the profile ID being edited
      if (floristInfo.id !== id) {
        toast.error("アクセス権がありません。");
        router.push('/florists/dashboard'); // Redirect to their own dashboard
        return;
      }
      setFlorist(floristInfo); // Store logged-in florist

      // Fetch current profile data to populate the form
      const fetchFloristData = async () => {
        try {
          const res = await fetch(`${API_URL}/api/florists/${id}`);
          if (!res.ok) throw new Error('プロフィール情報の読み込みに失敗しました');
          const data = await res.json();
          // Convert null values to empty strings for form fields
          Object.keys(formData).forEach(key => {
            if (data[key] === null) {
              data[key] = '';
            }
          });
           // Explicitly set platformName if it exists in data, otherwise default from formData
          setFormData({
            ...formData, // Start with default structure
            ...data,     // Overwrite with fetched data
            platformName: data.platformName || '', // Ensure platformName is handled
          });
        } catch (error) {
          toast.error(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchFloristData();

    } catch (e) {
      localStorage.removeItem('flastal-florist');
      router.push('/florists/login');
    }
  }, [id, router]); // Add router to dependency array

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!florist) return; // Should not happen if auth check passes

    // Use toast.promise
    const promise = fetch(`${API_URL}/api/florists/${id}`, {
      method: 'PATCH',
      headers: { 
          'Content-Type': 'application/json',
          // No Authorization header needed as per backend update logic
      },
      // Ensure platformName is included in the sent data
      body: JSON.stringify(formData), 
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '更新に失敗しました。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '更新中...',
      success: (updatedFlorist) => {
        // Update form data and localStorage with the response
        setFormData(updatedFlorist);
        localStorage.setItem('flastal-florist', JSON.stringify(updatedFlorist));
        return 'プロフィールが更新されました！';
      },
      error: (err) => err.message,
    });
  };

  if (loading || !florist) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p>読み込み中...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-2xl mx-auto p-8 space-y-6 bg-white rounded-xl shadow-lg h-fit">
        <h2 className="text-3xl font-bold text-center text-gray-900">プロフィール編集</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields */}
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">店舗名（正式名称・非公開）</label>
            <input type="text" name="shopName" id="shopName" required value={formData.shopName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
           {/* Add platformName field */}
           <div>
            <label htmlFor="platformName" className="block text-sm font-medium text-gray-700">活動名（公開）</label>
            <input type="text" name="platformName" id="platformName" required value={formData.platformName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">担当者名</label>
            <input type="text" name="contactName" id="contactName" required value={formData.contactName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">住所</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">電話番号</label>
            <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">ウェブサイトURL</label>
            <input type="url" name="website" id="website" value={formData.website} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">ポートフォリオ・自己紹介</label>
            <textarea name="portfolio" id="portfolio" rows="5" value={formData.portfolio} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"></textarea>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800">AIチャット連携</h3>
            <p className="text-sm text-gray-500 mt-1 mb-2">
              LARUbotと連携すると、ファンからの最初の問い合わせにAIが自動で応答します。<br/>
              <a href="https://larubot.tokyo" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">LARUbot公式サイト</a>でAPIキーを取得してください。
            </p>
            <label htmlFor="laruBotApiKey" className="block text-sm font-medium text-gray-700">LARUbot APIキー</label>
            <input type="text" name="laruBotApiKey" id="laruBotApiKey" value={formData.laruBotApiKey} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
             {/* Use Link component for navigation */}
             <Link href={`/florists/dashboard`} className="w-full">
              <span className="block text-center w-full px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                ダッシュボードに戻る
              </span>
            </Link>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
              更新する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}