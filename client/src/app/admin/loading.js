export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] pt-4 pb-24">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* タイトル */}
        <div className="h-8 w-48 rounded-xl animate-shimmer" />

        {/* グラフエリア */}
        <div className="h-64 rounded-2xl animate-shimmer" />

        {/* テーブルヘッダー */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-12 border-b border-slate-100 px-4 flex items-center gap-4">
            <div className="h-4 w-24 rounded-lg animate-shimmer" />
            <div className="h-4 w-20 rounded-lg animate-shimmer" />
            <div className="h-4 w-16 rounded-lg animate-shimmer" />
          </div>

          {/* テーブル行 6本 */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 border-b border-slate-50 px-4 flex items-center gap-4">
              <div className="h-4 w-32 rounded-lg animate-shimmer" />
              <div className="h-4 w-24 rounded-lg animate-shimmer" />
              <div className="h-4 w-16 rounded-lg animate-shimmer" />
              <div className="h-6 w-16 rounded-full animate-shimmer ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
