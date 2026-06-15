"use client";
import { Package, Truck, MapPin, CheckCircle2, Clock, Wrench } from 'lucide-react';

export default function DeliveryTracker({ status }) {
  // ステータス定義 (DBの値に合わせて調整してください)
  const steps = [
    { id: 'ACCEPTED', label: '受注', icon: <Package /> },
    { id: 'PROCESSING', label: '制作中', icon: <Wrench /> },
    { id: 'DELIVERING', label: '配送中', icon: <Truck /> },
    { id: 'DELIVERED', label: '設置完了', icon: <MapPin /> },
  ];

  // 現在のステータスが配列の何番目かを取得
  const currentStepIndex = steps.findIndex(s => s.id === status);
  // 見つからない場合（完了後など）は最後まで進める
  const activeIndex = currentStepIndex === -1 ? (status === 'COMPLETED' ? steps.length - 1 : 0) : currentStepIndex;

  // 進捗率（%）
  const progressPercent = Math.min((activeIndex / (steps.length - 1)) * 100, 100);

  // ステータスメッセージ
  const getStatusMessage = () => {
    switch(status) {
        case 'ACCEPTED': return "お花屋さんが注文を確認しました。制作開始までお待ちください。";
        case 'PROCESSING': return "現在、お花屋さんが心を込めて制作中です💐 完成をお楽しみに！";
        case 'DELIVERING': return "お花屋さんが会場へ向かっています🚚 もうすぐ到着します！";
        case 'DELIVERED': return "会場への設置が完了しました！現地写真のアップロードをお待ちください📸";
        case 'COMPLETED': return "この企画は無事に完了しました。ありがとうございました！";
        default: return "ステータスを確認中です...";
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden relative">
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-slate-400">
          <Truck size={100} />
      </div>

      <h3 className="text-sm font-bold text-slate-500 mb-8 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        現在の状況
      </h3>

      <div className="relative mx-4 mb-8">
        {/* 背景の線 (道路) */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 rounded-full -translate-y-1/2"></div>

        {/* 進捗バー (進んだ道のり) */}
        <div 
          className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full -translate-y-1/2 transition-all duration-1000 ease-in-out shadow-sm"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* 動くアイコン (現在地) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out z-20"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg border-2 border-emerald-500 text-emerald-600 text-xl transform transition-transform duration-500 hover:scale-110">
            {activeIndex >= steps.length - 1 ? <CheckCircle2 /> : <Truck className={status === 'DELIVERING' ? 'animate-bounce-right' : ''} />}
          </div>
          
          {/* 吹き出し (現在地ラベル) */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md transition-opacity duration-500 animate-fadeIn">
            {steps[activeIndex]?.label || '完了'}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>

        {/* 各ステップの点 */}
        <div className="relative flex justify-between w-full z-10">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center gap-3 w-10">
              <div 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                  index <= activeIndex ? 'bg-emerald-500 border-emerald-500 scale-110' : 'bg-white border-slate-300'
                }`}
              ></div>
              <div className={`flex flex-col items-center transition-opacity duration-500 ${index === activeIndex ? 'opacity-100' : 'opacity-50'}`}>
                  <span className={`text-xs font-bold whitespace-nowrap ${index <= activeIndex ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ステータスごとのメッセージエリア */}
      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center animate-fadeIn">
        <p className="text-emerald-800 font-bold text-sm flex items-center justify-center gap-2">
          <FiInfoIcon className="shrink-0"/>
          {getStatusMessage()}
        </p>
      </div>

      <style jsx global>{`
        @keyframes bounce-right {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(3px); }
        }
        .animate-bounce-right {
            animation: bounce-right 1s infinite;
        }
      `}</style>
    </div>
  );
}

// アイコンヘルパー
function FiInfoIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    )
}