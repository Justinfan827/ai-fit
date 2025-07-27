"use client"

import ProgramEditor from "@/components/grid/ProgramEditor"
import { ProgramEditorSidebar } from "@/components/program-editor-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import AIGeneratedWorkoutsProvider from "@/hooks/use-workout"
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
      <div className="w-full overflow-auto">
        <ProgramEditor />
      </div>
    </EditorProgramProvider>
  )
}
