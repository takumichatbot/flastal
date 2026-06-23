export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF9FF] p-4 animate-pulse">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        {/* ヘッダー */}
        <div className="h-8 bg-slate-200 rounded-lg w-40" />

        {/* タブ */}
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 rounded-full w-32" />
          <div className="h-10 bg-slate-200 rounded-full w-32" />
        </div>

        {/* ランキングリスト */}
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white"
            >
              {/* 順位アイコン */}
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              {/* サムネイル */}
              <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
              {/* テキスト */}
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 rounded-full w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                <div className="h-1.5 bg-slate-100 rounded-full w-full" />
              </div>
              {/* 数値 */}
              <div className="space-y-1.5 shrink-0 text-right">
                <div className="h-3.5 bg-slate-200 rounded-full w-16" />
                <div className="h-2.5 bg-slate-100 rounded-full w-10 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
