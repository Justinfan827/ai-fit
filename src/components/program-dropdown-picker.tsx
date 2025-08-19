import { useState } from "react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/kibo-ui/combobox"
import type { Program } from "@/lib/domain/workouts"

export function ProgramPicker({
  programs,
  handleSelect,
  value: selectedValue,
}: {
  programs: Program[]
  handleSelect: ({ value, label }: { value: string; label: string }) => void
  value?: string
}) {
  const [internalValue, setInternalValue] = useState("")
  const currentValue = selectedValue ?? internalValue

  const programOptions = programs.map((program) => ({
    label: program.name,
    value: program.id,
  }))

  const handleValueChange = (newValue: string) => {
    const selectedProgram = programOptions.find(
      (option) => option.value === newValue
    )

    if (selectedProgram) {
      if (!selectedValue) {
        setInternalValue(newValue)
      }
      handleSelect({
        value: selectedProgram.value,
        label: selectedProgram.label,
      })
    }
  }

  return (
    <Combobox
      data={programOptions}
      onValueChange={handleValueChange}
      type="program"
      value={currentValue}
    >
      <ComboboxTrigger className="w-full justify-between" />
      <ComboboxContent>
        <ComboboxInput placeholder="Search programs..." />
        <ComboboxList>
          <ComboboxEmpty>No programs found</ComboboxEmpty>
          <ComboboxGroup>
            {programOptions.map((program) => (
              <ComboboxItem key={program.value} value={program.value}>
                {program.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
