import { createContext, useContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { create, StoreApi, UseBoundStore, useStore } from 'zustand'

import { WorkoutChange } from '@/lib/ai/tools/diff-schema'
import {
  Block,
  Blocks,
  CircuitBlock,
  Exercise,
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
  proposedChanges: WorkoutChange[]
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
  setProposedChanges: (changes: WorkoutChange[]) => void
}

const newInitialProgram = (exercises: Exercise[]): Program => {
  const exerciseBlocks: Blocks = exercises
    .slice(0, 2)
    .map((exercise): Block => {
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

  const circuitBlock: CircuitBlock = {
    type: 'circuit',
    circuit: {
      isDefault: false,
      name: 'Circuit 1',
      description: 'Circuit 1 description',
      metadata: {
        sets: '3',
        rest: '30s',
        notes: 'Circuit 1 notes',
      },
      exercises: [
        {
          type: 'exercise',
          exercise: {
            id: exercises[2].id,
            name: exercises[2].name,
            metadata: {
              sets: '3',
              reps: '12',
              weight: '100',
              rest: '30s',
            },
          },
        },
        {
          type: 'exercise',
          exercise: {
            id: exercises[3].id,
            name: exercises[3].name,
            metadata: {
              sets: '3',
              reps: '12',
              weight: '100',
              rest: '30s',
            },
          },
        },
      ],
    },
  }

  const circuitBlock2: CircuitBlock = {
    type: 'circuit',
    circuit: {
      isDefault: false,
      name: 'Circuit 2',
      description: 'Circuit 2 description',
      metadata: {
        sets: '3',
        rest: '30s',
        notes: 'Circuit 2 notes',
      },
      exercises: [
        {
          type: 'exercise',
          exercise: {
            id: exercises[6].id,
            name: exercises[6].name,
            metadata: {
              sets: '3',
              reps: '12',
              weight: '100',
              rest: '30s',
            },
          },
        },
        {
          type: 'exercise',
          exercise: {
            id: exercises[7].id,
            name: exercises[7].name,
            metadata: {
              sets: '3',
              reps: '12',
              weight: '100',
              rest: '30s',
            },
          },
        },
      ],
    },
  }

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
        blocks: [...exerciseBlocks, circuitBlock, circuitBlock2],
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
      proposedChanges: [
        {
          type: 'add-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 3,
          exerciseIndex: 0,
          exercise: {
            type: 'exercise',
            exercise: {
              id: exercises[4].id,
              name: exercises[4].name,
              metadata: {
                sets: '3',
                reps: '12',
                weight: '100',
                rest: '30s',
              },
            },
          },
        },
        {
          type: 'add-block',
          workoutIndex: 0,
          afterBlockIndex: 0,
          block: {
            type: 'exercise',
            exercise: {
              id: exercises[4].id,
              name: exercises[4].name,
              metadata: {
                sets: '3',
                reps: '12',
                weight: '100',
                rest: '30s',
              },
            },
          },
        },
        {
          type: 'update-block',
          workoutIndex: 0,
          blockIndex: 0,
          block: {
            type: 'exercise',
            exercise: {
              id: exercises[7].id,
              name: exercises[7].name,
              metadata: {
                sets: '3',
                reps: '12',
                weight: '100',
                rest: '30s',
              },
            },
          },
        },
        {
          type: 'remove-block',
          workoutIndex: 0,
          blockIndex: 2,
        },
        {
          type: 'remove-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 3,
          exerciseIndex: 0,
        },
      ],
      id: program.id,
      isNewProgram,
      type: program.type,
      workouts: program.workouts,
      actions: {
        setWorkouts: (workouts: Workouts) => {
          set({ workouts })
        },
        setProposedChanges: (changes: WorkoutChange[]) => {
          set({ proposedChanges: changes })
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

const useZIsNewProgram = () => useEditorStore((state) => state.isNewProgram)
const useZProgramCreatedAt = () => useEditorStore((state) => state.created_at)
const useZProgramId = () => useEditorStore((state) => state.id)
const useZProgramName = () => useEditorStore((state) => state.name)
const useZProposedChanges = () =>
  useEditorStore((state) => state.proposedChanges)
const useZProgramWorkouts = () => useEditorStore((state) => state.workouts)
const useZProgramType = () => useEditorStore((state) => state.type)
const useZEditorActions = () => useEditorStore((state) => state.actions)

export {
  EditorProgramProvider,
  useZEditorActions,
  useZIsNewProgram,
  useZProgramCreatedAt,
  useZProgramId,
  useZProgramName,
  useZProgramType,
  useZProgramWorkouts,
  useZProposedChanges,
}
