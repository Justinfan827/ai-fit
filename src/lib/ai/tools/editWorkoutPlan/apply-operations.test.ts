import { describe, expect, it } from "vitest"
import type { Workout } from "@/lib/domain/workouts"
import { applyWorkoutPlanOperations } from "./apply-operations"
import type { EditWorkoutPlanActions } from "./schemas"

// UUID regex pattern for testing
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// Test type for workout objects with name and optional id
type TestWorkout = { name: string; blocks: never[]; id?: string }

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

const createNewWorkout = (): TestWorkout => ({
  name: "New Workout",
  blocks: [],
})

describe("applyWorkoutPlanOperations", () => {
  describe("insertAfter operation", () => {
    it("should insert workout after specified anchor workout", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertAfter",
          anchorWorkoutId: "workout-2",
          workout: createNewWorkout(),
        },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      expect(result[0].id).toBe("workout-1")
      expect(result[1].id).toBe("workout-2")
      expect(result[2].name).toBe("New Workout")
      expect(result[3].id).toBe("workout-3")

      // Check program orders are updated
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2, 3])
    })

    it("should insert workout after last workout", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertAfter",
          anchorWorkoutId: "workout-3",
          workout: createNewWorkout(),
        },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      expect(result[3].name).toBe("New Workout")
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2, 3])
    })

    it("should throw error if anchor workout not found", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertAfter",
          anchorWorkoutId: "nonexistent",
          workout: createNewWorkout(),
        },
      ]

      expect(() => applyWorkoutPlanOperations(workouts, actions)).toThrow(
        "Anchor workout with ID nonexistent not found"
      )
    })
  })

  describe("insertBefore operation", () => {
    it("should insert workout before specified anchor workout", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertBefore",
          anchorWorkoutId: "workout-2",
          workout: createNewWorkout(),
        },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      expect(result[0].id).toBe("workout-1")
      expect(result[1].name).toBe("New Workout")
      expect(result[2].id).toBe("workout-2")
      expect(result[3].id).toBe("workout-3")

      // Check program orders are updated
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2, 3])
    })

    it("should insert workout before first workout", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertBefore",
          anchorWorkoutId: "workout-1",
          workout: createNewWorkout(),
        },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      expect(result[0].name).toBe("New Workout")
      expect(result[1].id).toBe("workout-1")
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2, 3])
    })

    it("should throw error if anchor workout not found", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
        {
          type: "insertBefore",
          anchorWorkoutId: "nonexistent",
          workout: createNewWorkout(),
        },
      ]

      expect(() => applyWorkoutPlanOperations(workouts, actions)).toThrow(
        "Anchor workout with ID nonexistent not found"
      )
    })
  })

  describe("insertAtStart operation", () => {
    it("should insert workout at the beginning of the plan", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtStart",
            workout: createNewWorkout(),
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      expect(result[0].name).toBe("New Workout")
      expect(result[1].id).toBe("workout-1")
      expect(result[2].id).toBe("workout-2")
      expect(result[3].id).toBe("workout-3")

      // Check program orders are updated
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2, 3])
    })

    it("should work with empty workout array", () => {
      const workouts: Workout[] = []
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtStart",
            workout: createNewWorkout(),
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("New Workout")
      expect(result[0].program_order).toBe(0)
      // When no existing workouts, a new program_id should be generated
      expect(result[0].program_id).toBeDefined()
    })
  })

  describe("insertAtEnd operation", () => {
    it("should insert workout at the end of the plan", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtEnd",
            workout: createNewWorkout(),
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      expect(result[0].id).toBe("workout-1")
      expect(result[1].id).toBe("workout-2")
      expect(result[2].id).toBe("workout-3")
      expect(result[3].name).toBe("New Workout")

      // Check program orders are updated
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2, 3])
    })

    it("should work with empty workout array", () => {
      const workouts: Workout[] = []
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtEnd",
            workout: createNewWorkout(),
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("New Workout")
      expect(result[0].program_order).toBe(0)
    })
  })

  describe("swap operation", () => {
    it("should swap positions of two workouts", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "swap",
            aWorkoutId: "workout-1",
            bWorkoutId: "workout-3",
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe("workout-3")
      expect(result[1].id).toBe("workout-2")
      expect(result[2].id).toBe("workout-1")

      // Check program orders are updated
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2])
    })

    it("should swap adjacent workouts", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "swap",
            aWorkoutId: "workout-1",
            bWorkoutId: "workout-2",
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe("workout-2")
      expect(result[1].id).toBe("workout-1")
      expect(result[2].id).toBe("workout-3")
    })

    it("should throw error if first workout not found", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "swap",
            aWorkoutId: "nonexistent",
            bWorkoutId: "workout-2",
          },
      ]

      expect(() => applyWorkoutPlanOperations(workouts, actions)).toThrow(
        "Workout with ID nonexistent not found"
      )
    })

    it("should throw error if second workout not found", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "swap",
            aWorkoutId: "workout-1",
            bWorkoutId: "nonexistent",
          },
      ]

      expect(() => applyWorkoutPlanOperations(workouts, actions)).toThrow(
        "Workout with ID nonexistent not found"
      )
    })
  })

  describe("remove operation", () => {
    it("should remove workout from the plan", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "remove",
            workoutId: "workout-2",
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("workout-1")
      expect(result[1].id).toBe("workout-3")

      // Check program orders are updated
      expect(result.map((w) => w.program_order)).toEqual([0, 1])
    })

    it("should remove first workout", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "remove",
            workoutId: "workout-1",
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("workout-2")
      expect(result[1].id).toBe("workout-3")
      expect(result.map((w) => w.program_order)).toEqual([0, 1])
    })

    it("should remove last workout", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "remove",
            workoutId: "workout-3",
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("workout-1")
      expect(result[1].id).toBe("workout-2")
      expect(result.map((w) => w.program_order)).toEqual([0, 1])
    })

    it("should throw error if workout not found", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "remove",
            workoutId: "nonexistent",
          },
      ]

      expect(() => applyWorkoutPlanOperations(workouts, actions)).toThrow(
        "Workout with ID nonexistent not found"
      )
    })
  })

  describe("multiple operations", () => {
    it("should apply multiple operations in sequence", () => {
      const workouts = createMockWorkouts()
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
            type: "swap",
            aWorkoutId: "workout-1",
            bWorkoutId: "workout-3",
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(3)
      // After remove: [workout-1, workout-3]
      // After insertAtEnd: [workout-1, workout-3, new-workout]
      // After swap: [workout-3, workout-1, new-workout]
      expect(result[0].id).toBe("workout-3")
      expect(result[1].id).toBe("workout-1")
      expect(result[2].name).toBe("New End Workout")
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2])
    })

    it("should handle complex sequence with insertAfter and insertBefore", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAfter",
            anchorWorkoutId: "workout-1",
            workout: { name: "After Workout 1", blocks: [] } as TestWorkout,
          },
          {
            type: "insertBefore",
            anchorWorkoutId: "workout-3",
            workout: { name: "Before Workout 3", blocks: [] } as TestWorkout,
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(5)
      expect(result[0].id).toBe("workout-1")
      expect(result[1].name).toBe("After Workout 1")
      expect(result[2].id).toBe("workout-2")
      expect(result[3].name).toBe("Before Workout 3")
      expect(result[4].id).toBe("workout-3")
      expect(result.map((w) => w.program_order)).toEqual([0, 1, 2, 3, 4])
    })
  })

  describe("ID and program_id handling", () => {
    it("should generate ID for workout without ID", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtEnd",
            workout: { name: "No ID Workout", blocks: [] } as TestWorkout,
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      const newWorkout = result[3]
      expect(newWorkout.id).toBeDefined()
      expect(newWorkout.id).toMatch(UUID_REGEX)
      expect(newWorkout.program_id).toBe("test-program-id") // Should inherit from existing workouts
    })

    it("should use provided ID if present", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtEnd",
            workout: {
              id: "custom-id",
              name: "Custom ID Workout",
              blocks: [],
            } as TestWorkout,
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(4)
      const newWorkout = result[3]
      expect(newWorkout.id).toBe("custom-id")
      expect(newWorkout.program_id).toBe("test-program-id")
    })

    it("should generate program_id when no existing workouts", () => {
      const workouts: Workout[] = []
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtStart",
            workout: { name: "First Workout", blocks: [] } as TestWorkout,
          },
      ]

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toHaveLength(1)
      const newWorkout = result[0]
      expect(newWorkout.program_id).toBeDefined()
      expect(newWorkout.program_id).toMatch(UUID_REGEX)
    })
  })

  describe("edge cases", () => {
    it("should handle empty operations array", () => {
      const workouts = createMockWorkouts()
      const actions: EditWorkoutPlanActions = []

      const result = applyWorkoutPlanOperations(workouts, actions)

      expect(result).toEqual(workouts)
    })

    it("should not mutate original workouts array", () => {
      const workouts = createMockWorkouts()
      const originalWorkouts = JSON.parse(JSON.stringify(workouts))
      const actions: EditWorkoutPlanActions = [
          {
            type: "insertAtEnd",
            workout: createNewWorkout(),
          },
      ]

      applyWorkoutPlanOperations(workouts, actions)

      expect(workouts).toEqual(originalWorkouts)
    })
  })
})
