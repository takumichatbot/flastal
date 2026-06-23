export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] pt-4 pb-24">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* タイトル */}
        <div className="h-8 w-52 rounded-xl animate-shimmer" />

        {/* サブタイトル */}
        <div className="h-4 w-72 rounded-lg animate-shimmer" />

        {/* プロジェクトカード 4枚 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
