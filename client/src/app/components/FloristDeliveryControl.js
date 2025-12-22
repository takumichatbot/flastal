"use client";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiTool, FiTruck, FiMapPin, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function FloristDeliveryControl({ projectId, currentStatus, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  // ステータス定義
  const STATUS_STEPS = [
    { key: 'PROCESSING', label: '制作開始', icon: <FiTool />, message: 'ステータスを「制作中」に更新しますか？' },
    { key: 'DELIVERING', label: '配送出発', icon: <FiTruck />, message: 'ステータスを「配送中」に更新しますか？' },
    { key: 'DELIVERED', label: '設置完了', icon: <FiMapPin />, message: 'ステータスを「設置完了」に更新しますか？\n（完了後、必ず「前日写真」をアップロードしてください）' },
    { key: 'COMPLETED', label: '納品完了', icon: <FiCheck />, message: '全ての工程を完了としますか？' },
  ];

  // 現在のステータスのインデックスを取得 (未定義の場合は-1)
  const currentIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);

  // ステータス変更API
  const updateStatus = async (newStatus, confirmMessage) => {
    if(!window.confirm(`${confirmMessage}\n(支援者に通知が送信されます)`)) return;

    setLoading(true);
    const toastId = toast.loading('ステータスを更新中...');
    
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/production-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      toast.success('ステータスを更新しました', { id: toastId });
      if (onStatusChange) onStatusChange(newStatus);

    } catch (error) {
      console.error(error);
      toast.error('エラーが発生しました', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-lg overflow-hidden mt-6">
      
      {/* Header */}
      <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
        <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wider">FLORIST ONLY</span>
          進行管理パネル
        </h3>
      </div>
      
      {/* Controls */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_STEPS.map((step, index) => {
            // 状態判定
            const isCurrent = currentStatus === step.key;
            const isPast = currentIndex > index;
            
            return (
              <StatusButton 
                key={step.key}
                icon={step.icon}
                label={step.label}
                isCurrent={isCurrent}
                isPast={isPast}
                onClick={() => updateStatus(step.key, step.message)}
                disabled={loading}
              />
            );
          })}
        </div>
        
        <div className="mt-4 flex items-start gap-2 bg-gray-50 p-3 rounded text-xs text-gray-500 border border-gray-100">
            <FiAlertCircle className="shrink-0 mt-0.5 text-indigo-400" />
            <p>ボタンを押すと支援者に通知が飛びます。実際の作業進捗に合わせてこまめに更新しましょう。</p>
        </div>
      </div>
    </div>
  );
}

function StatusButton({ icon, label, isCurrent, isPast, onClick, disabled }) {
  // スタイルロジック
  let btnClass = "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border-2 h-full ";
  
  if (isCurrent) {
    // 現在のステータス（アクティブ）
    btnClass += "bg-indigo-600 border-indigo-600 text-white shadow-md scale-[1.02] z-10 ring-2 ring-indigo-200 ring-offset-2";
  } else if (isPast) {
    // 過去のステータス（完了済み）
    btnClass += "bg-indigo-50 border-indigo-200 text-indigo-400 hover:bg-indigo-100 opacity-80";
  } else {
    // 未来のステータス（未完了）
    btnClass += "bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50";
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${btnClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* 現在地インジケーター（Pingアニメーション） */}
      {isCurrent && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
        </span>
      )}
      
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
      
      {isCurrent && <span className="text-[10px] mt-1 opacity-90 font-normal">現在進行中</span>}
      {isPast && <span className="text-[10px] mt-1 font-bold text-indigo-300">✓ 完了</span>}
    </button>
  );
}