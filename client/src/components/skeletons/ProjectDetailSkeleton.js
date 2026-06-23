export default function ProjectDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="aspect-video bg-slate-200 rounded-2xl" />
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded-full w-full" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
      </div>
      <div className="space-y-2">
        {[1,2,3,4].map(i => <div key={i} className="h-4 bg-slate-200 rounded" style={{width: `${85 - i*5}%`}} />)}
      </div>
    </div>
  );
}
