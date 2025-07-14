import { useState } from "react"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AddRowDropdownProps {
  onAddRow: (type: "exercise" | "circuit" | "exercise-in-circuit") => void
  onOpenChange?: (open: boolean) => void
  isInCircuit?: boolean
}

export default function AddRowDropdown({
  onAddRow,
  onOpenChange,
  isInCircuit = false,
}: AddRowDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className={`h-6 w-6 cursor-pointer text-accent-foreground transition-opacity ease-in-out focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          size="icon"
          variant="ghost"
        >
          <Icons.gripVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="">
        <DropdownMenuItem onClick={() => onAddRow("exercise")}>
          <Icons.dumbbell className="mr-2 h-4 w-4" />
          Add Exercise
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddRow("circuit")}>
          <Icons.repeat className="mr-2 h-4 w-4" />
          Add Circuit
        </DropdownMenuItem>
        {isInCircuit && (
          <DropdownMenuItem onClick={() => onAddRow("exercise-in-circuit")}>
            <Icons.plus className="mr-2 h-4 w-4" />
            Add Exercise to Circuit
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
