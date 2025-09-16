import { beforeEach, describe, expect, it } from "vitest"
import { create } from "zustand"
import { applyWorkoutPlanOperations } from "@/lib/ai/tools/editWorkoutPlan/apply-operations"
import type { EditWorkoutPlanActions } from "@/lib/ai/tools/editWorkoutPlan/schemas"
import type { Workout } from "@/lib/domain/workouts"

// Import only the parts we need to test
interface WorkoutHistory {
  history: Workout[]
  currentIndex: number
}

interface EditorState {
  workouts: Workout[]
  workoutHistories: Record<string, WorkoutHistory>
  actions: {
    applyEditWorkoutPlanActions: (actions: EditWorkoutPlanActions) => void
  }
}

// We'll mock the implementation similar to the real one but simplified for testing
const createMockEditorStore = (initialWorkouts: Workout[] = []) => {
  const initialHistories: Record<string, WorkoutHistory> = {}
  for (const workout of initialWorkouts) {
    initialHistories[workout.id] = {
      history: [workout],
      currentIndex: 0,
    }
  }

  return create<EditorState>((set, get) => ({
    workouts: initialWorkouts,
    workoutHistories: initialHistories,
    actions: {
      applyEditWorkoutPlanActions: (actions: EditWorkoutPlanActions) => {
        const { workouts, workoutHistories } = get()

        try {
          // Apply operations using the pure utility function
          const updatedWorkouts = applyWorkoutPlanOperations(workouts, actions)

          // Initialize workout histories for any new workouts
          const updatedHistories = { ...workoutHistories }
          for (const workout of updatedWorkouts) {
            if (!updatedHistories[workout.id]) {
              updatedHistories[workout.id] = {
                history: [workout],
                currentIndex: 0,
              }
            }
          }

          // Update the state with new workouts and histories
          set({
            workouts: updatedWorkouts,
            workoutHistories: updatedHistories,
          })
        } catch (error) {
          // Don't update state if operations failed
          console.error("Failed to apply workout plan actions", {
            error,
            actions,
          })
        }
      },
    },
  }))
}

// Test data factory functions
const createMockWorkout = (
  id: string,
  name: string,
  programOrder = 0
): Workout => ({
  id,
  name,
  program_id: "test-program-id",
  program_order: programOrder,
  blocks: [],
})

const createMockWorkouts = (): Workout[] => [
  createMockWorkout("workout-1", "Workout 1", 0),
  createMockWorkout("workout-2", "Workout 2", 1),
  createMockWorkout("workout-3", "Workout 3", 2),
]

// Test type for workout objects with name and optional id
type TestWorkout = { name: string; blocks: never[]; id?: string }

