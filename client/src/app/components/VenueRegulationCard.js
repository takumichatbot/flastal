import { FiCheckCircle, FiXCircle, FiTruck, FiInfo } from 'react-icons/fi';

export default function VenueRegulationCard({ venue }) {
  if (!venue) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        🏢 会場レギュレーション情報
        <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
          {venue.venueName}
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- フラスタ（スタンド花） --- */}
        <div className={`p-4 rounded-lg border ${venue.isStandAllowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold flex items-center text-slate-800">
              💐 フラスタ (スタンド花)
            </h4>
            {venue.isStandAllowed ? (
              <span className="flex items-center text-green-600 text-sm font-bold"><FiCheckCircle className="mr-1"/> 受入可</span>
            ) : (
              <span className="flex items-center text-red-600 text-sm font-bold"><FiXCircle className="mr-1"/> 受入不可</span>
            )}
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {venue.standRegulation || (venue.isStandAllowed ? '特になし (一般的なサイズ)' : 'この会場はスタンド花の受け入れを行っていません。')}
          </p>
        </div>

        {/* --- 卓上フラスタ（楽屋花） --- */}
        <div className={`p-4 rounded-lg border ${venue.isBowlAllowed ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold flex items-center text-slate-800">
              🎁 卓上フラスタ (楽屋花)
            </h4>
            {venue.isBowlAllowed ? (
              <span className="flex items-center text-blue-600 text-sm font-bold"><FiCheckCircle className="mr-1"/> 受入可</span>
            ) : (
              <span className="flex items-center text-red-600 text-sm font-bold"><FiXCircle className="mr-1"/> 受入不可</span>
            )}
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {venue.bowlRegulation || (venue.isBowlAllowed ? '特になし (一般的なサイズ)' : 'この会場は卓上花の受け入れを行っていません。')}
          </p>
        </div>
      </div>

      {/* --- 回収・搬入ルール --- */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-3">
          <FiTruck className="w-5 h-5 text-slate-500 mt-1" />
          <div>
            <p className="text-sm font-bold text-slate-700">回収ルール</p>
            <p className="text-sm text-slate-600">
              {venue.retrievalRequired 
                ? <span className="text-red-600 font-bold">⚠️ スタンド回収：必須</span> 
                : <span className="text-green-600">スタンド回収：任意 (会場処分可の場合あり)</span>
              }
            </p>
          </div>
        </div>
        
        {venue.accessInfo && (
          <div className="flex items-start gap-3 mt-3">
            <FiInfo className="w-5 h-5 text-slate-500 mt-1" />
            <div>
              <p className="text-sm font-bold text-slate-700">搬入・アクセス備考</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{venue.accessInfo}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}