import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AddRowDropdownProps {
  onAddRow: (type: 'exercise' | 'circuit') => void
}

export default function AddRowDropdown({ onAddRow }: AddRowDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-accent-foreground opacity-0 transition-opacity ease-in-out focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
        >
          <Icons.plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[160px]">
        <DropdownMenuItem onClick={() => onAddRow('exercise')}>
          <Icons.dumbbell className="mr-2 h-4 w-4" />
          Add Exercise
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddRow('circuit')}>
          <Icons.repeat className="mr-2 h-4 w-4" />
          Add Circuit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
