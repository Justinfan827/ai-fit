import { cn } from "@/lib/utils"

// display arbitrary JSON data in a scrollable container
export default function JSONContainer({
  json,
  className,
}: {
  json: unknown
  className?: string
}) {
  return (
    <div className={cn("h-[800px] w-[800px] overflow-auto", className)}>
      <pre>{JSON.stringify(json, null, 2)}</pre>
    </div>
  )
}
