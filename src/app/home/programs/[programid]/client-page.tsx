"use client"

import ProgramEditor from "@/components/grid/ProgramEditor"
import { EditorProgramProvider } from "@/hooks/zustand/program-editor-state"
import type { ClientHomePage } from "@/lib/domain/clients"
import type { Exercise, Program } from "@/lib/domain/workouts"

export default function ClientPage({
  trainerId,
  baseExercises,
  trainerExercises,
  program,
  availableClients = [],
}: {
  trainerId: string
  clientData?: ClientHomePage
  baseExercises: Exercise[]
  trainerExercises: Exercise[]
  program: Program
  availableClients?: ClientHomePage[]
}) {
  return (
    <EditorProgramProvider
      exercises={trainerExercises.concat(baseExercises)}
      initialProgram={program}
    >
      <ProgramEditor />
    </EditorProgramProvider>
  )
}
