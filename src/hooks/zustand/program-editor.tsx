import { createContext, useContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { create, StoreApi, UseBoundStore, useStore } from 'zustand'

import {
  Exercise,
  ExerciseBlockSchema,
  Program,
  Workouts,
} from '@/lib/domain/workouts'
import Fuse from 'fuse.js'

const EditorStoreContext = createContext<UseBoundStore<
  StoreApi<EditorState>
> | null>(null)

type ProgramState = {
  id: string
  created_at: string
  name: string
  type: 'weekly' | 'splits'
  workouts: Workouts
}

interface EditorState extends ProgramState {
  isNewProgram: boolean
  exercises: Exercise[]
  actions: WorkoutActions
}

type WorkoutActions = {
  search: (query: string) => Exercise[]
  setProgramType: (pType: 'weekly' | 'splits') => void
  setProgramName: (name: string) => void
  setWorkouts: (workouts: Workouts) => void
}

const newInitialProgram = (exercises: Exercise[]): ProgramState => {
  const exerciseBlocks: ExerciseBlockSchema[] = exercises
    .slice(0, 2)
    .map((exercise) => {
      return {
        type: 'exercise',
        exercise: {
          id: exercise.id,
          name: exercise.name,
          metadata: {
            sets: '3',
            reps: '12',
            weight: '100',
            rest: '30s',
          },
        },
      }
    })
  return {
    id: uuidv4().toString(),
    created_at: new Date().toISOString(),
    name: 'New Program',
    type: 'weekly',
    workouts: [
      {
        id: uuidv4().toString(),
        name: 'workout 1',
        program_id: uuidv4().toString(), // populated on create
        program_order: 0,
        blocks: exerciseBlocks,
      },
    ],
  }
}

// https://tkdodo.eu/blog/zustand-and-react-context
const EditorProgramProvider = ({
  children,
  exercises,
  initialProgram,
}: {
  children: React.ReactNode
  exercises: Exercise[]
  initialProgram?: Program
}) => {
  const program = initialProgram || newInitialProgram(exercises)
  const isNewProgram = !initialProgram
  const [store] = useState(() =>
    create<EditorState>((set, get) => ({
      exercises,
      created_at: program.created_at,
      name: program.name,
      id: program.id,
      isNewProgram,
      type: program.type,
      workouts: program.workouts,
      actions: {
        setWorkouts: (workouts: Workouts) => {
          set({ workouts })
        },
        setProgramType: (pType: 'weekly' | 'splits') => {
          set({ type: pType })
        },
        setProgramName: (name: string) => {
          set({ name })
        },
        search: (query = '') => {
          const { exercises } = get()
          const fuse = new Fuse(exercises, {
            includeScore: true,
            keys: [
              {
                name: 'name',
                weight: 1,
              },
            ],
          })
          const result = fuse.search(query, {
            limit: 10,
          })
          return result.map((r) => r.item)
        },
      },
    }))
  )

  return (
    <EditorStoreContext.Provider value={store}>
      {children}
    </EditorStoreContext.Provider>
  )
}

const useEditorStore = <T,>(selector: (state: EditorState) => T): T => {
  const store = useContext(EditorStoreContext)
  if (!store) {
    throw new Error('Missing EditorStoreContext')
  }
  return useStore(store, selector)
}

const usezIsNewProgram = () => useEditorStore((state) => state.isNewProgram)
const usezProgramCreatedAt = () => useEditorStore((state) => state.created_at)
const usezProgramId = () => useEditorStore((state) => state.id)
const usezProgramName = () => useEditorStore((state) => state.name)
const usezProgramWorkouts = () => useEditorStore((state) => state.workouts)
const usezProgramType = () => useEditorStore((state) => state.type)
const usezEditorActions = () => useEditorStore((state) => state.actions)

export {
  EditorProgramProvider,
  usezEditorActions,
  usezIsNewProgram,
  usezProgramCreatedAt,
  usezProgramId,
  usezProgramName,
  usezProgramType,
  usezProgramWorkouts,
}
