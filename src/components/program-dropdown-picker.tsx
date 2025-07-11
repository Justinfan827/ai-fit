import { useState } from "react"

import DropdownPicker from "@/components/dropdown-picker"
import type { Program } from "@/lib/domain/workouts"

export function ProgramPicker({
  programs,
  handleSelect,
}: {
  programs: Program[]
  handleSelect: ({ value, label }: { value: string; label: string }) => void
}) {
  const [activeProgramId, setActiveProgramId] = useState("")
  const programOptions = programs.map((program) => {
    return {
      label: `${program.name}`,
      value: program.id,
    }
  })
  const activeProgram = programOptions.find((m) => m.value === activeProgramId)
  if (activeProgram) {
    programOptions.sort((x, y) =>
      x.label == activeProgram?.label
        ? -1
        : y.label == activeProgram?.label
          ? 1
          : 0
    )
  }

  const handleSelectProgram = ({
    value,
    label,
  }: {
    value: string
    label: string
  }) => {
    setActiveProgramId(value)
    handleSelect({ value, label })
  }
  return (
    <DropdownPicker
      activeValue={activeProgramId}
      handleSelect={handleSelectProgram}
      noResultsMessage="No programs found"
      options={programOptions}
      placeholder="Assign a program"
    />
  )
}
