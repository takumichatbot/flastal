export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        {/* ヘッダー */}
        <div className="h-8 bg-slate-200 rounded-lg w-48" />

        {/* 検索バー */}
        <div className="h-12 bg-slate-200 rounded-2xl w-full" />

        {/* カテゴリタブ */}
        <div className="flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-slate-200 rounded-full w-24 shrink-0" />
          ))}
        </div>

        {/* 商品グリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
              <div className="aspect-square bg-slate-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-5 bg-slate-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
