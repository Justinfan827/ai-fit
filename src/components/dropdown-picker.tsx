import { useState } from "react"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverDialogContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Props {
  noResultsMessage: string
  options: {
    label: string
    value: string
  }[]
  activeValue: string
  handleSelect: ({ value, label }: { value: string; label: string }) => void
  placeholder: string
  disabled?: boolean
}

export default function DropdownPicker({
  options,
  disabled,
  activeValue,
  handleSelect,
  noResultsMessage,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false)
  const activeOption = options.find((option) => option.value === activeValue)

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label="Select an option"
          className={cn("w-[300px] justify-between")}
          disabled={disabled}
          role="combobox"
          variant="outline"
        >
          <p className="truncate">{activeOption?.label}</p>
          <Icons.chevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverDialogContent className="z-30 w-[300px] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{noResultsMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={(value) =>
                    handleSelect({ label: value, value: option.value })
                  }
                  value={option.label}
                >
                  <p className="truncate">{option.label}</p>
                  <Icons.check
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeValue === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverDialogContent>
    </Popover>
  )
}
