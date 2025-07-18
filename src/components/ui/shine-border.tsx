"use client"

import { cn } from "@/lib/utils"

type TColorProp = string | string[]

interface ShineBorderProps {
  borderRadius?: number
  borderWidth?: number
  duration?: number
  color?: TColorProp
  className?: string
  children: React.ReactNode
}

/**
 * @name Shine Border
 * @description It is an animated background border effect component with easy to use and configurable props.
 * @param borderRadius defines the radius of the border.
 * @param borderWidth defines the width of the border.
 * @param duration defines the animation duration to be applied on the shining border
 * @param color a string or string array to define border color.
 * @param className defines the class name to be applied to the component
 * @param children contains react node elements.
 */
export default function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      className={cn(
        "relative min-h-[60px] w-fit min-w-[300px] rounded-(--border-radius) bg-white p-3 text-black dark:bg-black dark:text-white",
        className
      )}
      style={
        {
          "--border-radius": `${borderRadius}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={`before:mask-exclude! pointer-events-none before:absolute before:inset-0 before:size-full before:rounded-(--border-radius) before:bg-shine-size before:bg-size-[300%_300%] before:p-(--border-width) before:will-change-[background-position] before:content-[""] motion-safe:before:animate-shine before:[-webkit-mask-composite:xor]! before:[background-image:var(--background-radial-gradient)] before:[mask:var(--mask-linear-gradient)]`}
        style={
          {
            "--border-width": `${borderWidth}px`,
            "--border-radius": `${borderRadius}px`,
            "--duration": `${duration}s`,
            "--mask-linear-gradient":
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            "--background-radial-gradient": `radial-gradient(transparent,transparent, ${color instanceof Array ? color.join(",") : color},transparent,transparent)`,
          } as React.CSSProperties
        }
      />
      {children}
    </div>
  )
}
