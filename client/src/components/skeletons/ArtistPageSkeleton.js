export default function ArtistPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="max-w-4xl mx-auto px-4 -mt-12 space-y-6">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 rounded-full bg-slate-300 border-4 border-white" />
          <div className="space-y-2 pb-2">
            <div className="h-6 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}