describe("Zustand applyEditWorkoutPlanActions integration", () => {
  let store: ReturnType<typeof createMockEditorStore>

  beforeEach(() => {
    const mockWorkouts = createMockWorkouts()
    store = createMockEditorStore(mockWorkouts)
  })

  describe("insertAtEnd operation", () => {
    it("should insert workout and initialize workout history", () => {
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertAtEnd",
          workout: { name: "New Workout", blocks: [] } as TestWorkout,
        },
      ]

      // Apply the action
      store.getState().actions.applyEditWorkoutPlanActions(actions)

      // Check workouts were updated
      const state = store.getState()
      expect(state.workouts).toHaveLength(4)
      expect(state.workouts[3].name).toBe("New Workout")
      expect(state.workouts[3].program_order).toBe(3)

      // Check workout history was initialized for the new workout
      const newWorkoutId = state.workouts[3].id
      expect(state.workoutHistories[newWorkoutId]).toBeDefined()
      expect(state.workoutHistories[newWorkoutId].history).toHaveLength(1)
      expect(state.workoutHistories[newWorkoutId].currentIndex).toBe(0)
      expect(state.workoutHistories[newWorkoutId].history[0]).toEqual(
        state.workouts[3]
      )
    })
  })

  describe("remove operation", () => {
    it("should remove workout but keep workout history", () => {
      const actions: EditWorkoutPlanActions = [
        {
          type: "remove",
          workoutId: "workout-2",
        },
      ]

      // Apply the action
      store.getState().actions.applyEditWorkoutPlanActions(actions)

      // Check workouts were updated
      const state = store.getState()
      expect(state.workouts).toHaveLength(2)
      expect(state.workouts.map((w) => w.id)).toEqual([
        "workout-1",
        "workout-3",
      ])
      expect(state.workouts.map((w) => w.program_order)).toEqual([0, 1])

      // Check workout history is still preserved for removed workout
      expect(state.workoutHistories["workout-2"]).toBeDefined()
      expect(state.workoutHistories["workout-1"]).toBeDefined()
      expect(state.workoutHistories["workout-3"]).toBeDefined()
    })
  })

  describe("swap operation", () => {
    it("should swap workouts and maintain workout histories", () => {
      const actions: EditWorkoutPlanActions = [
        {
          type: "swap",
          aWorkoutId: "workout-1",
          bWorkoutId: "workout-3",
        },
      ]

      // Apply the action
      store.getState().actions.applyEditWorkoutPlanActions(actions)

      // Check workouts were swapped
      const state = store.getState()
      expect(state.workouts).toHaveLength(3)
      expect(state.workouts[0].id).toBe("workout-3")
      expect(state.workouts[1].id).toBe("workout-2")
      expect(state.workouts[2].id).toBe("workout-1")
      expect(state.workouts.map((w) => w.program_order)).toEqual([0, 1, 2])

      // Check all workout histories are preserved
      expect(state.workoutHistories["workout-1"]).toBeDefined()
      expect(state.workoutHistories["workout-2"]).toBeDefined()
      expect(state.workoutHistories["workout-3"]).toBeDefined()
    })
  })

  describe("multiple operations", () => {
    it("should handle multiple operations and update histories appropriately", () => {
      const actions: EditWorkoutPlanActions = [
        {
          type: "remove",
          workoutId: "workout-2",
        },
        {
          type: "insertAtEnd",
          workout: { name: "New End Workout", blocks: [] } as TestWorkout,
        },
        {
          type: "insertAtStart",
          workout: { name: "New Start Workout", blocks: [] } as TestWorkout,
        },
      ]

      // Apply the actions
      store.getState().actions.applyEditWorkoutPlanActions(actions)

      // Check final state
      const state = store.getState()
      expect(state.workouts).toHaveLength(4)
      expect(state.workouts[0].name).toBe("New Start Workout")
      expect(state.workouts[1].id).toBe("workout-1")
      expect(state.workouts[2].id).toBe("workout-3")
      expect(state.workouts[3].name).toBe("New End Workout")
      expect(state.workouts.map((w) => w.program_order)).toEqual([0, 1, 2, 3])

      // Check histories for new workouts were created
      const newStartWorkoutId = state.workouts[0].id
      const newEndWorkoutId = state.workouts[3].id
      expect(state.workoutHistories[newStartWorkoutId]).toBeDefined()
      expect(state.workoutHistories[newEndWorkoutId]).toBeDefined()

      // Check old histories are preserved
      expect(state.workoutHistories["workout-1"]).toBeDefined()
      expect(state.workoutHistories["workout-2"]).toBeDefined() // Preserved even though removed
      expect(state.workoutHistories["workout-3"]).toBeDefined()
    })
  })

  describe("error handling", () => {
    it("should not update state when operations fail", () => {
      const initialState = store.getState()
      const actions: EditWorkoutPlanActions = [
        {
          type: "remove",
          workoutId: "nonexistent-workout",
        },
      ]

      // Apply the action (should fail)
      store.getState().actions.applyEditWorkoutPlanActions(actions)

      // Check state was not updated
      const finalState = store.getState()
      expect(finalState.workouts).toEqual(initialState.workouts)
      expect(finalState.workoutHistories).toEqual(initialState.workoutHistories)
    })

    it("should not update state when anchor workout not found", () => {
      const initialState = store.getState()
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertAfter",
          anchorWorkoutId: "nonexistent-workout",
          workout: { name: "New Workout", blocks: [] } as TestWorkout,
        },
      ]

      // Apply the action (should fail)
      store.getState().actions.applyEditWorkoutPlanActions(actions)

      // Check state was not updated
      const finalState = store.getState()
      expect(finalState.workouts).toEqual(initialState.workouts)
      expect(finalState.workoutHistories).toEqual(initialState.workoutHistories)
    })
  })

  describe("empty workout list", () => {
    it("should handle operations on empty workout list", () => {
      const emptyStore = createMockEditorStore([])
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertAtStart",
          workout: { name: "First Workout", blocks: [] } as TestWorkout,
        },
      ]
      // Apply the action
      emptyStore.getState().actions.applyEditWorkoutPlanActions(actions)

      // Check state was updated
      const state = emptyStore.getState()
      expect(state.workouts).toHaveLength(1)
      expect(state.workouts[0].name).toBe("First Workout")
      expect(state.workouts[0].program_order).toBe(0)

      // Check workout history was created
      const workoutId = state.workouts[0].id
      expect(state.workoutHistories[workoutId]).toBeDefined()
      expect(state.workoutHistories[workoutId].history).toHaveLength(1)
    })
  })
})
