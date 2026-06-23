export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] pt-4 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-3">
        {/* タイトル */}
        <div className="h-8 w-32 rounded-xl animate-shimmer" />

        {/* 通知行 8本 */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-10 h-10 rounded-full animate-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded-lg animate-shimmer" />
              <div className="h-3 w-1/3 rounded-lg animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
