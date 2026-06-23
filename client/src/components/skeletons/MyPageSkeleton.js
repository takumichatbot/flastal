export default function MyPageSkeleton() {
  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
      </div>
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
    </div>
  );
}
