import Fuse from "fuse.js"
import { createContext, useContext, useEffect, useState } from "react"
import { create, type StoreApi, type UseBoundStore, useStore } from "zustand"
import { mergeWorkoutWithProposedChanges } from "@/components/grid/workout-merge"
import type { WorkoutChange } from "@/lib/ai/tools/diff-schema"
import type {
  CircuitBlock,
  Exercise,
  ExerciseBlock,
  Program,
  Workout,
  Workouts,
} from "@/lib/domain/workouts"
import log from "@/lib/logger/logger"
import { newTestInitialProgram, newTestProposedChanges } from "./test-state"

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
  // TODO: start with splits for now, skip weekly support atm.
  type: "splits"
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
  setProgramType: (pType: "splits") => void
  setProgramName: (name: string) => void
  setWorkouts: (workouts: Workouts) => void
  // set the proposed changes to a new array
  setProposedChanges: (changes: WorkoutChange[]) => void
  // add to the proposed changes array
  addProposedChanges: (changes: WorkoutChange[]) => void
  setCurrentChangeId: (changeId: string | null) => void
  applyPendingProposalById: (proposalId: string) => void
  rejectPendingProposalById: (proposalId: string) => void

  // save the current program to db
  saveProgram: () => Promise<void>

  // History actions
  saveWorkoutToHistory: (workoutId: string, workout: Workout) => void
  undoWorkout: (workoutId: string) => void
  redoWorkout: (workoutId: string) => void
  canUndoWorkout: (workoutId: string) => boolean
  canRedoWorkout: (workoutId: string) => boolean
  resetWorkoutHistory: (workoutId: string, workout: Workout) => void
  getCurrentWorkout: (workoutId: string) => Workout | undefined
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
        case "update-block":
        case "remove-block":
        case "add-block":
          return change.blockIndex
        case "add-circuit-exercise":
        case "remove-circuit-exercise":
        case "update-circuit-exercise":
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

/*
  Handle a proposal for an exercise block. 

  Rejecting the add-block or add-circuit-exercise proposal. Mark the block for removal.
  Rejecting the remove-block or remove-circuit-exercise proposal. Keep the block and remove the pending status.
  Rejecting the update-block or update-circuit-exercise proposal. Restore old block and remove the pending status.
*/
export const handleRejectExerciseBlock = (
  block: ExerciseBlock,
  proposal: WorkoutChange,
  opts: {
    acceptanceTypeName: "add-block" | "add-circuit-exercise"
    rejectionTypeName: "remove-block" | "remove-circuit-exercise"
    updateTypeName: "update-block" | "update-circuit-exercise"
  }
) => {
  const match = block.pendingStatus?.proposalId === proposal.id
  if (!match) {
    return block
  }
  if (proposal.type === opts.acceptanceTypeName) {
    return null // Mark for removal
  }
  if (proposal.type === opts.rejectionTypeName) {
    const { pendingStatus: _, ...blockWithoutPending } = block
    return blockWithoutPending
  }
  if (
    proposal.type === opts.updateTypeName &&
    block.pendingStatus?.type === "updating"
  ) {
    return block.pendingStatus.oldBlock
  }
  return block
}

/*
  Handle applying a proposal for an exercise block.
  
  Applying the remove-block or remove-circuit-exercise proposal. Mark the block for removal.
  Applying the add-block, add-circuit-exercise, or update-block/update-circuit-exercise proposal. Remove the pending status to make the change permanent.
*/
export const handleApplyExerciseBlock = (
  exerciseBlock: ExerciseBlock,
  proposal: WorkoutChange,
  opts: {
    removalTypeName: "remove-block" | "remove-circuit-exercise"
  }
) => {
  const match = exerciseBlock.pendingStatus?.proposalId === proposal.id
  if (!match) {
    return exerciseBlock
  }
  if (proposal.type === opts.removalTypeName) {
    return null // Mark for removal
  }
  // For add-block, add-circuit-exercise, update-block, update-circuit-exercise
  // Just remove the pending status to make the change permanent
  const { pendingStatus: _, ...blockWithoutPending } = exerciseBlock
  return blockWithoutPending
}

