'use client';

import { useState } from 'react';
import { FiX, FiSave, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function FloristMaterialModal({ isOpen, onClose, project, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(project.materialCost || 0);
  const [description, setDescription] = useState(project.materialDescription || '');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/projects/${project.id}/materials`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialCost: parseInt(cost),
          materialDescription: description,
        }),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      const updatedProject = await res.json();
      toast.success('資材費情報を更新しました');
      onUpdate(updatedProject); // 親コンポーネントのデータを更新
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FiDollarSign /> 特注資材費の報告
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200 mb-4">
            <strong>重要:</strong> ここに入力された金額は、企画者がキャンセルした際に「実費」として必ず請求されます（返金対象外になります）。領収書などの証拠を残しておくことを推奨します。
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              資材費・実費金額 (円)
            </label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
              placeholder="例: 5000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内訳・メモ
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none h-24"
              placeholder="例: 等身大パネル印刷代として発注済み"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-bold flex items-center justify-center gap-2"
            >
              {loading ? '保存中...' : <><FiSave /> 保存する</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}