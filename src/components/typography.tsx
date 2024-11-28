import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const titleVariants = cva("text-sm", {
  variants: {
    variant: {
      h1: "font-semibold tracking-tight text-4xl",
      h2: "text-xl font-semibold tracking-normal",
      h3: "text-lg font-semibold tracking-normal leading-7",
      h4: "text-md font-semibold tracking-normal leading-normal",
      p: "text-sm",
      mutedP: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

export interface TitleProps
  extends React.AllHTMLAttributes<HTMLElement>,
    VariantProps<typeof titleVariants> {}

const Typography = ({ className, variant, ...props }: TitleProps) => {
  const tagMap: Record<NonNullable<typeof variant>, string> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    p: "p",
    mutedP: "p",
  };
  const Tag: any = tagMap[variant || "p"] || "p";

  return (
    <Tag className={cn(titleVariants({ variant, className }))} {...props} />
  );
};

Typography.displayName = "Typography";

export { Typography, titleVariants };
