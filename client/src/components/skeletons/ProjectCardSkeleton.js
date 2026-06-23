export default function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="aspect-video bg-slate-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4" />
        <div className="h-3 bg-slate-200 animate-pulse rounded w-1/2" />
        <div className="h-2 bg-slate-200 animate-pulse rounded-full w-full" />
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 animate-pulse rounded w-1/4" />
          <div className="h-3 bg-slate-200 animate-pulse rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}
