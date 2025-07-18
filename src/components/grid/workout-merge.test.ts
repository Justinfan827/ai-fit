import { describe, expect, it } from "vitest"
import { sortProposedChanges } from "@/hooks/zustand/program-editor-state"
import type { WorkoutChange } from "@/lib/ai/tools/diff-schema"
import type {
  Block,
  CircuitBlock,
  ExerciseBlock,
  Workout,
} from "@/lib/domain/workouts"
import { mergeWorkoutWithProposedChanges } from "./workout-merge"

// Test data factory functions to ensure each test gets fresh copies
function createMockExerciseBlock(): ExerciseBlock {
  return {
    type: "exercise",
    exercise: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Bench Press",
      metadata: {
        sets: "3",
        reps: "10",
        weight: "135",
        rest: "60",
        notes: "Focus on form",
      },
    },
  }
}

function createMockCircuitBlock2(): CircuitBlock {
  return {
    type: "circuit",
    circuit: {
      isDefault: false,
      name: "Upper Body Circuit",
      description: "A circuit for upper body strength",
      metadata: {
        sets: "3",
        rest: "120",
        notes: "Complete all exercises before resting",
      },
      exercises: [
        {
          type: "exercise",
          exercise: {
            id: "123e4567-e89b-12d3-a456-426614174018",
            name: "Push-ups",
            metadata: {
              sets: "3",
              reps: "15",
              weight: "0",
              rest: "30",
              notes: "Keep core tight",
            },
          },
        },
        {
          type: "exercise",
          exercise: {
            id: "123e4567-e89b-12d3-a456-426614174019",
            name: "Pull-ups",
            metadata: {
              sets: "3",
              reps: "8",
              weight: "0",
              rest: "30",
              notes: "Full range of motion",
            },
          },
        },
      ],
    },
  }
}

function createMockCircuitBlock(): CircuitBlock {
  return {
    type: "circuit",
    circuit: {
      isDefault: false,
      name: "Upper Body Circuit",
      description: "A circuit for upper body strength",
      metadata: {
        sets: "3",
        rest: "120",
        notes: "Complete all exercises before resting",
      },
      exercises: [
        {
          type: "exercise",
          exercise: {
            id: "123e4567-e89b-12d3-a456-426614174001",
            name: "Push-ups",
            metadata: {
              sets: "3",
              reps: "15",
              weight: "0",
              rest: "30",
              notes: "Keep core tight",
            },
          },
        },
        {
          type: "exercise",
          exercise: {
            id: "123e4567-e89b-12d3-a456-426614174002",
            name: "Pull-ups",
            metadata: {
              sets: "3",
              reps: "8",
              weight: "0",
              rest: "30",
              notes: "Full range of motion",
            },
          },
        },
      ],
    },
  }
}

function createMockWorkout2Circuits(): Workout {
  return {
    id: "123e4567-e89b-12d3-a456-426614174003",
    program_order: 1,
    week: 1,
    program_id: "123e4567-e89b-12d3-a456-426614174004",
    name: "Test Workout",
    blocks: [
      createMockExerciseBlock(),
      createMockCircuitBlock(),
      createMockCircuitBlock2(),
    ],
  }
}
function createMockWorkout(): Workout {
  return {
    id: "123e4567-e89b-12d3-a456-426614174003",
    program_order: 1,
    week: 1,
    program_id: "123e4567-e89b-12d3-a456-426614174004",
    name: "Test Workout",
    blocks: [createMockExerciseBlock(), createMockCircuitBlock()],
  }
}

