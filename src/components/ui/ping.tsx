import { cn } from '@/lib/utils'
import { cva, VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

const pingVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-sky-400',
      green: 'bg-green-400',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface PingProps
  extends React.ButtonHTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pingVariants> {}
const Ping = forwardRef<HTMLButtonElement, PingProps>(
  ({ className, variant, ...props }, ref) => {
    const innerColors = () => {
      switch (variant) {
        case 'default':
          return 'bg-sky-500'
        case 'green':
          return 'bg-green-500'
        default:
          return 'bg-sky-500'
      }
    }
    return (
      <span
        ref={ref}
        className={cn('relative flex h-2 w-2', className)}
        {...props}
      >
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            pingVariants({ variant })
          )}
        ></span>
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            innerColors()
          )}
        ></span>
      </span>
    )
  }
)
Ping.displayName = 'Button'

export { Ping, pingVariants }
