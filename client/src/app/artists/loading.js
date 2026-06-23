export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF9FF] p-4 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        {/* ヘッダー */}
        <div className="h-8 bg-slate-200 rounded-lg w-40" />

        {/* 検索バー */}
        <div className="h-12 bg-slate-200 rounded-2xl w-full" />

        {/* カテゴリタブ */}
        <div className="flex gap-2 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-9 bg-slate-200 rounded-full w-24 shrink-0" />
          ))}
        </div>

        {/* アーティストカードグリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
              <div className="flex gap-1 justify-center">
                <div className="h-5 bg-slate-200 rounded-full w-12" />
                <div className="h-5 bg-slate-200 rounded-full w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
