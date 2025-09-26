// client/src/app/venues/dashboard/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VenueDashboardPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    regulations: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchVenue = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/venues/${id}`);
          if (!res.ok) throw new Error('データ読み込み失敗');
          const data = await res.json();
          Object.keys(data).forEach(key => {
            if (data[key] === null) data[key] = '';
          });
          setFormData(data);
        } catch (error) { alert(error.message); }
        finally { setLoading(false); }
      };
      fetchVenue();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:3001/api/venues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('更新に失敗しました。');
      alert('会場情報が更新されました！');
    } catch (error) { alert(`エラー: ${error.message}`); }
  };

  if (loading) return <p className="text-center mt-10">読み込み中...</p>;

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-8">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md h-fit">
        <h2 className="text-2xl font-bold text-center">{formData.venueName} - 管理画面</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="venueName" className="block text-sm font-medium">会場名</label>
            <input type="text" name="venueName" id="venueName" required value={formData.venueName} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium">住所</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full mt-1 text-gray-900 border-gray-300 rounded-md"/>
          </div>
          <div>
            <label htmlFor="regulations" className="block text-sm font-medium">フラスタ規定</label>
            <textarea name="regulations" id="regulations" rows="10" value={formData.regulations} onChange={handleChange} placeholder="サイズ制限、搬入・回収時間、注意事項などを入力してください" className="w-full mt-1 text-gray-900 border-gray-300 rounded-md"></textarea>
          </div>
          <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-green-500 rounded-md hover:bg-green-600">
            更新する
          </button>
        </form>
      </div>
    </div>
  );
}