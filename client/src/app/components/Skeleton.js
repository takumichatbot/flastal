'use client';

function Shimmer({ className = '' }) {
    return (
        <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:400%_100%] [animation:shimmer_1.5s_ease-in-out_infinite] rounded-lg ${className}`} />
    );
}

export function ProjectCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <Shimmer className="aspect-square rounded-none" />
            <div className="p-3 space-y-2">
                <Shimmer className="h-3 w-4/5" />
                <Shimmer className="h-3 w-2/5" />
                <Shimmer className="h-1.5 w-full rounded-full mt-3" />
            </div>
        </div>
    );
}

export function ProjectDetailSkeleton() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <Shimmer className="h-8 w-3/4" />
            <Shimmer className="h-64 w-full rounded-2xl" />
            <div className="space-y-3">
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-5/6" />
                <Shimmer className="h-4 w-4/6" />
            </div>
            <div className="flex gap-3">
                <Shimmer className="h-12 flex-1 rounded-xl" />
                <Shimmer className="h-12 w-28 rounded-xl" />
            </div>
        </div>
    );
}

export function ArtistCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <Shimmer className="aspect-square rounded-none" />
            <div className="p-3 space-y-1.5">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-2.5 w-1/2" />
            </div>
        </div>
    );
}

export function CommentSkeleton() {
    return (
        <div className="flex gap-3 py-3">
            <Shimmer className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Shimmer className="h-3 w-1/4" />
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-3/4" />
            </div>
        </div>
    );
}

export function TableRowSkeleton({ cols = 4 }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Shimmer className="h-3 w-full" />
                </td>
            ))}
        </tr>
    );
}

export function PageSkeleton() {
    return (
        <div className="min-h-screen bg-[#FAF9FF] p-6 space-y-4">
            <Shimmer className="h-8 w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
            </div>
        </div>
    );
}

export default Shimmer;
