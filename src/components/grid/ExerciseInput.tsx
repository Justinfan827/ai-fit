import { usezEditorActions } from '@/hooks/zustand/program-editor'
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { useEffect, useRef, useState } from 'react'

export type ExerciseInputPopoverProps = {
  value: string
  onSelect: (v: string) => void
}

/*
 * Exercise input is a smart input that will have a popover dropdown
 * for users to select exercises.
 */
export default function ExerciseInput({
  value,
  onSelect,
  onBlur,
}: {
  value: string
  onSelect: (v: string) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}) {
  const { search } = usezEditorActions()
  const [exercises, setExercises] = useState(() => search(value)) // Initialize with the current search results
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setExercises(search(newValue)) // Update the exercises list dynamically
  }

  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  const onSelectInternal = (v: string) => {
    onSelect(v)
  }
  return (
    <Combobox value={value} onChange={onSelectInternal} immediate>
      <ComboboxInput
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        className="h-full w-full bg-neutral-950 py-2 text-sm focus-within:outline-hidden focus:outline-hidden"
      />
      <ComboboxOptions
        anchor={{
          to: 'bottom start',
          offset: '-9px',
          gap: '8px',
        }}
        transition
        className="border-border w-[calc(var(--input-width)+18px)] rounded-b-sm border bg-neutral-950 p-1 text-sm shadow-lg empty:invisible"
      >
        {exercises.map((exercise) => {
          return (
            <ComboboxOption
              value={exercise.name}
              key={exercise.id}
              className="data-selected:text-accent-foreground cursor-default rounded-sm bg-neutral-950 p-1 select-none focus:outline-hidden data-focus:bg-neutral-900"
            >
              {exercise.name}
            </ComboboxOption>
          )
        })}
      </ComboboxOptions>
    </Combobox>
  )
}

// export function ExerciseInputPopover({
//   value,
//   onSelect,
// }: ExerciseInputPopoverProps) {
//   const [open, setOpen] = React.useState(true)
//
//   const { search } = useExerciseActions()
//   const [exercises, setExercises] = React.useState(() => search(value)) // Initialize with the current search results
//   const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newValue = e.target.value
//     setExercises(search(newValue)) // Update the exercises list dynamically
//   }
//
//   console.log(value)
//
//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <div
//           className={
//             'h-full w-full bg-neutral-950 p-2 text-sm ring-2 ring-inset ring-orange-500'
//           }
//         >
//           {value || 'Select exercise...'}
//         </div>
//       </PopoverTrigger>
//       <PopoverContent
//         className="w-(--radix-popover-trigger-width) p-0"
//         side="bottom"
//       >
//         <Command>
//           <CommandInput placeholder="Search exercises..." className="h-9" />
//           <CommandList>
//             <CommandEmpty>No exercise found.</CommandEmpty>
//             <CommandGroup>
//               {exercises.map((exercise) => (
//                 <CommandItem
//                   key={exercise.id}
//                   value={exercise.name}
//                   onSelect={(currentValue) => {
//                     onSelect(currentValue)
//                   }}
//                 >
//                   {exercise.name}
//                   <Check
//                     className={cn(
//                       'ml-auto',
//                       value === exercise.name ? 'opacity-100' : 'opacity-0'
//                     )}
//                   />
//                 </CommandItem>
//               ))}
//             </CommandGroup>
//           </CommandList>
//         </Command>
//       </PopoverContent>
//     </Popover>
//   )
// }
