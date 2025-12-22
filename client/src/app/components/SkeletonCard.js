'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
      <div className="animate-pulse flex flex-col h-full">
        
        {/* 画像エリア (aspect-video を維持) */}
        <div className="relative aspect-video bg-slate-200 w-full">
           {/* ステータスバッジのプレースホルダー (左上) */}
           <div className="absolute top-3 left-3 w-16 h-6 bg-slate-300 rounded-full"></div>
        </div>

        {/* コンテンツエリア */}
        <div className="p-5 flex flex-col flex-grow">
          
          {/* タイトル (2行分を想定して高さを確保) */}
          <div className="space-y-2 mb-4">
            <div className="h-5 bg-slate-200 rounded w-11/12"></div>
            <div className="h-5 bg-slate-200 rounded w-2/3"></div>
          </div>

          {/* 補足情報 (場所・日付のアイコンとテキスト) */}
          <div className="space-y-2 mb-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-200 rounded-full shrink-0"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-200 rounded-full shrink-0"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
             </div>
          </div>

          {/* レイアウト調整用スペーサー */}
          <div className="mt-auto"></div>

          {/* 進捗バー周り */}
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
                <div className="h-6 bg-slate-200 rounded w-12"></div> {/* %表示 */}
                <div className="h-3 bg-slate-200 rounded w-20"></div> {/* 残りpt */}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2"></div>
          </div>

          {/* フッター (企画者情報) */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
             <div className="w-5 h-5 bg-slate-200 rounded-full shrink-0"></div> {/* アバター */}
             <div className="h-3 bg-slate-200 rounded w-24"></div> {/* 名前 */}
          </div>

        </div>
      </div>
    </div>
  );
}