/*

Determine an action to take given a proposal and a circuit block. 

Rejecting the add-block proposal. Mark the block for removal.
Rejecting the remove-block proposal. Keep the block and remove the pending status.
Rejecting the update-block proposal. Restore old block and remove the pending status.

Rejecting the add-circuit-exercise proposal. Mark the exercise for removal.
Rejecting the remove-circuit-exercise proposal. Restore the exercise and remove the pending status.
Rejecting the update-circuit-exercise proposal. Restore the original exercise and remove the pending status.

*/
export const handleRejectCircuitBlock = (
  block: CircuitBlock,
  proposal: WorkoutChange
) => {
  const match = block.pendingStatus?.proposalId === proposal.id
  if (match && proposal.type === "add-block") {
    return null
  }
  if (match && proposal.type === "remove-block") {
    const { pendingStatus: _, ...blockWithoutPending } = block
    return blockWithoutPending
  }
  if (
    match &&
    proposal.type === "update-block" &&
    block.pendingStatus?.type === "updating"
  ) {
    return block.pendingStatus?.oldBlock
  }
  if (
    proposal.type === "add-circuit-exercise" ||
    proposal.type === "remove-circuit-exercise" ||
    proposal.type === "update-circuit-exercise"
  ) {
    if (block.type !== "circuit") {
      log.error("block is not a circuit")
      return block
    }

    return {
      ...block,
      circuit: {
        ...block.circuit,
        exercises: block.circuit.exercises
          .map((exercise) =>
            handleRejectExerciseBlock(exercise, proposal, {
              acceptanceTypeName: "add-circuit-exercise",
              rejectionTypeName: "remove-circuit-exercise",
              updateTypeName: "update-circuit-exercise",
            })
          )
          .filter(
            (exercise): exercise is NonNullable<typeof exercise> =>
              exercise !== null
          ), // Remove null exercises
      },
    }
  }
  return block
}

