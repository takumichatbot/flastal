"use client";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiTag, FiPlus, FiTrash2, FiLoader, FiPercent, FiMessageSquare, FiInfo, FiCheck } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristDealManager() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialForm = { color: '', flower: '', discount: 10, message: '' };
  const [formData, setFormData] = useState(initialForm);

  // トークン取得ヘルパー
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
  };

  // データ取得
  const fetchDeals = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/florists/deals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if(res.ok) {
        setDeals(await res.json());
      }
    } catch (error) {
      console.error(error);
      toast.error('情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // 登録処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return toast.error('ログインが必要です');

    if (!formData.color && !formData.flower) {
        return toast.error('「色・雰囲気」または「お花の種類」のどちらかは入力してください');
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('キャンペーンを登録中...');

    try {
      const res = await fetch(`${API_URL}/api/florists/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('在庫ロスゼロ・キャンペーンを登録しました！', { id: toastId });
        setFormData(initialForm); // フォームリセット
        fetchDeals(); // リスト更新
      } else {
        const err = await res.json();
        throw new Error(err.message || '登録に失敗しました');
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除処理
  const handleDelete = async (dealId) => {
      if(!window.confirm('このキャンペーン情報を削除してもよろしいですか？')) return;

      const token = getToken();
      const toastId = toast.loading('削除中...');

      try {
          const res = await fetch(`${API_URL}/api/florists/deals/${dealId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
              toast.success('削除しました', { id: toastId });
              setDeals(prev => prev.filter(deal => deal.id !== dealId));
          } else {
              throw new Error('削除に失敗しました');
          }
      } catch (error) {
          toast.error(error.message, { id: toastId });
      }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
      
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 border-b border-red-100">
        <h3 className="font-bold text-lg text-rose-700 mb-2 flex items-center gap-2">
          <FiTag className="text-xl" /> 在庫ロスゼロ・キャンペーン
        </h3>
        <p className="text-xs text-rose-600 leading-relaxed">
          余剰在庫や得意な花材を登録しておくと、条件が合う企画者にあなたのショップが優先的に推薦されます。<br/>
          <span className="font-bold">※登録情報は自動的にマッチングに使用されます。</span>
        </p>
      </div>

      <div className="p-6">
        {/* 登録フォーム */}
        <form onSubmit={handleSubmit} className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <FiPlus className="mr-1"/> 新規キャンペーン登録
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-4">
              <label className="text-xs font-bold text-gray-500 block mb-1">色・雰囲気</label>
              <input 
                placeholder="例: 赤系, パステルカラー" 
                value={formData.color}
                onChange={(e)=>setFormData({...formData, color: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-200 outline-none"
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-bold text-gray-500 block mb-1">お花の種類</label>
              <input 
                placeholder="例: バラ, ユリ, カスミソウ" 
                value={formData.flower}
                onChange={(e)=>setFormData({...formData, flower: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-200 outline-none"
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-bold text-gray-500 block mb-1">割引率 (%) <span className="text-red-500">*</span></label>
              <div className="relative">
                  <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"/>
                  <input 
                    type="number" min="5" max="90"
                    value={formData.discount}
                    onChange={(e)=>setFormData({...formData, discount: e.target.value})}
                    className="w-full pl-8 p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-rose-600 focus:ring-2 focus:ring-rose-200 outline-none"
                    required
                  />
              </div>
            </div>
            <div className="md:col-span-12">
              <label className="text-xs font-bold text-gray-500 block mb-1">アピール文 <span className="text-red-500">*</span></label>
              <div className="relative">
                  <FiMessageSquare className="absolute left-3 top-3 text-gray-400"/>
                  <textarea
                    placeholder="例: 結婚式のキャンセル分が発生したため、高品質なバラを特別価格で提供できます！" 
                    value={formData.message}
                    onChange={(e)=>setFormData({...formData, message: e.target.value})}
                    className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-rose-200 outline-none"
                    required
                  />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-rose-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-rose-600 transition-colors shadow-sm disabled:bg-gray-400 flex items-center gap-2"
            >
              {isSubmitting ? <FiLoader className="animate-spin"/> : <FiCheck />} 登録する
            </button>
          </div>
        </form>

        {/* 登録リスト */}
        <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                <span>登録中のキャンペーン ({deals.length})</span>
            </h4>
            
            {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
            ) : deals.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
                    登録されているキャンペーンはありません。
                </div>
            ) : (
                <div className="space-y-3">
                    {deals.map(deal => (
                    <div key={deal.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-rose-100 transition-all">
                        <div className="flex items-start gap-3">
                            <div className="bg-rose-100 text-rose-600 px-3 py-2 rounded-lg text-center min-w-[60px]">
                                <span className="block text-xl font-bold leading-none">{deal.discount}</span>
                                <span className="text-[10px] font-bold">% OFF</span>
                            </div>
                            <div>
                                <div className="flex flex-wrap gap-2 mb-1">
                                    {deal.color && <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{deal.color}</span>}
                                    {deal.flower && <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{deal.flower}</span>}
                                </div>
                                <p className="text-sm text-gray-600">{deal.message}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(deal.id)}
                            className="mt-2 sm:mt-0 text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors self-end sm:self-center"
                            title="削除する"
                        >
                            <FiTrash2 size={18} />
                        </button>
                    </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}