'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiAlertTriangle, FiX, FiInfo, FiCalendar, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProjectCancelModal({ isOpen, onClose, project, onCancelComplete }) {
  const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // 同意チェックボックス用
  const [estimates, setEstimates] = useState(null);

  // モーダルが開くたびにリセット＆計算
  useEffect(() => {
    if (isOpen && project) {
      calculateEstimates();
      setIsConfirmed(false);
    }
  }, [isOpen, project]);

  const calculateEstimates = () => {
    const now = new Date();
    const deliveryDate = new Date(project.deliveryDateTime);
    const diffTime = deliveryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 残り日数

    // キャンセル料率の判定ロジック
    let rate = 0;
    let rateLabel = "無料期間";
    let alertLevel = "low"; // low, medium, high

    if (diffDays <= 3) {
      rate = 1.0;
      rateLabel = "100% (直前キャンセル)";
      alertLevel = "high";
    } else if (diffDays <= 7) {
      rate = 0.5;
      rateLabel = "50% (配送準備期間)";
      alertLevel = "medium";
    } else {
      rate = 0.0;
      rateLabel = "0% (早期キャンセル)";
      alertLevel = "low";
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
      rate,
      rateLabel,
      alertLevel,
      baseFee,
      materialCost,
      totalFee,
      refundAmount,
      collected
    });
  };

  const handleCancel = async () => {
    if (!isConfirmed) return;
    
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
      onCancelComplete(data);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !estimates) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ヘッダー: 警告レベルに応じて色を変える */}
        <div className={`p-5 flex items-center gap-3 border-b ${
            estimates.alertLevel === 'high' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className={`p-2 rounded-full ${estimates.alertLevel === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">企画の中止手続き</h3>
            <p className="text-xs text-gray-500">この操作は取り消すことができません</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 p-2">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* 日程情報 */}
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6 text-sm">
            <div className="flex items-center gap-2 text-blue-800">
                <FiCalendar /> お届け予定日まで
            </div>
            <div className="font-bold text-blue-900 text-lg">
                あと {estimates.diffDays} 日
            </div>
          </div>

          {/* 計算明細 (レシート風) */}
          <div className="border border-gray-200 rounded-xl p-5 mb-6 space-y-3 bg-gray-50/50">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">精算シミュレーション</h4>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">現在の支援総額</span>
              <span className="font-bold text-gray-900">{estimates.collected.toLocaleString()} 円</span>
            </div>

            <div className="h-px bg-gray-200 my-2"></div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-red-600 flex items-center gap-1">
                キャンセル料 <span className="text-[10px] bg-red-100 px-1.5 py-0.5 rounded">{estimates.rateLabel}</span>
              </span>
              <span className="text-red-600 font-medium">- {estimates.baseFee.toLocaleString()} 円</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-red-600 flex items-center gap-1">
                資材実費 (確定分)
                {estimates.materialCost > 0 && <FiInfo className="text-gray-400" title="花屋さんが既に手配した資材の代金です"/>}
              </span>
              <span className="text-red-600 font-medium">- {estimates.materialCost.toLocaleString()} 円</span>
            </div>

            <div className="h-px bg-gray-300 my-2"></div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">支援者への返金総額</span>
              <span className="font-bold text-xl text-green-600">{estimates.refundAmount.toLocaleString()} 円</span>
            </div>
          </div>

          {/* 注意書き */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 leading-relaxed">
            <ul className="list-disc pl-4 space-y-1">
                <li>企画ページは「中止」ステータスに変更され、以後の支援は受け付けられません。</li>
                <li>支援者には自動で中止通知と返金案内メールが送信されます。</li>
                <li>お花屋さんとのチャットルームは引き続き利用可能です（事後連絡用）。</li>
            </ul>
          </div>

          {/* 同意チェックボックス */}
          <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
            <div className="relative flex items-center mt-0.5">
                <input 
                    type="checkbox" 
                    checked={isConfirmed} 
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-red-500 checked:bg-red-500 focus:ring-2 focus:ring-red-500/20" 
                />
                <FiCheck className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" size={14} />
            </div>
            <span className="text-sm font-bold text-gray-700 select-none">
                上記の内容を確認し、企画の中止に同意します。
                <span className="block text-xs text-red-500 font-normal mt-0.5">※この操作は取り消せません</span>
            </span>
          </label>
        </div>

        {/* フッターアクション */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleCancel}
            disabled={!isConfirmed || loading}
            className={`
                flex-1 py-3 px-4 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2
                ${!isConfirmed || loading ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5'}
            `}
          >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                '中止を確定する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}