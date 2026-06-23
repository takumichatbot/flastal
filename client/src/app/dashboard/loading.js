export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] pt-4 pb-24">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* タイトル */}
        <div className="h-8 w-40 rounded-xl animate-shimmer" />

        {/* グラフエリア 2枚 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56 rounded-2xl animate-shimmer" />
          <div className="h-56 rounded-2xl animate-shimmer" />
        </div>

        {/* サマリーカード 4枚 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
