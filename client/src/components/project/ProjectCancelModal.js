'use client';

import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiX, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProjectCancelModal({ isOpen, onClose, project, onCancelComplete }) {
  const [loading, setLoading] = useState(false);
  const [estimates, setEstimates] = useState(null);

  // モーダルが開いたときに手数料を試算する
  useEffect(() => {
    if (isOpen && project) {
      calculateEstimates();
    }
  }, [isOpen, project]);

  const calculateEstimates = () => {
    const now = new Date();
    const deliveryDate = new Date(project.deliveryDateTime);
    const diffTime = deliveryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let rate = 0;
    let rateText = "";

    if (diffDays <= 3) {
      rate = 1.0;
      rateText = "100% (3日前〜当日)";
    } else if (diffDays <= 6) {
      rate = 0.5;
      rateText = "50% (6日前〜4日前)";
    } else {
      rate = 0.0;
      rateText = "0% (7日前以前)";
    }

    const collected = project.collectedAmount || 0;
    const baseFee = Math.floor(collected * rate);
    const materialCost = project.materialCost || 0;
    
    // 合計手数料（上限は集まった金額）
    let totalFee = baseFee + materialCost;
    if (totalFee > collected) totalFee = collected;

    const refundAmount = collected - totalFee;

    setEstimates({
      diffDays,
      rateText,
      baseFee,
      materialCost,
      totalFee,
      refundAmount,
      collected
    });
  };

  const handleCancel = async () => {
    if (!confirm('本当にこの企画を中止しますか？この操作は取り消せません。')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/projects/${project.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || '中止処理に失敗しました');

      toast.success('企画を中止しました');
      onCancelComplete(data); // 親コンポーネントでリダイレクト等の処理
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !estimates) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-red-500">
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <FiAlertTriangle size={32} />
            <h3 className="text-xl font-bold">企画中止の確認</h3>
          </div>

          <p className="text-gray-600 mb-6">
            企画を中止すると、再開することはできません。
            現在のステータスに基づき、以下のキャンセル料が発生し、残額が支援者に返金されます。
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6 border border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">お届けまでの日数</span>
              <span className="font-bold text-gray-800">あと {estimates.diffDays} 日</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">現在の支援総額</span>
              <span className="font-bold text-gray-800">{estimates.collected.toLocaleString()} 円</span>
            </div>
            
            <hr className="border-dashed border-gray-300 my-2"/>
            
            <div className="flex justify-between text-sm text-red-600">
              <span>基本キャンセル料 ({estimates.rateText})</span>
              <span>- {estimates.baseFee.toLocaleString()} 円</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>資材費・実費 (確定済み)</span>
              <span>- {estimates.materialCost.toLocaleString()} 円</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
              <span className="text-gray-800">支援者への返金総額</span>
              <span className="text-green-600">{estimates.refundAmount.toLocaleString()} 円</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-6 space-y-1">
            <p>※ 返金は各支援者の支援額に応じて按分されます。</p>
            <p>※ 資材費は、お花屋さんが既に手配済みの特注品（パネル等）の実費です。</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md disabled:bg-gray-400"
            >
              {loading ? '処理中...' : '同意して中止する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}