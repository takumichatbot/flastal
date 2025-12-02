"use client";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiTag, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function FloristDealManager() {
  const [deals, setDeals] = useState([]);
  const [formData, setFormData] = useState({ color: '', flower: '', discount: 10, message: '' });

  // 自分の登録済み情報を取得
  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/florists/deals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if(res.ok) setDeals(await res.json());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/florists/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success('特売情報を登録しました！企画者にアピールされます。');
      setFormData({ color: '', flower: '', discount: 10, message: '' });
      fetchDeals();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
      <h3 className="font-bold text-lg text-red-600 mb-4 flex items-center">
        <FiTag className="mr-2" /> 在庫ロスゼロ・キャンペーン登録
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        余剰在庫や得意な色を登録すると、条件が合う企画者にあなたのショップが推薦されます。
      </p>

      {/* 登録フォーム */}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end mb-6 bg-red-50 p-4 rounded-lg">
        <div>
          <label className="text-xs font-bold block mb-1">色・雰囲気</label>
          <input 
            placeholder="例: 赤, ピンク" 
            value={formData.color}
            onChange={(e)=>setFormData({...formData, color: e.target.value})}
            className="p-2 border rounded text-sm w-32"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold block mb-1">お花の種類</label>
          <input 
            placeholder="例: バラ, ユリ" 
            value={formData.flower}
            onChange={(e)=>setFormData({...formData, flower: e.target.value})}
            className="p-2 border rounded text-sm w-32"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold block mb-1">割引率 (%)</label>
          <input 
            type="number" min="5" max="90"
            value={formData.discount}
            onChange={(e)=>setFormData({...formData, discount: e.target.value})}
            className="p-2 border rounded text-sm w-20"
            required
          />
        </div>
        <div className="flex-grow">
          <label className="text-xs font-bold block mb-1">アピール文</label>
          <input 
            placeholder="例: 結婚式キャンセル分のため高品質です！" 
            value={formData.message}
            onChange={(e)=>setFormData({...formData, message: e.target.value})}
            className="p-2 border rounded text-sm w-full"
            required
          />
        </div>
        <button type="submit" className="bg-red-500 text-white p-2 rounded-lg font-bold hover:bg-red-600 flex items-center">
          <FiPlus /> 登録
        </button>
      </form>

      {/* 登録リスト */}
      <div className="space-y-2">
        {deals.map(deal => (
          <div key={deal.id} className="flex justify-between items-center border-b pb-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-bold">{deal.discount}% OFF</span>
              <span className="font-bold">{deal.color} / {deal.flower}</span>
              <span className="text-gray-500 text-xs"> - {deal.message}</span>
            </div>
            <button className="text-gray-400 hover:text-red-500"><FiTrash2 /></button>
          </div>
        ))}
      </div>
    </div>
  );
}