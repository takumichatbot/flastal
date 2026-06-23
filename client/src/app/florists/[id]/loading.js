export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] pt-4 pb-24">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* プロフィールヘッダー */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full animate-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 rounded-xl animate-shimmer" />
            <div className="h-4 w-32 rounded-lg animate-shimmer" />
            <div className="h-4 w-24 rounded-lg animate-shimmer" />
          </div>
        </div>

        {/* 詳細カード */}
        <div className="space-y-4">
          <div className="h-40 rounded-2xl animate-shimmer" />
          <div className="h-32 rounded-2xl animate-shimmer" />
          <div className="h-48 rounded-2xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
