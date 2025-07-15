"use client"

import ProgramEditor from "@/components/grid/ProgramEditor"
import { ProgramEditorSidebar } from "@/components/program-editor-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import AIGeneratedWorkoutsProvider from "@/hooks/use-workout"
import { EditorProgramProvider } from "@/hooks/zustand/program-editor-state"
import type { ClientHomePage } from "@/lib/domain/clients"
import type { Exercise } from "@/lib/domain/workouts"

export default function ClientPage({
  trainerId,
  baseExercises,
  trainerExercises,
  availableClients = [],
}: {
  trainerId: string
  clientData?: ClientHomePage
  baseExercises: Exercise[]
  trainerExercises: Exercise[]
  availableClients?: ClientHomePage[]
}) {
  return (
    <EditorProgramProvider exercises={trainerExercises.concat(baseExercises)}>
      <AIGeneratedWorkoutsProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "30rem",
            } as React.CSSProperties
          }
        >
          <div className="w-full overflow-auto">
            <ProgramEditor />
          </div>
          <ProgramEditorSidebar
            availableClients={availableClients}
            exercises={trainerExercises}
            side="right"
            trainerId={trainerId}
          />
        </SidebarProvider>
      </AIGeneratedWorkoutsProvider>
    </EditorProgramProvider>
  )
}
