import { cn } from "@/lib/utils"

export function BasicSkeleton({ className }: { className?: string }) {
  return (
    //  3 divs in a row that get shorter in width
    <div className="space-y-2">
      <div
        className={cn(
          "h-6 w-full animate-pulse rounded-sm bg-muted",
          className
        )}
      />
      <div
        className={cn("h-6 w-4/5 animate-pulse rounded-md bg-muted", className)}
      />
      <div
        className={cn("h-6 w-3/5 animate-pulse rounded-md bg-muted", className)}
      />
    </div>
  )
}
