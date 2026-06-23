export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF9FF] pb-20 animate-pulse">
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-6">
        {/* 戻るリンク */}
        <div className="h-4 bg-slate-200 rounded w-32" />

        {/* ポイント残高カード */}
        <div className="bg-slate-800 rounded-[2rem] p-6 space-y-3">
          <div className="h-3 bg-slate-700 rounded w-28" />
          <div className="h-10 bg-slate-700 rounded w-40" />
          <div className="h-3 bg-slate-700 rounded w-24" />
        </div>

        {/* 履歴ヘッダー */}
        <div className="h-5 bg-slate-200 rounded w-24" />

        {/* 履歴リスト */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-slate-200 rounded w-28" />
                  <div className="h-2.5 bg-slate-100 rounded w-20" />
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
