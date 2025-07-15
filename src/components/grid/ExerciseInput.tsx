import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react"
import { useEffect, useRef, useState } from "react"
import { useZEditorActions } from "@/hooks/zustand/program-editor-state"
import type { Exercise } from "@/lib/domain/workouts"

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
  onSelectExercise,
  onBlur,
}: {
  value: string
  onSelectExercise: (exercise: Exercise) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}) {
  const { search } = useZEditorActions()
  const [exercises, setExercises] = useState(() => search(value)) // Initialize with the current search results
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setExercises(search(newValue)) // Update the exercises list dynamically
  }

  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])

  const onSelectInternal = (exerciseName: string) => {
    // Find the full exercise object by name
    const selectedExercise = exercises.find((ex) => ex.name === exerciseName)
    if (selectedExercise) {
      onSelectExercise(selectedExercise)
    }
  }

  return (
    <Combobox immediate onChange={onSelectInternal} value={value}>
      <ComboboxInput
        className="h-full w-full bg-neutral-950 py-2 text-sm focus-within:outline-hidden focus:outline-hidden"
        onBlur={onBlur}
        onChange={onChange}
        ref={ref}
      />
      <ComboboxOptions
        anchor={{
          to: "bottom start",
          offset: "-9px",
          gap: "8px",
        }}
        className="w-[calc(var(--input-width)+18px)] rounded-b-sm border border-border bg-neutral-950 p-1 text-sm shadow-lg empty:invisible"
        transition
      >
        {exercises.map((exercise) => {
          return (
            <ComboboxOption
              className="cursor-default select-none rounded-sm bg-neutral-950 p-1 focus:outline-hidden data-focus:bg-neutral-900 data-selected:text-accent-foreground"
              key={exercise.id}
              value={exercise.name}
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
