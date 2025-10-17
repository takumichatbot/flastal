'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden h-full flex flex-col">
      {/* アニメーションの親要素 */}
      <div className="animate-pulse">
        {/* 画像部分のスケルトン */}
        <div className="bg-slate-200 h-48 w-full"></div>
        <div className="p-6 space-y-4">
          {/* タイトル部分のスケルトン */}
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          {/* 企画者名部分のスケルトン */}
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          {/* プログレスバー部分のスケルトン */}
          <div className="h-2 bg-slate-200 rounded"></div>
          {/* 目標金額部分のスケルトン */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}