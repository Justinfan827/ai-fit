import { Button } from "@/components/ui/button"
import { Icons } from "../icons"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string
}

export default function PlusButton({ text, ...props }: ButtonProps) {
  return (
    <Button
      className="font-normal text-sm"
      size="sm"
      variant="dashed"
      {...props}
    >
      <Icons.plus className="h-4 w-4 rounded-full" />
      {text}
    </Button>
  )
}
