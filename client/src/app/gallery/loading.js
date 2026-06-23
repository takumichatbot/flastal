export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF9FF] p-4 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        {/* タイトルエリア */}
        <div className="h-8 bg-slate-200 rounded-lg w-40" />

        {/* タブ行 */}
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-200 rounded-full w-20" />
          ))}
        </div>

        {/* フォトグリッド（正方形カード） */}
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-200 rounded-2xl aspect-square break-inside-avoid mb-3"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
