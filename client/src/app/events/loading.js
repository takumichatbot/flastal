export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] pt-4 pb-24">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* タイトル */}
        <div className="h-8 w-40 rounded-xl animate-shimmer" />

        {/* 検索・フィルター */}
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-xl animate-shimmer" />
          <div className="h-10 w-24 rounded-xl animate-shimmer" />
        </div>

        {/* イベントカードグリッド 6枚 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
