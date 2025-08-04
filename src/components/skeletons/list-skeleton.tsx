import { cn } from "@/lib/utils"

export function ListSkeleton() {
  const skeletonIds = ["skeleton-item-1", "skeleton-item-2"]

  return (
    <div className="flex flex-col gap-4">
      {skeletonIds.map((id) => (
        <ListSkeletonItem key={id} />
      ))}
    </div>
  )
}

function ListSkeletonItem() {
  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-2 rounded-md border px-4 py-4",
        "animate-pulse"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="size-8 rounded-lg bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="size-8 rounded bg-muted" />
    </div>
  )
}
