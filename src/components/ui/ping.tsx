import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

const pingVariants = cva("", {
  variants: {
    variant: {
      default: "bg-sky-400",
      green: "bg-green-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface PingProps
  extends React.ButtonHTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pingVariants> {}
const Ping = forwardRef<HTMLButtonElement, PingProps>(
  ({ className, variant, ...props }, ref) => {
    const innerColors = () => {
      switch (variant) {
        case "default":
          return "bg-sky-500"
        case "green":
          return "bg-green-500"
        default:
          return "bg-sky-500"
      }
    }
    return (
      <span
        className={cn("relative flex h-2 w-2", className)}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            pingVariants({ variant })
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            innerColors()
          )}
        />
      </span>
    )
  }
)
Ping.displayName = "Button"

export { Ping, pingVariants }
