"use client";
import { FiPackage, FiTruck, FiMapPin, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function DeliveryTracker({ status }) {
  // ステータス定義 (DBの値に合わせて調整してください)
  // 例: 'ACCEPTED', 'PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED'
  
  const steps = [
    { id: 'ACCEPTED', label: '受注', icon: <FiPackage /> },
    { id: 'PROCESSING', label: '制作中', icon: <FiClock /> },
    { id: 'DELIVERING', label: '配送中', icon: <FiTruck /> },
    { id: 'DELIVERED', label: '設置完了', icon: <FiMapPin /> },
  ];

  // 現在のステータスが配列の何番目かを取得
  const currentStepIndex = steps.findIndex(s => s.id === status);
  // 見つからない場合（完了後など）は最後まで進める
  const activeIndex = currentStepIndex === -1 ? (status === 'COMPLETED' ? 4 : 0) : currentStepIndex;

  // 進捗率（%）
  const progressPercent = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        現在の状況
      </h3>

      <div className="relative mx-4">
        {/* 背景の線 (道路) */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 rounded-full -translate-y-1/2"></div>

        {/* 進捗バー (進んだ道のり) */}
        <div 
          className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* 動くトラックアイコン 🚚 */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out z-10"
          style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="bg-white p-2 rounded-full shadow-lg border-2 border-emerald-500 text-emerald-600 text-xl">
            {activeIndex >= 3 ? <FiCheckCircle /> : <FiTruck className={status === 'DELIVERING' ? 'animate-bounce' : ''} />}
          </div>
          {/* 吹き出し */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap arrow-bottom">
            {steps[activeIndex]?.label || '完了'}
          </div>
        </div>

        {/* 各ステップの点 */}
        <div className="relative flex justify-between w-full">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div 
                className={`w-4 h-4 rounded-full border-2 z-0 transition-colors duration-500 ${
                  index <= activeIndex ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
                }`}
              ></div>
              <span className={`text-xs font-bold transition-colors duration-500 ${
                index <= activeIndex ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ステータスごとのメッセージ */}
      <div className="mt-8 bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
        <p className="text-emerald-800 font-bold text-sm">
          {status === 'ACCEPTED' && "お花屋さんが注文を確認しました。制作開始までお待ちください。"}
          {status === 'PROCESSING' && "現在、お花屋さんが心を込めて制作中です💐"}
          {status === 'DELIVERING' && "お花屋さんが会場へ向かっています🚚 もうすぐ到着します！"}
          {status === 'DELIVERED' && "会場への設置が完了しました！現地写真をお楽しみに📸"}
          {status === 'COMPLETED' && "この企画は無事に完了しました。ありがとうございました！"}
        </p>
      </div>
    </div>
  );
}