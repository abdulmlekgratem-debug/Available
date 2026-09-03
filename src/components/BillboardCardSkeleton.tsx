interface BillboardCardSkeletonProps {
  isCompact?: boolean
}

export default function BillboardCardSkeleton({ isCompact = false }: BillboardCardSkeletonProps) {
  return (
    <div className={`relative overflow-hidden bg-card border border-border/40 flex flex-col rounded-2xl ${isCompact ? 'is-compact' : ''}`}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 z-10 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Image Section */}
      <div className="relative overflow-hidden bg-muted aspect-[4/3]">
        {/* Top Badges Skeleton */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5">
            <div className="rounded-full bg-emerald-500/25 h-5 w-14" />
            <div className="rounded-full bg-amber-400/30 h-5 w-12" />
          </div>
          <div className="rounded-full bg-muted-foreground/30 h-6 w-20" />
        </div>

        {/* Bottom Badges Skeleton */}
        <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between z-20">
          <div className="rounded-full bg-muted-foreground/25 h-5 w-24" />
          <div className="rounded-md bg-muted-foreground/25 h-4 w-16" />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-3 sm:p-3.5 gap-2 bg-card">
        {/* Title skeleton */}
        <div className="space-y-1">
          <div className="bg-muted-foreground/20 rounded h-4 w-5/6" />
          <div className="bg-muted-foreground/15 rounded h-3.5 w-1/2" />
        </div>

        {/* Location skeleton */}
        <div className="flex items-center gap-2 mt-1">
          <div className="rounded-full bg-primary/20 w-3.5 h-3.5 flex-shrink-0" />
          <div className="bg-muted-foreground/15 rounded h-3 w-2/3" />
        </div>

        {/* Action button skeleton */}
        <div className="mt-auto pt-2">
          <div className="bg-muted/80 border border-border/40 rounded-xl h-9.5 w-full" />
        </div>
      </div>
    </div>
  )
}
