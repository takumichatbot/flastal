import ProjectCardSkeleton from '@/components/skeletons/ProjectCardSkeleton';
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="h-8 bg-slate-200 animate-pulse rounded w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({length: 12}).map((_, i) => <ProjectCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
