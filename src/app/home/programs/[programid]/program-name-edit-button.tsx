"use client"
import EditableTypography from "@/components/EditableTypeography"
import {
  useZEditorActions,
  useZProgramName,
} from "@/hooks/zustand/program-editor-state"

export default function ProgramNameEditButton() {
  const programName = useZProgramName()
  const { setProgramName } = useZEditorActions()
  return (
    <EditableTypography
      className="text-base"
      onChange={setProgramName}
      value={programName}
    />
  )
}