describe("mergeWorkoutWithProposedChanges", () => {
  describe("add-block operations", () => {
    it("should add a new block at the specified position", () => {
      const mockWorkout = createMockWorkout()
      const newBlock: Block = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174005",
          name: "Squats",
          metadata: {
            sets: "4",
            reps: "12",
            weight: "185",
            rest: "90",
            notes: "Deep squats",
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174005",
          type: "add-block",
          workoutIndex: 0,
          blockIndex: 1,
          block: newBlock,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result.blocks).toHaveLength(3)
      expect(result.blocks[1]).toEqual({
        ...newBlock,
        pendingStatus: {
          type: "adding",
          proposalId: "123e4567-e89b-12d3-a456-426614174005",
        },
      })
    })

    it("should add block at the beginning when afterBlockIndex is 0", () => {
      const mockWorkout = createMockWorkout()
      const newBlock: Block = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174006",
          name: "Deadlifts",
          metadata: {
            sets: "3",
            reps: "8",
            weight: "225",
            rest: "120",
            notes: "Keep back straight",
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174006",
          type: "add-block",
          workoutIndex: 0,
          blockIndex: 0,
          block: newBlock,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result.blocks).toHaveLength(3)
      expect(result.blocks[0]).toEqual({
        ...newBlock,
        pendingStatus: {
          type: "adding",
          proposalId: "123e4567-e89b-12d3-a456-426614174006",
        },
      })
    })
  })

  describe("update-block operations", () => {
    it("should update an existing block with pending status", () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const updatedBlock: Block = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Incline Bench Press",
          metadata: {
            sets: "4",
            reps: "8",
            weight: "125",
            rest: "75",
            notes: "Higher angle",
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174007",
          type: "update-block",
          workoutIndex: 0,
          blockIndex: 0,
          block: updatedBlock,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual({
        ...updatedBlock,
        pendingStatus: {
          type: "updating",
          oldBlock: mockExerciseBlock,
          proposalId: "123e4567-e89b-12d3-a456-426614174007",
        },
      })
    })
  })

  describe("remove-block operations", () => {
    it("should mark a block for removal with pending status", () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174008",
          type: "remove-block",
          workoutIndex: 0,
          blockIndex: 0,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual({
        ...mockExerciseBlock,
        pendingStatus: {
          type: "removing",
          proposalId: "123e4567-e89b-12d3-a456-426614174008",
        },
      })
    })
  })

  describe("add-circuit-exercise operations", () => {
    it("should add an exercise to a circuit block", () => {
      const mockWorkout = createMockWorkout()
      const newExercise: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174007",
          name: "Dips",
          metadata: {
            sets: "3",
            reps: "12",
            weight: "0",
            rest: "30",
            notes: "Lean forward slightly",
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174009",
          type: "add-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 1,
          exercise: newExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result.blocks).toHaveLength(2)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(3)
      expect(circuitBlock.circuit.exercises[1]).toEqual({
        ...newExercise,
        pendingStatus: {
          type: "adding",
          proposalId: "123e4567-e89b-12d3-a456-426614174009",
        },
      })
    })

    it("should not add exercise to non-circuit block", () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const newExercise: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174008",
          name: "Tricep Pushdowns",
          metadata: {
            sets: "3",
            reps: "15",
            weight: "50",
            rest: "30",
            notes: "Control the weight",
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174010",
          type: "add-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 0, // This is an exercise block, not a circuit
          exerciseIndex: 0,
          exercise: newExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      // Should remain unchanged
      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual(mockExerciseBlock)
    })
  })

  describe("update-circuit-exercise operations", () => {
    it("should update an exercise in a circuit block", () => {
      const mockWorkout = createMockWorkout()
      const mockCircuitBlock = createMockCircuitBlock()
      const updatedExercise: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "Diamond Push-ups",
          metadata: {
            sets: "3",
            reps: "12",
            weight: "0",
            rest: "30",
            notes: "Hands in diamond shape",
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174011",
          type: "update-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 0,
          exercise: updatedExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result.blocks).toHaveLength(2)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(2)
      expect(circuitBlock.circuit.exercises[0]).toEqual({
        ...updatedExercise,
        pendingStatus: {
          type: "updating",
          oldBlock: mockCircuitBlock.circuit.exercises[0],
          proposalId: "123e4567-e89b-12d3-a456-426614174011",
        },
      })
    })

    it("should not update exercise in non-circuit block", () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const updatedExercise: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174009",
          name: "Test Exercise",
          metadata: {
            sets: "3",
            reps: "10",
            weight: "100",
            rest: "60",
            notes: "Test",
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174017",
          type: "update-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 0, // This is an exercise block, not a circuit
          exerciseIndex: 0,
          exercise: updatedExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      // Should remain unchanged
      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual(mockExerciseBlock)
    })
  })

  describe("remove-circuit-exercise operations", () => {
    it("should mark an exercise for removal in a circuit block", () => {
      const mockWorkout = createMockWorkout()
      const mockCircuitBlock = createMockCircuitBlock()
      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174012",
          type: "remove-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 0,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result.blocks).toHaveLength(2)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(2)
      expect(circuitBlock.circuit.exercises[0]).toEqual({
        ...mockCircuitBlock.circuit.exercises[0],
        pendingStatus: {
          type: "removing",
          proposalId: "123e4567-e89b-12d3-a456-426614174012",
        },
      })
    })

    it("should not remove exercise from non-circuit block", () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174013",
          type: "remove-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 0, // This is an exercise block, not a circuit
          exerciseIndex: 0,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      // Should remain unchanged
      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual(mockExerciseBlock)
    })
  })

  describe("multiple changes", () => {
    it("should apply multiple changes in sequence", () => {
      const mockWorkout = createMockWorkout()
      const newBlock: Block = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174010",
          name: "Shoulder Press",
          metadata: {
            sets: "3",
            reps: "10",
            weight: "65",
            rest: "60",
            notes: "Keep core engaged",
          },
        },
      }

      const newExercise: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174011",
          name: "Chin-ups",
          metadata: {
            sets: "3",
            reps: "6",
            weight: "0",
            rest: "30",
            notes: "Underhand grip",
          },
        },
      }

      const changes: WorkoutChange[] = sortProposedChanges([
        {
          id: "123e4567-e89b-12d3-a456-426614174014",
          type: "add-block",
          workoutIndex: 0,
          blockIndex: 2,
          block: newBlock,
        },
        {
          id: "123e4567-e89b-12d3-a456-426614174015",
          type: "add-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 2,
          exercise: newExercise,
        },
        {
          id: "123e4567-e89b-12d3-a456-426614174016",
          type: "remove-block",
          workoutIndex: 0,
          blockIndex: 0,
        },
      ])

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      // Should have 3 blocks (original 2 + 1 added)
      expect(result.blocks).toHaveLength(3)

      // First block should be marked for removal
      expect(result.blocks[0].pendingStatus).toEqual({
        type: "removing",
        proposalId: "123e4567-e89b-12d3-a456-426614174016",
      })

      // Circuit block should have 3 exercises (original 2 + 1 added)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(3)
      expect(circuitBlock.circuit.exercises[2]).toEqual({
        ...newExercise,
        pendingStatus: {
          type: "adding",
          proposalId: "123e4567-e89b-12d3-a456-426614174015",
        },
      })

      // New block should be added at the end
      expect(result.blocks[2]).toEqual({
        ...newBlock,
        pendingStatus: {
          type: "adding",
          proposalId: "123e4567-e89b-12d3-a456-426614174014",
        },
      })
    })
  })

  describe("edge cases", () => {
    it("should not apply changes if the workout index is not matching the workout index of the change", () => {
      const mockWorkout = createMockWorkout()
      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174017",
          type: "remove-block",
          workoutIndex: 0,
          blockIndex: 0,
        },
      ]
      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 1)
      expect(result).toEqual(mockWorkout)
    })
    it("should handle empty changes array", () => {
      const mockWorkout = createMockWorkout()
      const changes: WorkoutChange[] = []
      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(result).toEqual(mockWorkout)
    })

    it("should not mutate the original workout", () => {
      const mockWorkout = createMockWorkout()
      const originalWorkout = JSON.parse(JSON.stringify(mockWorkout))
      const changes: WorkoutChange[] = [
        {
          id: "123e4567-e89b-12d3-a456-426614174017",
          type: "remove-block",
          workoutIndex: 0,
          blockIndex: 0,
        },
      ]

      mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)

      expect(mockWorkout).toEqual(originalWorkout)
    })
  })
  describe("multiple changes with index shifts from add block and add circuit exercise", () => {
    it("Should properly handle multiple add-block and add-circuit-exercise changes", () => {
      const mockWorkout = createMockWorkout2Circuits()
      const newExercise: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174011",
          name: "Chin-ups",
          metadata: {
            sets: "3",
            reps: "6",
            weight: "0",
            rest: "30",
            notes: "Underhand grip",
          },
        },
      }
      const newExercise2: ExerciseBlock = {
        type: "exercise",
        exercise: {
          id: "123e4567-e89b-12d3-a456-426614174052",
          name: "Push-ups",
          metadata: {
            sets: "3",
            reps: "6",
            weight: "0",
            rest: "30",
            notes: "Underhand grip",
          },
        },
      }

      const changes: WorkoutChange[] = sortProposedChanges([
        {
          id: "123e4567-e89b-12d3-a456-426614174014",
          type: "add-block",
          workoutIndex: 0,
          blockIndex: 0,
          block: newExercise2,
        },
        {
          id: "123e4567-e89b-12d3-a456-426614174015",
          type: "add-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 1, // add to the second block, which is a circuit!
          exerciseIndex: 2,
          exercise: newExercise,
        },
      ])

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes, 0)
      expect(result.blocks).toHaveLength(4)
      expect(result.blocks[0].type).toEqual("exercise")
      expect(result.blocks[1].type).toEqual("exercise")
      expect(result.blocks[2].type).toEqual("circuit")
      expect(result.blocks[3].type).toEqual("circuit")

      const circuit1Block = result.blocks[2] as CircuitBlock
      expect(circuit1Block.circuit.exercises).toHaveLength(3)
      expect(circuit1Block.circuit.exercises[2]).toEqual({
        ...newExercise,
        pendingStatus: {
          type: "adding",
          proposalId: changes[1].id,
        },
      })

      expect(result.blocks[0]).toEqual({
        ...newExercise2,
        pendingStatus: {
          type: "adding",
          proposalId: changes[0].id,
        },
      })
    })
  })
  describe("handling existing workout with pending changes", () => {
    it("If changes are already applied to the workout, they should not be applied again", () => {
      const sampleWorkout: Workout[] = [
        {
          id: "dd138a40-4a21-482c-aabe-fbcdfe707205",
          name: "workout 1",
          program_id: "e9db290e-8068-4b5d-926f-0befce20a3ab",
          program_order: 0,
          blocks: [
            {
              type: "exercise",
              exercise: {
                id: "516e0990-972e-496d-b4d1-4950d4c54451",
                name: "Leg Extensions",
                metadata: {
                  sets: "3",
                  reps: "12",
                  weight: "100",
                  rest: "30s",
                },
              },
              pendingStatus: {
                type: "adding",
                proposalId: "5d2f41d7-76fc-47ab-941b-346622a9aeed",
              },
            },
            {
              type: "exercise",
              exercise: {
                id: "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
                name: "Split Squats",
                metadata: {
                  sets: "3",
                  reps: "12",
                  weight: "100",
                  rest: "30s",
                },
              },
              pendingStatus: {
                type: "updating",
                oldBlock: {
                  type: "exercise",
                  exercise: {
                    id: "381facbb-912c-4212-9842-9d173be77fd0",
                    name: "Double Leg Calf Raise w/Step",
                    metadata: {
                      sets: "3",
                      reps: "12",
                      weight: "100",
                      rest: "30s",
                    },
                  },
                },
                proposalId: "db3512c7-53c5-4274-bc93-009e135d96f6",
              },
            },
            {
              type: "exercise",
              exercise: {
                id: "5fdd9135-cd45-4695-8968-b62a0f34c757",
                name: "Single Leg Calf Raise w/Step",
                metadata: {
                  sets: "3",
                  reps: "12",
                  weight: "100",
                  rest: "30s",
                },
              },
            },
            {
              type: "circuit",
              circuit: {
                isDefault: false,
                name: "Circuit 1",
                description: "Circuit 1 description",
                metadata: {
                  sets: "3",
                  rest: "30s",
                  notes: "Circuit 1 notes",
                },
                exercises: [
                  {
                    type: "exercise",
                    exercise: {
                      id: "b4711ec3-d3b5-43ef-a2bd-a29d6bfd4caa",
                      name: "Calf Raises w/Knees Bent",
                      metadata: {
                        sets: "3",
                        reps: "12",
                        weight: "100",
                        rest: "30s",
                      },
                    },
                  },
                  {
                    type: "exercise",
                    exercise: {
                      id: "149beb8e-245b-434e-81e9-f53507bf2381",
                      name: "Heel Elevated Squats",
                      metadata: {
                        sets: "3",
                        reps: "12",
                        weight: "100",
                        rest: "30s",
                      },
                    },
                  },
                ],
              },
              pendingStatus: {
                type: "removing",
                proposalId: "936cb408-82c0-4a6e-b51d-fee9188b8138",
              },
            },
            {
              type: "circuit",
              circuit: {
                isDefault: false,
                name: "Circuit 2",
                description: "Circuit 2 description",
                metadata: {
                  sets: "3",
                  rest: "30s",
                  notes: "Circuit 2 notes",
                },
                exercises: [
                  {
                    type: "exercise",
                    exercise: {
                      id: "516e0990-972e-496d-b4d1-4950d4c54451",
                      name: "Leg Extensions",
                      metadata: {
                        sets: "3",
                        reps: "12",
                        weight: "100",
                        rest: "30s",
                      },
                    },
                    pendingStatus: {
                      type: "adding",
                      proposalId: "24246d9c-ccb5-4438-973f-9184edeeb086",
                    },
                  },
                  {
                    type: "exercise",
                    exercise: {
                      id: "fdd06654-a295-4b72-a2fb-b1585fcb3dc5",
                      name: "Reverse Lunges",
                      metadata: {
                        sets: "3",
                        reps: "12",
                        weight: "100",
                        rest: "30s",
                      },
                    },
                    pendingStatus: {
                      type: "removing",
                      proposalId: "0a955bae-cdf3-49c1-902f-08a64c082b2a",
                    },
                  },
                  {
                    type: "exercise",
                    exercise: {
                      id: "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
                      name: "Split Squats",
                      metadata: {
                        sets: "3",
                        reps: "12",
                        weight: "100",
                        rest: "30s",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ]

      const proposedChanges: WorkoutChange[] = [
        {
          id: "5d2f41d7-76fc-47ab-941b-346622a9aeed",
          type: "add-block",
          workoutIndex: 0,
          blockIndex: 0,
          block: {
            type: "exercise",
            exercise: {
              id: "516e0990-972e-496d-b4d1-4950d4c54451",
              name: "Leg Extensions",
              metadata: {
                sets: "3",
                reps: "12",
                weight: "100",
                rest: "30s",
              },
            },
          },
        },
        {
          id: "db3512c7-53c5-4274-bc93-009e135d96f6",
          type: "update-block",
          workoutIndex: 0,
          blockIndex: 0,
          block: {
            type: "exercise",
            exercise: {
              id: "43338045-a2de-4f4a-b0f8-4f2d0c50eeaf",
              name: "Split Squats",
              metadata: {
                sets: "3",
                reps: "12",
                weight: "100",
                rest: "30s",
              },
            },
          },
        },
        {
          id: "936cb408-82c0-4a6e-b51d-fee9188b8138",
          type: "remove-block",
          workoutIndex: 0,
          blockIndex: 2,
        },
        {
          id: "24246d9c-ccb5-4438-973f-9184edeeb086",
          type: "add-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 3,
          exerciseIndex: 0,
          exercise: {
            type: "exercise",
            exercise: {
              id: "516e0990-972e-496d-b4d1-4950d4c54451",
              name: "Leg Extensions",
              metadata: {
                sets: "3",
                reps: "12",
                weight: "100",
                rest: "30s",
              },
            },
          },
        },
        {
          id: "0a955bae-cdf3-49c1-902f-08a64c082b2a",
          type: "remove-circuit-exercise",
          workoutIndex: 0,
          circuitBlockIndex: 3,
          exerciseIndex: 0,
        },
      ]
      const updatedWorkout = mergeWorkoutWithProposedChanges(
        sampleWorkout[0],
        proposedChanges,
        0
      )
      expect(updatedWorkout).toEqual(sampleWorkout[0])
    })
  })
})
