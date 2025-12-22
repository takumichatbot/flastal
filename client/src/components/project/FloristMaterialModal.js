'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSave, FiDollarSign, FiAlertTriangle, FiFileText, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function FloristMaterialModal({ isOpen, onClose, project, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');

  // モーダルが開くたびに初期値をセット
  useEffect(() => {
    if (isOpen && project) {
      setCost(project.materialCost || '');
      setDescription(project.materialDescription || '');
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // バリデーション
    const costValue = parseInt(cost);
    if (costValue < 0) {
        toast.error('金額は0円以上で入力してください');
        setLoading(false);
        return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/projects/${project.id}/materials`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialCost: costValue || 0, // 空文字なら0
          materialDescription: description,
        }),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      const updatedProject = await res.json();
      toast.success('資材費情報を更新しました');
      onUpdate(updatedProject); 
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-pink-100 text-pink-600 p-2 rounded-lg">
                <FiDollarSign size={20}/>
              </span>
              特注資材費の登録
            </h3>
            <p className="text-xs text-gray-500 mt-1 ml-1">
              プロジェクト: {project.title}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* 警告アラート */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <FiAlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <div className="text-sm text-amber-900">
              <p className="font-bold mb-1">返金不可の実費として扱われます</p>
              <p className="text-xs leading-relaxed opacity-90">
                ここに入力した金額は、企画者がキャンセルした場合でも<strong>請求対象（返金不可）</strong>となります。
                パネル印刷代や特殊資材など、既に発注済みの金額のみを入力してください。
              </p>
            </div>
          </div>

          {/* 金額入力エリア */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
              資材費・実費金額
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">税込</span>
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl group-focus-within:text-pink-500 transition-colors">¥</span>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-3xl font-bold text-gray-800 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all placeholder-gray-300"
                placeholder="0"
              />
            </div>
            <p className="text-right text-xs text-gray-400 mt-1">
                {cost ? `${parseInt(cost).toLocaleString()} 円` : '0 円'}
            </p>
          </div>

          {/* メモ入力エリア */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              <FiFileText className="text-gray-400"/> 内訳・メモ
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none h-28 text-sm leading-relaxed resize-none transition-all"
              placeholder="例：等身大パネル印刷代（〇〇印刷所へ発注済み）&#13;&#10;バルーン特殊加工費として"
            />
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <FiInfo /> 企画者にも公開されます。明確に記載してください。
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave className="text-lg" /> 
                  この内容で確定する
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}