import { cn } from '@/lib/utils'
import { Icons } from './icons'
import { Button, ButtonProps } from './ui/button'

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean
}

export default function LoadingButton({
  isLoading,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <Icons.spinner className="absolute h-5 w-5 animate-spin" />}
      <span className={cn(isLoading ? 'opacity-30' : 'opacity-100')}>
        {children}
      </span>
    </Button>
  )
}
