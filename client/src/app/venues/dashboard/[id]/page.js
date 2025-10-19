'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueDashboardPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    regulations: '',
  });
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState(null); // ログイン中の会場情報を保持

  useEffect(() => {
    // ★★★ 認証チェックを修正 ★★★
    const storedVenue = localStorage.getItem('flastal-venue');
    if (!storedVenue) {
      toast.error('ログインが必要です。');
      router.push('/venues/login');
      return;
    }
    
    const venueInfo = JSON.parse(storedVenue);
    // URLのIDとログイン中のIDが一致するか確認
    if (venueInfo.id !== id) {
        toast.error('アクセス権がありません。');
        router.push('/venues/login');
        return;
    }
    setVenue(venueInfo);

    // データ取得
    const fetchVenue = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues/${id}`);
        if (!res.ok) throw new Error('データ読み込みに失敗しました');
        const data = await res.json();
        // nullの値を空文字に変換
        Object.keys(data).forEach(key => {
          if (data[key] === null) data[key] = '';
        });
        setFormData(data);
      } catch (error) { 
        toast.error(error.message);
      } finally { 
        setLoading(false);
      }
    };
    fetchVenue();
  }, [id, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ★★★ 認証トークンは不要 ★★★
    const promise = fetch(`${API_URL}/api/venues/${id}`, {
      method: 'PATCH',
      headers: { 
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    }).then(res => {
      if (!res.ok) throw new Error('更新に失敗しました。');
      return res.json();
    });

    toast.promise(promise, {
      loading: '更新中...',
      success: (data) => {
        // 更新後の情報を再度フォームにセットし、localStorageも更新
        setFormData(data);
        localStorage.setItem('flastal-venue', JSON.stringify(data));
        return '会場情報が更新されました！';
      },
      error: (err) => err.message,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('flastal-venue');
    toast.success('ログアウトしました。');
    router.push('/venues/login');
  };

  if (loading || !venue) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">管理画面</h1>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
            ログアウト
          </button>
        </div>
        <div className="p-8 space-y-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900">{formData.venueName}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="venueName" className="block text-sm font-medium text-gray-700">会場名</label>
              <input type="text" name="venueName" id="venueName" required value={formData.venueName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">住所</label>
              <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"/>
            </div>
            <div>
              <label htmlFor="regulations" className="block text-sm font-medium text-gray-700">フラスタ規定</label>
              <textarea name="regulations" id="regulations" rows="10" value={formData.regulations} onChange={handleChange} placeholder="サイズ制限、搬入・回収時間、注意事項などを入力してください" className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition"></textarea>
              <p className="text-xs text-gray-500 mt-1">この内容は、ユーザーが企画作成時に会場を選択すると表示されます。</p>
            </div>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              更新する
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}