"use client"

import { EditorProgramProvider } from "@/hooks/zustand/program-editor-state"
import type { Exercise, Program } from "@/lib/domain/workouts"
import ProgramEditor from "./ProgramEditor"

export default function ProgramEditorContainer({
  serverProgram,
  serverExercises,
}: {
  serverProgram?: Program
  serverExercises: Exercise[]
}) {
  return (
    <EditorProgramProvider
      exercises={serverExercises}
      initialProgram={serverProgram}
    >
      <ProgramEditor />
    </EditorProgramProvider>
  )
}
