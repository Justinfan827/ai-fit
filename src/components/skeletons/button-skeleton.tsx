import { cn } from "@/lib/utils"

export function ButtonSkeleton({
  className,
  ...props
}: {
  className?: string
  props?: React.ComponentProps<"div">
}) {
  return (
    <div
      className={cn("h-10 w-32 animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}
