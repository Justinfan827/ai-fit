import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { Check } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useExerciseActions } from '@/store/exercises'
import { useEffect, useRef, useState } from 'react'

export type ExerciseInputPopoverProps = {
  value: string
  onSelect: (v: string) => void
}

export default function ExerciseInput({
  value,
  onSelect,
}: {
  value: string
  onSelect: (v: string) => void
}) {
  const { search } = useExerciseActions()
  const [exercises, setExercises] = useState(() => search(value)) // Initialize with the current search results
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setExercises(search(newValue)) // Update the exercises list dynamically
  }

  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  console.log('rendering input')
  const onSelectInternal = (v: string) => {
    onSelect(v)
  }
  return (
    <Combobox value={value} onChange={onSelectInternal} immediate>
      <ComboboxInput
        ref={ref}
        onChange={onChange}
        className="h-full w-full bg-neutral-950 p-2 text-sm focus-within:outline-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
      />
      <ComboboxOptions
        anchor={{
          to: 'bottom start',
          offset: '-1px',
        }}
        transition
        className="w-[calc(var(--input-width)+2px)] rounded-b-sm border border-border bg-neutral-950 p-1 text-sm shadow-lg empty:invisible"
      >
        {exercises.map((exercise) => {
          return (
            <ComboboxOption
              value={exercise.name}
              key={exercise.id}
              className="cursor-default select-none rounded-sm bg-neutral-950 p-1 focus:outline-none data-[focus]:bg-neutral-900 data-[selected]:text-accent-foreground"
            >
              {exercise.name}
            </ComboboxOption>
          )
        })}
      </ComboboxOptions>
    </Combobox>
  )
}

export function ExerciseInputPopover({
  value,
  onSelect,
}: ExerciseInputPopoverProps) {
  const [open, setOpen] = React.useState(true)

  const { search } = useExerciseActions()
  const [exercises, setExercises] = React.useState(() => search(value)) // Initialize with the current search results
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setExercises(search(newValue)) // Update the exercises list dynamically
  }

  console.log(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={
            'h-full w-full bg-neutral-950 p-2 text-sm ring-2 ring-inset ring-orange-500'
          }
        >
          {value || 'Select exercise...'}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        side="bottom"
      >
        <Command>
          <CommandInput placeholder="Search exercises..." className="h-9" />
          <CommandList>
            <CommandEmpty>No exercise found.</CommandEmpty>
            <CommandGroup>
              {exercises.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.name}
                  onSelect={(currentValue) => {
                    onSelect(currentValue)
                  }}
                >
                  {exercise.name}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === exercise.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
