'use client'

import ProgramEditor from '@/components/grid/ProgramEditor'
import { ProgramEditorSidebar } from '@/components/program-editor-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { EditorProgramProvider } from '@/hooks/zustand/program-editor'
import { ClientHomePage } from '@/lib/domain/clients'
import { Exercise } from '@/lib/domain/workouts'

export default function ClientPage({
  trainerId,
  clientData,
  baseExercises,
  trainerExercises,
}: {
  trainerId: string
  clientData: ClientHomePage
  baseExercises: Exercise[]
  trainerExercises: Exercise[]
}) {
  return (
    <EditorProgramProvider exercises={trainerExercises.concat(baseExercises)}>
      <SidebarProvider
        style={{
          '--sidebar-width': '30rem',
        }}
      >
        <div className="w-full overflow-auto">
          <ProgramEditor />
        </div>
        <ProgramEditorSidebar
          exercises={trainerExercises}
          trainerId={trainerId}
          client={clientData}
          side="right"
        />
      </SidebarProvider>
    </EditorProgramProvider>
  )
}
