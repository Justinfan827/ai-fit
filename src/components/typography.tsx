import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const titleVariants = cva("text-sm", {
  variants: {
    variant: {
      display: "font-bold text-8xl tracking-wide",
      displaySubtitle: "text-xl tracking-wide",
      h1: "font-semibold text-4xl tracking-tight",
      h2: "font-semibold text-xl tracking-normal",
      h3: "font-semibold text-lg leading-7 tracking-normal",
      h4: "font-semibold text-md leading-normal tracking-normal",
      p: "text-sm",
      mutedP: "text-muted-foreground text-sm",
    },
  },
  defaultVariants: {
    variant: "p",
  },
})

export interface TitleProps
  extends React.AllHTMLAttributes<HTMLElement>,
    VariantProps<typeof titleVariants> {}

const Tp = ({ className, variant, ...props }: TitleProps) => {
  const tagMap: Record<NonNullable<typeof variant>, string> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    p: "p",
    mutedP: "p",
    displaySubtitle: "h1",
    display: "h1",
  }
  const Tag: any = tagMap[variant || "p"] || "p"

  return (
    <Tag className={cn(titleVariants({ variant, className }))} {...props} />
  )
}

Tp.displayName = "Typography"

export { Tp, titleVariants }
