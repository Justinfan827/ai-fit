import { createContext, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { create, StoreApi, UseBoundStore, useStore } from 'zustand'

import { mergeWorkoutWithProposedChanges } from '@/components/grid/workout-merge'
import { WorkoutChange } from '@/lib/ai/tools/diff-schema'
import {
  Block,
  Blocks,
  CircuitBlock,
  Exercise,
  Program,
  Workout,
  Workouts,
} from '@/lib/domain/workouts'
import Fuse from 'fuse.js'

const EditorStoreContext = createContext<UseBoundStore<
  StoreApi<EditorState>
> | null>(null)

interface WorkoutHistory {
  history: Workout[]
  currentIndex: number
}

type ProgramState = {
  id: string
  created_at: string
  name: string
  type: 'weekly' | 'splits'
  workouts: Workouts
  proposedChanges: WorkoutChange[]
  currentChangeId: string | null
  workoutHistories: Record<string, WorkoutHistory>
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
  setCurrentChangeId: (changeId: string | null) => void
  applyPendingProposalById: (proposalId: string) => void
  rejectPendingProposalById: (proposalId: string) => void

  // History actions
  saveWorkoutToHistory: (workoutId: string, workout: Workout) => void
  undoWorkout: (workoutId: string) => void
  redoWorkout: (workoutId: string) => void
  canUndoWorkout: (workoutId: string) => boolean
  canRedoWorkout: (workoutId: string) => boolean
  resetWorkoutHistory: (workoutId: string, workout: Workout) => void
  getCurrentWorkout: (workoutId: string) => Workout | undefined
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
export const sortProposedChanges = (changes: WorkoutChange[]) => {
  return changes.sort((a, b) => {
    // first sort by workout index
    const aWorkoutIndex = a.workoutIndex
    const bWorkoutIndex = b.workoutIndex
    if (aWorkoutIndex !== bWorkoutIndex) {
      return aWorkoutIndex - bWorkoutIndex
    }

    // then sort by the appropriate index based on change type
    const getChangeIndex = (change: WorkoutChange): number => {
      switch (change.type) {
        case 'update-block':
        case 'remove-block':
        case 'add-block':
          return change.blockIndex
        case 'add-circuit-exercise':
        case 'remove-circuit-exercise':
        case 'update-circuit-exercise':
          return change.circuitBlockIndex
        default:
          return 0
      }
    }

    const aIndex = getChangeIndex(a)
    const bIndex = getChangeIndex(b)
    return aIndex - bIndex
  })
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
  const sortedProposedChanges = sortProposedChanges([
    {
      id: uuidv4(),
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
      id: uuidv4(),
      type: 'add-block',
      workoutIndex: 0,
      blockIndex: 0,
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
      id: uuidv4(),
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
      id: uuidv4(),
      type: 'remove-block',
      workoutIndex: 0,
      blockIndex: 2,
    },
    {
      id: uuidv4(),
      type: 'remove-circuit-exercise',
      workoutIndex: 0,
      circuitBlockIndex: 3,
      exerciseIndex: 0,
    },
  ])
  // merge proposed changes with workouts
  const mergedWorkouts = program.workouts.map((workout) => {
    return mergeWorkoutWithProposedChanges(workout, sortedProposedChanges)
  })
  const programWithMergedWorkouts = {
    ...program,
    workouts: mergedWorkouts,
  }

  // Initialize workout histories for initial workouts
  const initialWorkoutHistories: Record<string, WorkoutHistory> = {}
  programWithMergedWorkouts.workouts.forEach((workout) => {
    initialWorkoutHistories[workout.id] = {
      history: [workout],
      currentIndex: 0,
    }
  })

  const [store] = useState(() =>
    create<EditorState>((set, get) => ({
      exercises,
      created_at: programWithMergedWorkouts.created_at,
      name: programWithMergedWorkouts.name,
      proposedChanges: sortedProposedChanges,
      id: programWithMergedWorkouts.id,
      isNewProgram,
      type: programWithMergedWorkouts.type,
      workouts: programWithMergedWorkouts.workouts,
      currentChangeId: null,
      workoutHistories: initialWorkoutHistories,
      actions: {
        setWorkouts: (workouts: Workouts) => {
          const { workoutHistories } = get()
          const updatedHistories = { ...workoutHistories }

          // Initialize history for any new workouts
          workouts.forEach((workout) => {
            if (!updatedHistories[workout.id]) {
              updatedHistories[workout.id] = {
                history: [workout],
                currentIndex: 0,
              }
            }
          })

          set({ workouts, workoutHistories: updatedHistories })
        },
        setProposedChanges: (changes: WorkoutChange[]) => {
          set({ proposedChanges: changes })
        },
        setCurrentChangeId: (changeId: string | null) => {
          set({ currentChangeId: changeId })
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
        applyPendingProposalById: (proposalId: string) => {
          const { workouts, proposedChanges } = get()

          // Find the proposal to determine its type
          const proposal = proposedChanges.find((p) => p.id === proposalId)
          if (!proposal) return

          console.log('applying proposal', proposal)
          const updatedWorkouts = workouts.map((workout) => {
            return {
              ...workout,
              blocks: workout.blocks
                .map((block) => {
                  if (block.pendingStatus?.proposalId === proposalId) {
                    console.log('found block', block, proposal)
                  }
                  if (
                    proposal.type === 'remove-block' &&
                    block.pendingStatus?.proposalId === proposalId
                  ) {
                    console.log('removing block', block)
                    // Remove the block entirely
                    return null
                  }

                  // Check if this block has a pending status with the matching proposalId
                  if (block.pendingStatus?.proposalId === proposalId) {
                    // Remove the pendingStatus for non-removal proposals
                    const { pendingStatus, ...blockWithoutPending } = block
                    return blockWithoutPending
                  }

                  // For circuit blocks, also check exercises within the circuit
                  if (block.type === 'circuit') {
                    return {
                      ...block,
                      circuit: {
                        ...block.circuit,
                        exercises: block.circuit.exercises
                          .map((exercise) => {
                            // Handle circuit exercise removals
                            if (
                              proposal.type === 'remove-circuit-exercise' &&
                              exercise.pendingStatus?.proposalId === proposalId
                            ) {
                              // Remove the exercise entirely
                              return null
                            }

                            if (
                              exercise.pendingStatus?.proposalId === proposalId
                            ) {
                              const {
                                pendingStatus,
                                ...exerciseWithoutPending
                              } = exercise
                              return exerciseWithoutPending
                            }
                            return exercise
                          })
                          .filter(
                            (
                              exercise
                            ): exercise is NonNullable<typeof exercise> =>
                              exercise !== null
                          ), // Remove null exercises
                      },
                    }
                  }

                  return block
                })
                .filter(
                  (block): block is NonNullable<typeof block> => block !== null
                ), // Remove null blocks
            }
          })
          console.log('updatedWorkouts', updatedWorkouts)

          set({ workouts: updatedWorkouts })
        },
        rejectPendingProposalById: (proposalId: string) => {
          const { workouts, proposedChanges } = get()

          // Find the proposal to reject
          const proposal = proposedChanges.find((p) => p.id === proposalId)
          if (!proposal) return

          // Revert the change in workouts
          const updatedWorkouts = workouts.map((workout, workoutIndex) => {
            if (workoutIndex !== proposal.workoutIndex) return workout

            return {
              ...workout,
              blocks: workout.blocks
                .map((block, blockIndex) => {
                  // Handle block-level changes
                  if (
                    proposal.type === 'add-block' &&
                    blockIndex === proposal.blockIndex
                  ) {
                    // Remove the added block if it has the matching proposal ID
                    if (block.pendingStatus?.proposalId === proposalId) {
                      return null // Mark for removal
                    }
                  }

                  if (
                    proposal.type === 'remove-block' &&
                    blockIndex === proposal.blockIndex
                  ) {
                    // Restore the removed block by removing pending status
                    if (block.pendingStatus?.proposalId === proposalId) {
                      const { pendingStatus, ...blockWithoutPending } = block
                      return blockWithoutPending
                    }
                  }

                  if (
                    proposal.type === 'update-block' &&
                    blockIndex === proposal.blockIndex
                  ) {
                    // Restore the original block
                    if (
                      block.pendingStatus?.proposalId === proposalId &&
                      block.pendingStatus.type === 'updating'
                    ) {
                      return block.pendingStatus.oldBlock
                    }
                  }

                  // Handle circuit exercise changes
                  if (
                    block.type === 'circuit' &&
                    (proposal.type === 'add-circuit-exercise' ||
                      proposal.type === 'remove-circuit-exercise' ||
                      proposal.type === 'update-circuit-exercise') &&
                    blockIndex === proposal.circuitBlockIndex
                  ) {
                    return {
                      ...block,
                      circuit: {
                        ...block.circuit,
                        exercises: block.circuit.exercises
                          .map((exercise, exerciseIndex) => {
                            if (exerciseIndex === proposal.exerciseIndex) {
                              if (proposal.type === 'add-circuit-exercise') {
                                // Remove the added exercise if it has the matching proposal ID
                                if (
                                  exercise.pendingStatus?.proposalId ===
                                  proposalId
                                ) {
                                  return null // Mark for removal
                                }
                              }

                              if (proposal.type === 'remove-circuit-exercise') {
                                // Restore the removed exercise by removing pending status
                                if (
                                  exercise.pendingStatus?.proposalId ===
                                  proposalId
                                ) {
                                  const {
                                    pendingStatus,
                                    ...exerciseWithoutPending
                                  } = exercise
                                  return exerciseWithoutPending
                                }
                              }

                              if (proposal.type === 'update-circuit-exercise') {
                                // Restore the original exercise
                                if (
                                  exercise.pendingStatus?.proposalId ===
                                    proposalId &&
                                  exercise.pendingStatus.type === 'updating'
                                ) {
                                  return exercise.pendingStatus.oldBlock
                                }
                              }
                            }
                            return exercise
                          })
                          .filter(
                            (
                              exercise
                            ): exercise is NonNullable<typeof exercise> =>
                              exercise !== null
                          ), // Remove null exercises
                      },
                    }
                  }

                  return block
                })
                .filter(
                  (block): block is NonNullable<typeof block> => block !== null
                ), // Remove null blocks
            }
          })

          set({
            workouts: updatedWorkouts,
            proposedChanges: proposedChanges.filter(
              (change) => change.id !== proposalId
            ),
          })
        },

        // History actions
        saveWorkoutToHistory: (workoutId: string, workout: Workout) => {
          const { workoutHistories } = get()
          const currentHistory = workoutHistories[workoutId]

          // If we're not at the end of history, remove future states
          let newHistory = currentHistory
            ? currentHistory.history.slice(0, currentHistory.currentIndex + 1)
            : []

          // Add new state
          newHistory.push(workout)

          // Limit history size to prevent memory issues (keep last 50 states)
          const maxHistorySize = 50
          if (newHistory.length > maxHistorySize) {
            newHistory.shift()
          }

          set({
            workoutHistories: {
              ...workoutHistories,
              [workoutId]: {
                history: newHistory,
                currentIndex: newHistory.length - 1,
              },
            },
          })
        },
        undoWorkout: (workoutId: string) => {
          const { workoutHistories, workouts } = get()
          const history = workoutHistories[workoutId]?.history || []
          const currentIndex = workoutHistories[workoutId]?.currentIndex || 0

          if (currentIndex > 0) {
            const newCurrentIndex = currentIndex - 1
            const previousWorkout = history[newCurrentIndex]

            // Update both history and main workouts array
            const updatedWorkouts = workouts.map((w) =>
              w.id === workoutId ? previousWorkout : w
            )

            set({
              workouts: updatedWorkouts,
              workoutHistories: {
                ...workoutHistories,
                [workoutId]: {
                  history: history,
                  currentIndex: newCurrentIndex,
                },
              },
            })
          }
        },
        redoWorkout: (workoutId: string) => {
          const { workoutHistories, workouts } = get()
          const history = workoutHistories[workoutId]?.history || []
          const currentIndex = workoutHistories[workoutId]?.currentIndex || 0

          if (currentIndex < history.length - 1) {
            const newCurrentIndex = currentIndex + 1
            const nextWorkout = history[newCurrentIndex]

            // Update both history and main workouts array
            const updatedWorkouts = workouts.map((w) =>
              w.id === workoutId ? nextWorkout : w
            )

            set({
              workouts: updatedWorkouts,
              workoutHistories: {
                ...workoutHistories,
                [workoutId]: {
                  history: history,
                  currentIndex: newCurrentIndex,
                },
              },
            })
          }
        },
        canUndoWorkout: (workoutId: string) => {
          const { workoutHistories } = get()
          return (workoutHistories[workoutId]?.currentIndex || 0) > 0
        },
        canRedoWorkout: (workoutId: string) => {
          const { workoutHistories } = get()
          return (
            (workoutHistories[workoutId]?.currentIndex || 0) <
            (workoutHistories[workoutId]?.history.length || 0) - 1
          )
        },
        resetWorkoutHistory: (workoutId: string, workout: Workout) => {
          const { workoutHistories } = get()
          set({
            workoutHistories: {
              ...workoutHistories,
              [workoutId]: {
                history: [workout],
                currentIndex: 0,
              },
            },
          })
        },
        getCurrentWorkout: (workoutId: string) => {
          const { workoutHistories } = get()
          return workoutHistories[workoutId]?.history[
            workoutHistories[workoutId]?.currentIndex || 0
          ]
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
const useZCurrentChangeId = () =>
  useEditorStore((state) => state.currentChangeId)
const useZProgramWorkouts = () => useEditorStore((state) => state.workouts)
const useZProgramType = () => useEditorStore((state) => state.type)
const useZEditorActions = () => useEditorStore((state) => state.actions)

// Hook to handle keyboard shortcuts for workout history
export const useWorkoutHistoryKeyboardShortcuts = (workoutId: string) => {
  const { undoWorkout, redoWorkout, canUndoWorkout, canRedoWorkout } =
    useZEditorActions()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          if (canRedoWorkout(workoutId)) {
            redoWorkout(workoutId)
          }
        } else {
          if (canUndoWorkout(workoutId)) {
            undoWorkout(workoutId)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [workoutId, undoWorkout, redoWorkout, canUndoWorkout, canRedoWorkout])
}

const useZWorkoutHistories = () =>
  useEditorStore((state) => state.workoutHistories)
const useZWorkoutHistory = (workoutId: string) =>
  useEditorStore((state) => state.workoutHistories[workoutId])

export {
  EditorProgramProvider,
  useZCurrentChangeId,
  useZEditorActions,
  useZIsNewProgram,
  useZProgramCreatedAt,
  useZProgramId,
  useZProgramName,
  useZProgramType,
  useZProgramWorkouts,
  useZProposedChanges,
  useZWorkoutHistories,
  useZWorkoutHistory,
}
