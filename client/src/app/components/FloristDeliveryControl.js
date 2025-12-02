"use client";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiTool, FiTruck, FiMapPin, FiCheck } from 'react-icons/fi';

export default function FloristDeliveryControl({ projectId, currentStatus, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  // ステータス変更APIを叩く関数
  const updateStatus = async (newStatus) => {
    if(!window.confirm(`ステータスを「${newStatus}」に変更しますか？\n（ファン全員に通知が飛びます）`)) return;

    setLoading(true);
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/production-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // API側で floristId を受け取る仕様なら user.id を送る、あるいはトークンから取る
        body: JSON.stringify({ status: newStatus, floristId: 'ME' }) // floristIdはバックエンドでtokenから取るのが安全
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      toast.success('ステータスを更新しました！');
      if (onStatusChange) onStatusChange(newStatus); // 親コンポーネントの状態も更新

    } catch (error) {
      console.error(error);
      toast.error('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-sm mt-6">
      <h3 className="font-bold text-gray-700 mb-4 flex items-center">
        <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded mr-2">花屋さん専用</span>
        進行ステータス更新
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <StatusButton 
          icon={<FiTool />} 
          label="制作開始" 
          active={currentStatus === 'PROCESSING'} 
          onClick={() => updateStatus('PROCESSING')} 
          disabled={loading}
        />
        <StatusButton 
          icon={<FiTruck />} 
          label="配送出発" 
          active={currentStatus === 'DELIVERING'} 
          onClick={() => updateStatus('DELIVERING')} 
          disabled={loading}
        />
        <StatusButton 
          icon={<FiMapPin />} 
          label="設置完了" 
          active={currentStatus === 'DELIVERED'} 
          onClick={() => updateStatus('DELIVERED')} 
          disabled={loading}
        />
        <StatusButton 
          icon={<FiCheck />} 
          label="企画完了" 
          active={currentStatus === 'COMPLETED'} 
          onClick={() => updateStatus('COMPLETED')} 
          disabled={loading}
          color="bg-green-600 hover:bg-green-700 text-white"
        />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">※ボタンを押すと支援者に通知が送信されます</p>
    </div>
  );
}

// ボタン部品
function StatusButton({ icon, label, active, onClick, disabled, color }) {
  const baseClass = "flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 border-2";
  const activeClass = active 
    ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200" 
    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50";
  
  const finalColor = color ? color : activeClass;

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClass} ${finalColor} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}