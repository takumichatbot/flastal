export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] flex flex-col pb-24">
      {/* チャットヘッダー */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-slate-100 bg-white">
        <div className="w-9 h-9 rounded-full animate-shimmer flex-shrink-0" />
        <div className="h-5 w-32 rounded-lg animate-shimmer" />
      </div>

      {/* チャットバブル 5本 */}
      <div className="flex-1 px-4 py-6 space-y-4">
        {/* 相手のバブル */}
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 rounded-full animate-shimmer flex-shrink-0" />
          <div className="h-12 w-48 rounded-2xl rounded-bl-none animate-shimmer" />
        </div>
        {/* 自分のバブル */}
        <div className="flex justify-end">
          <div className="h-10 w-36 rounded-2xl rounded-br-none animate-shimmer" />
        </div>
        {/* 相手のバブル */}
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 rounded-full animate-shimmer flex-shrink-0" />
          <div className="h-16 w-56 rounded-2xl rounded-bl-none animate-shimmer" />
        </div>
        {/* 自分のバブル */}
        <div className="flex justify-end">
          <div className="h-10 w-44 rounded-2xl rounded-br-none animate-shimmer" />
        </div>
        {/* 相手のバブル */}
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 rounded-full animate-shimmer flex-shrink-0" />
          <div className="h-10 w-32 rounded-2xl rounded-bl-none animate-shimmer" />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="h-16 px-4 flex items-center gap-2 border-t border-slate-100 bg-white">
        <div className="flex-1 h-10 rounded-full animate-shimmer" />
        <div className="w-10 h-10 rounded-full animate-shimmer flex-shrink-0" />
      </div>
    </div>
  );
}
