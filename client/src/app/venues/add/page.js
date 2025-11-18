'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AddVenuePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    regulations: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 未ログインならリダイレクト
  if (!user) {
      if (typeof window !== 'undefined') router.push('/login');
      return null; 
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const promise = fetch(`${API_URL}/api/venues/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        userId: user.id // 登録者ID
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '登録に失敗しました。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '登録中...',
      success: () => {
        router.push('/venues'); // 一覧に戻る
        return '会場情報を登録しました！ありがとう！';
      },
      error: (err) => err.message,
      finally: () => setIsSubmitting(false)
    });
  };

  return (
    <div className="min-h-screen bg-green-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">会場情報の共有</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            あなたが知っている会場のフラスタ規定などを共有して、他のファンを助けましょう！
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-1">会場名 <span className="text-red-500">*</span></label>
              <input
                id="venueName"
                name="venueName"
                type="text"
                required
                value={formData.venueName}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="例：東京ドーム"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">住所</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="例：東京都文京区後楽1-3-61"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="regulations" className="block text-sm font-medium text-gray-700 mb-1">フラスタ規定・搬入情報</label>
              <textarea
                id="regulations"
                name="regulations"
                rows="6"
                value={formData.regulations}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="例：サイズ規定：高さ180cm以下、底辺40cm×40cm以下。回収必須。搬入時間は公演当日の午前中指定..."
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                ※公式サイトのURLや、過去の実績などのメモでも構いません。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <Link href="/venues" className="w-1/2">
                <button type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    キャンセル
                </button>
             </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
            >
              {isSubmitting ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}