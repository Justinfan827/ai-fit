import { Icons } from "./icons"
import { Button, type ButtonProps } from "./ui/button"

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
      {children}
    </Button>
  )
}
