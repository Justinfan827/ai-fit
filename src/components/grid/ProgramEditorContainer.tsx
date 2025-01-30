'use client'

import { EditorProgramProvider } from '@/hooks/zustand/program-editor'
import { Exercise, Program } from '@/lib/domain/workouts'
import ProgramEditor from './ProgramEditor'

export default function ProgramEditorContainer({
  serverProgram,
  serverExercises,
}: {
  serverProgram?: Program
  serverExercises: Exercise[]
}) {
  return (
    <EditorProgramProvider
      initialProgram={serverProgram}
      exercises={serverExercises}
    >
      <ProgramEditor />
    </EditorProgramProvider>
  )
}
