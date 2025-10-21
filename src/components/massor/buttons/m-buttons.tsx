import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ButtonProps = React.ComponentProps<typeof Button>
interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean
}

export default function MLoadingButton({
  isLoading = false,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <Spinner className="size-4" />}
      {children}
    </Button>
  )
}