/*
  Handle applying a proposal for a circuit block.
  
  Applying the remove-block proposal. Mark the block for removal.
  Applying the add-block or update-block proposal. Remove the pending status to make the change permanent.
  
  Applying the remove-circuit-exercise proposal. Mark the exercise for removal.
  Applying the add-circuit-exercise or update-circuit-exercise proposal. Remove the pending status to make the change permanent.
*/
export const handleApplyCircuitBlock = (
  circuitBlock: CircuitBlock,
  proposal: WorkoutChange
) => {
  const match = circuitBlock.pendingStatus?.proposalId === proposal.id
  if (match && proposal.type === "remove-block") {
    return null
  }
  if (
    match &&
    (proposal.type === "add-block" || proposal.type === "update-block")
  ) {
    const { pendingStatus: _, ...blockWithoutPending } = circuitBlock
    return blockWithoutPending
  }
  if (
    proposal.type === "add-circuit-exercise" ||
    proposal.type === "remove-circuit-exercise" ||
    proposal.type === "update-circuit-exercise"
  ) {
    if (circuitBlock.type !== "circuit") {
      log.error("block is not a circuit")
      return circuitBlock
    }

    return {
      ...circuitBlock,
      circuit: {
        ...circuitBlock.circuit,
        exercises: circuitBlock.circuit.exercises
          .map((exercise) =>
            handleApplyExerciseBlock(exercise, proposal, {
              removalTypeName: "remove-circuit-exercise",
            })
          )
          .filter(
            (exercise): exercise is NonNullable<typeof exercise> =>
              exercise !== null
          ), // Remove null exercises
      },
    }
  }
  return circuitBlock
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
  const program = initialProgram || newTestInitialProgram(exercises)
  const isNewProgram = !initialProgram
  const sortedProposedChanges = sortProposedChanges(
    []
    // newTestProposedChanges(exercises)
  )
  // const sortedProposedChanges: WorkoutChange[] = []
  // merge proposed changes with workouts
  const mergedWorkouts = program.workouts.map((workout, workoutIndex) => {
    return mergeWorkoutWithProposedChanges(
      workout,
      sortedProposedChanges,
      workoutIndex
    )
  })
  const programWithMergedWorkouts = {
    ...program,
    workouts: mergedWorkouts,
  }

  // Initialize workout histories for initial workouts
  const initialWorkoutHistories: Record<string, WorkoutHistory> = {}
  for (const workout of programWithMergedWorkouts.workouts) {
    initialWorkoutHistories[workout.id] = {
      history: [workout],
      currentIndex: 0,
    }
  }

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
          for (const workout of workouts) {
            if (!updatedHistories[workout.id]) {
              updatedHistories[workout.id] = {
                history: [workout],
                currentIndex: 0,
              }
            }
          }

          set({ workouts, workoutHistories: updatedHistories })
        },
        addProposedChanges: (changes: WorkoutChange[]) => {
          log.consoleWithHeader("adding proposed changes", changes)
          const newProposedChanges = sortProposedChanges([
            ...get().proposedChanges,
            ...changes,
          ])
          log.consoleWithHeader("new proposed changes", newProposedChanges)
          const existingWorkouts = get().workouts
          log.consoleWithHeader("existing workouts", existingWorkouts)
          set({ proposedChanges: newProposedChanges })
          // merge the changes with the existing workout
          const updatedWorkouts = get().workouts.map(
            (workout, workoutIndex) => {
              return mergeWorkoutWithProposedChanges(
                workout,
                newProposedChanges,
                workoutIndex
              )
            }
          )
          log.consoleWithHeader("updated workouts", updatedWorkouts)
          set({ workouts: updatedWorkouts })
        },
        setProposedChanges: (changes: WorkoutChange[]) => {
          set({
            proposedChanges: sortProposedChanges(changes),
          })
        },
        setCurrentChangeId: (changeId: string | null) => {
          set({ currentChangeId: changeId })
        },

        setProgramType: (pType: "splits") => {
          set({ type: pType })
        },
        setProgramName: (name: string) => {
          set({ name })
        },
        search: (query = "") => {
          const { exercises: exerciseList } = get()
          const fuse = new Fuse(exerciseList, {
            includeScore: true,
            keys: [
              {
                name: "name",
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
          const proposalIndex = proposedChanges.findIndex(
            (p) => p.id === proposalId
          )
          if (proposalIndex === -1) return
          const proposal = proposedChanges[proposalIndex]

          const updatedWorkouts = workouts.map((workout, workoutIndex) => {
            if (workoutIndex !== proposal.workoutIndex) return workout

            return {
              ...workout,
              blocks: workout.blocks
                .map((workoutBlock) => {
                  switch (workoutBlock.type) {
                    case "exercise":
                      return handleApplyExerciseBlock(workoutBlock, proposal, {
                        removalTypeName: "remove-block",
                      })
                    case "circuit":
                      return handleApplyCircuitBlock(workoutBlock, proposal)
                    default:
                      log.error("No handler for block type", { workoutBlock })
                      return workoutBlock
                  }
                })
                .filter(
                  (
                    workoutBlock
                  ): workoutBlock is NonNullable<typeof workoutBlock> =>
                    workoutBlock !== null
                ), // Remove null blocks
            }
          })

          // update the 'next' proposal.
          if (proposedChanges.length === 1) {
            set({ currentChangeId: null }) // we're done with proposals
          } else {
            const nextProposalIndex =
              (proposalIndex + 1) % proposedChanges.length
            set({ currentChangeId: proposedChanges[nextProposalIndex].id })
          }

          // Remove the applied proposal from the proposedChanges array
          const newProposals = sortProposedChanges(
            proposedChanges.filter((change) => change.id !== proposalId)
          )
          set({
            workouts: updatedWorkouts,
            proposedChanges: newProposals,
          })
        },
        rejectPendingProposalById: (proposalId: string) => {
          const { workouts, proposedChanges } = get()

          // Find the proposal to reject
          const proposalIndex = proposedChanges.findIndex(
            (p) => p.id === proposalId
          )
          if (proposalIndex === -1) return
          const proposal = proposedChanges[proposalIndex]

          log.info("reverting proposal", { proposal, workouts })
          // Revert the change in workouts
          const updatedWorkouts = workouts.map((workout, workoutIndex) => {
            if (workoutIndex !== proposal.workoutIndex) return workout

            return {
              ...workout,
              blocks: workout.blocks
                .map((block) => {
                  switch (block.type) {
                    case "exercise":
                      return handleRejectExerciseBlock(block, proposal, {
                        acceptanceTypeName: "add-block",
                        rejectionTypeName: "remove-block",
                        updateTypeName: "update-block",
                      })
                    case "circuit":
                      return handleRejectCircuitBlock(block, proposal)
                    default:
                      log.error("No handler for block type", { block })
                      return block
                  }
                })
                .filter(
                  (block): block is NonNullable<typeof block> => block !== null
                ), // Remove null blocks
            }
          })

          // update the 'next' proposal.
          if (proposedChanges.length === 1) {
            set({ currentChangeId: null }) // we're done with proposals
          } else {
            const nextProposalIndex =
              (proposalIndex + 1) % proposedChanges.length
            set({ currentChangeId: proposedChanges[nextProposalIndex].id })
          }

          // Remove the applied proposal from the proposedChanges array
          const newProposals = sortProposedChanges(
            proposedChanges.filter((change) => change.id !== proposalId)
          )
          set({
            workouts: updatedWorkouts,
            proposedChanges: newProposals,
          })
        },

        // History actions
        saveWorkoutToHistory: (workoutId: string, workout: Workout) => {
          const { workoutHistories } = get()
          const currentHistory = workoutHistories[workoutId]

          // If we're not at the end of history, remove future states
          const newHistory = currentHistory
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
                  history,
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
                  history,
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
    throw new Error("Missing EditorStoreContext")
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
      const isUndoRedo = (e.metaKey || e.ctrlKey) && e.key === "z"
      if (!isUndoRedo) return

      e.preventDefault()

      if (e.shiftKey && canRedoWorkout(workoutId)) {
        redoWorkout(workoutId)
      } else if (!e.shiftKey && canUndoWorkout(workoutId)) {
        undoWorkout(workoutId)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
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
