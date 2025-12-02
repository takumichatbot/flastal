"use client";
import { useEffect, useState } from 'react';
import { FiCheckCircle, FiStar } from 'react-icons/fi';
import confetti from 'canvas-confetti'; // 紙吹雪用ライブラリ

export default function OfficialBadge({ projectId, isPlanner }) {
  const [status, setStatus] = useState(null);
  const [showSecretLink, setShowSecretLink] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/official-status`)
      .then(res => res.json())
      .then(data => setStatus(data));
  }, [projectId]);

  // 推しになりきってボタンを押す（テスト用）
  const handleSimulateOfficial = async () => {
    // 盛大に紙吹雪を飛ばす
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF4500'] // 金・オレンジ系
    });

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/official-react`, {
      method: 'POST'
    });
    
    setStatus({ timestamp: new Date() });
  };

  // バッジが表示されている場合
  if (status) {
    return (
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 text-yellow-800 px-4 py-2 rounded-full shadow-md animate-bounce-slow">
        <div className="bg-yellow-400 text-white rounded-full p-1">
          <FiCheckCircle />
        </div>
        <div>
          <p className="text-[10px] font-bold text-yellow-600 leading-none">OFFICIAL CHECKED</p>
          <p className="text-sm font-extrabold leading-none">推しが見ました！</p>
        </div>
      </div>
    );
  }

  // 企画者にだけ「推しへの招待リンク」機能を見せる
  if (isPlanner) {
    return (
      <div className="mt-4">
        <button 
          onClick={() => setShowSecretLink(!showSecretLink)}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          演者様への共有設定 (デバッグ用)
        </button>
        
        {showSecretLink && (
          <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300 text-xs">
            <p className="mb-2 font-bold text-gray-700">👇 推しにこのボタンを押してもらうとバッジが付きます</p>
            <button 
              onClick={handleSimulateOfficial}
              className="w-full bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-700 transition-colors"
            >
              <FiStar className="inline mr-1"/> (テスト) 推しとして「見たよ！」ボタンを押す
            </button>
            <p className="mt-2 text-[10px] text-gray-500">
              ※本来は、このアクション専用のQRコードを発行し、ファンレター等に同封する運用になります。
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}