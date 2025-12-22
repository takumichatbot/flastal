import { 
  FiCheckCircle, 
  FiXCircle, 
  FiTruck, 
  FiInfo, 
  FiAlertTriangle,
  FiMapPin
} from 'react-icons/fi';

export default function VenueRegulationCard({ venue }) {
  if (!venue) return null;

  // ステータスバッジのコンポーネント（再利用のため）
  const StatusBadge = ({ isAllowed, label }) => {
    return isAllowed ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
        <FiCheckCircle />
        {label || '受入可'}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
        <FiXCircle />
        {label || '受入不可'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* --- ヘッダーエリア --- */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          🏢 会場レギュレーション
        </h3>
        <div className="flex items-center text-sm text-slate-600 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
          <FiMapPin className="mr-1.5 text-slate-400" />
          <span className="font-medium truncate max-w-[200px] sm:max-w-none">
            {venue.venueName}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* --- メイン：フラスタ・楽屋花の可否グリッド --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. スタンド花（フラスタ） */}
          <div className="flex flex-col h-full">
            <div className={`flex-1 p-5 rounded-xl border ${venue.isStandAllowed ? 'bg-white border-green-100 shadow-[0_2px_8px_-2px_rgba(34,197,94,0.15)]' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  💐 スタンド花 <span className="text-xs font-normal text-slate-500">(フラスタ)</span>
                </h4>
                <StatusBadge isAllowed={venue.isStandAllowed} />
              </div>
              
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                {venue.standRegulation || (venue.isStandAllowed ? 'サイズ指定などの特記事項はありません。' : 'この会場へのスタンド花搬入は禁止されています。')}
              </div>

              {/* 回収ルールの強調表示 (スタンド花セクション内に配置) */}
              {venue.isStandAllowed && (
                <div className={`mt-4 rounded-lg p-3 text-sm flex items-start gap-3 ${venue.retrievalRequired ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-slate-50 border border-slate-100 text-slate-600'}`}>
                  {venue.retrievalRequired ? (
                    <FiAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <FiTruck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`block font-bold mb-0.5 ${venue.retrievalRequired ? 'text-amber-700' : 'text-slate-700'}`}>
                      {venue.retrievalRequired ? '回収が必須です' : '回収は任意です'}
                    </span>
                    <span className="text-xs opacity-90">
                      {venue.retrievalRequired 
                        ? '公演終了後の回収手配が必要です。注文時に必ず花屋へ依頼してください。'
                        : '会場処分が可能な場合がありますが、基本的には回収依頼を推奨します。'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. 卓上花（楽屋花） */}
          <div className="flex flex-col h-full">
            <div className={`flex-1 p-5 rounded-xl border ${venue.isBowlAllowed ? 'bg-white border-blue-100 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15)]' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  🎁 楽屋花 <span className="text-xs font-normal text-slate-500">(卓上サイズ)</span>
                </h4>
                <StatusBadge isAllowed={venue.isBowlAllowed} />
              </div>
              
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {venue.bowlRegulation || (venue.isBowlAllowed ? 'サイズ指定などの特記事項はありません。' : 'この会場への楽屋花（卓上花）搬入は禁止されています。')}
              </div>
            </div>
          </div>

        </div>

        {/* --- 補足情報：搬入アクセスなど --- */}
        {venue.accessInfo && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <div className="bg-slate-100 p-2 rounded-full shrink-0">
                <FiInfo className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-800 mb-1">搬入・アクセス備考</h5>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {venue.accessInfo}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}