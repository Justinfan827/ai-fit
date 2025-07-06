import { WorkoutChange } from '@/lib/ai/tools/diff-schema'
import {
  Block,
  CircuitBlock,
  ExerciseBlock,
  Workout,
} from '@/lib/domain/workouts'
import { describe, expect, it } from 'vitest'
import { mergeWorkoutWithProposedChanges } from './workout-merge'

// Test data factory functions to ensure each test gets fresh copies
function createMockExerciseBlock(): ExerciseBlock {
  return {
    type: 'exercise',
    exercise: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Bench Press',
      metadata: {
        sets: '3',
        reps: '10',
        weight: '135',
        rest: '60',
        notes: 'Focus on form',
      },
    },
  }
}

function createMockCircuitBlock(): CircuitBlock {
  return {
    type: 'circuit',
    circuit: {
      isDefault: false,
      name: 'Upper Body Circuit',
      description: 'A circuit for upper body strength',
      metadata: {
        sets: '3',
        rest: '120',
        notes: 'Complete all exercises before resting',
      },
      exercises: [
        {
          type: 'exercise',
          exercise: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Push-ups',
            metadata: {
              sets: '3',
              reps: '15',
              weight: '0',
              rest: '30',
              notes: 'Keep core tight',
            },
          },
        },
        {
          type: 'exercise',
          exercise: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Pull-ups',
            metadata: {
              sets: '3',
              reps: '8',
              weight: '0',
              rest: '30',
              notes: 'Full range of motion',
            },
          },
        },
      ],
    },
  }
}

function createMockWorkout(): Workout {
  return {
    id: '123e4567-e89b-12d3-a456-426614174003',
    program_order: 1,
    week: 1,
    program_id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'Test Workout',
    blocks: [createMockExerciseBlock(), createMockCircuitBlock()],
  }
}

describe('mergeWorkoutWithProposedChanges', () => {
  describe('add-block operations', () => {
    it('should add a new block at the specified position', () => {
      const mockWorkout = createMockWorkout()
      const newBlock: Block = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174005',
          name: 'Squats',
          metadata: {
            sets: '4',
            reps: '12',
            weight: '185',
            rest: '90',
            notes: 'Deep squats',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'add-block',
          workoutIndex: 0,
          afterBlockIndex: 1,
          block: newBlock,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result.blocks).toHaveLength(3)
      expect(result.blocks[1]).toEqual({
        ...newBlock,
        pendingStatus: { type: 'adding' },
      })
    })

    it('should add block at the beginning when afterBlockIndex is 0', () => {
      const mockWorkout = createMockWorkout()
      const newBlock: Block = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174006',
          name: 'Deadlifts',
          metadata: {
            sets: '3',
            reps: '8',
            weight: '225',
            rest: '120',
            notes: 'Keep back straight',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'add-block',
          workoutIndex: 0,
          afterBlockIndex: 0,
          block: newBlock,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result.blocks).toHaveLength(3)
      expect(result.blocks[0]).toEqual({
        ...newBlock,
        pendingStatus: { type: 'adding' },
      })
    })
  })

  describe('update-block operations', () => {
    it('should update an existing block with pending status', () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const updatedBlock: Block = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Incline Bench Press',
          metadata: {
            sets: '4',
            reps: '8',
            weight: '125',
            rest: '75',
            notes: 'Higher angle',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'update-block',
          workoutIndex: 0,
          blockIndex: 0,
          block: updatedBlock,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual({
        ...updatedBlock,
        pendingStatus: {
          type: 'updating',
          oldBlock: mockExerciseBlock,
        },
      })
    })
  })

  describe('remove-block operations', () => {
    it('should mark a block for removal with pending status', () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const changes: WorkoutChange[] = [
        {
          type: 'remove-block',
          workoutIndex: 0,
          blockIndex: 0,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual({
        ...mockExerciseBlock,
        pendingStatus: { type: 'removing' },
      })
    })
  })

  describe('add-circuit-exercise operations', () => {
    it('should add an exercise to a circuit block', () => {
      const mockWorkout = createMockWorkout()
      const newExercise: ExerciseBlock = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174007',
          name: 'Dips',
          metadata: {
            sets: '3',
            reps: '12',
            weight: '0',
            rest: '30',
            notes: 'Lean forward slightly',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'add-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 1,
          exercise: newExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result.blocks).toHaveLength(2)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(3)
      expect(circuitBlock.circuit.exercises[1]).toEqual({
        ...newExercise,
        pendingStatus: { type: 'adding' },
      })
    })

    it('should not add exercise to non-circuit block', () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const newExercise: ExerciseBlock = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174008',
          name: 'Tricep Pushdowns',
          metadata: {
            sets: '3',
            reps: '15',
            weight: '50',
            rest: '30',
            notes: 'Control the weight',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'add-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 0, // This is an exercise block, not a circuit
          exerciseIndex: 0,
          exercise: newExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      // Should remain unchanged
      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual(mockExerciseBlock)
    })
  })

  describe('update-circuit-exercise operations', () => {
    it('should update an exercise in a circuit block', () => {
      const mockWorkout = createMockWorkout()
      const mockCircuitBlock = createMockCircuitBlock()
      const updatedExercise: ExerciseBlock = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Diamond Push-ups',
          metadata: {
            sets: '3',
            reps: '12',
            weight: '0',
            rest: '30',
            notes: 'Hands in diamond shape',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'update-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 0,
          exercise: updatedExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result.blocks).toHaveLength(2)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(2)
      expect(circuitBlock.circuit.exercises[0]).toEqual({
        ...updatedExercise,
        pendingStatus: {
          type: 'updating',
          oldBlock: mockCircuitBlock.circuit.exercises[0],
        },
      })
    })

    it('should not update exercise in non-circuit block', () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const updatedExercise: ExerciseBlock = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174009',
          name: 'Test Exercise',
          metadata: {
            sets: '3',
            reps: '10',
            weight: '100',
            rest: '60',
            notes: 'Test',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'update-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 0, // This is an exercise block, not a circuit
          exerciseIndex: 0,
          exercise: updatedExercise,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      // Should remain unchanged
      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual(mockExerciseBlock)
    })
  })

  describe('remove-circuit-exercise operations', () => {
    it('should mark an exercise for removal in a circuit block', () => {
      const mockWorkout = createMockWorkout()
      const mockCircuitBlock = createMockCircuitBlock()
      const changes: WorkoutChange[] = [
        {
          type: 'remove-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 0,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result.blocks).toHaveLength(2)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(2)
      expect(circuitBlock.circuit.exercises[0]).toEqual({
        ...mockCircuitBlock.circuit.exercises[0],
        pendingStatus: { type: 'removing' },
      })
    })

    it('should not remove exercise from non-circuit block', () => {
      const mockWorkout = createMockWorkout()
      const mockExerciseBlock = createMockExerciseBlock()
      const changes: WorkoutChange[] = [
        {
          type: 'remove-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 0, // This is an exercise block, not a circuit
          exerciseIndex: 0,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      // Should remain unchanged
      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0]).toEqual(mockExerciseBlock)
    })
  })

  describe('multiple changes', () => {
    it('should apply multiple changes in sequence', () => {
      const mockWorkout = createMockWorkout()
      const newBlock: Block = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174010',
          name: 'Shoulder Press',
          metadata: {
            sets: '3',
            reps: '10',
            weight: '65',
            rest: '60',
            notes: 'Keep core engaged',
          },
        },
      }

      const newExercise: ExerciseBlock = {
        type: 'exercise',
        exercise: {
          id: '123e4567-e89b-12d3-a456-426614174011',
          name: 'Chin-ups',
          metadata: {
            sets: '3',
            reps: '6',
            weight: '0',
            rest: '30',
            notes: 'Underhand grip',
          },
        },
      }

      const changes: WorkoutChange[] = [
        {
          type: 'add-block',
          workoutIndex: 0,
          afterBlockIndex: 2,
          block: newBlock,
        },
        {
          type: 'add-circuit-exercise',
          workoutIndex: 0,
          circuitBlockIndex: 1,
          exerciseIndex: 2,
          exercise: newExercise,
        },
        {
          type: 'remove-block',
          workoutIndex: 0,
          blockIndex: 0,
        },
      ]

      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      // Should have 3 blocks (original 2 + 1 added)
      expect(result.blocks).toHaveLength(3)

      // First block should be marked for removal
      expect(result.blocks[0].pendingStatus).toEqual({ type: 'removing' })

      // Circuit block should have 3 exercises (original 2 + 1 added)
      const circuitBlock = result.blocks[1] as CircuitBlock
      expect(circuitBlock.circuit.exercises).toHaveLength(3)
      expect(circuitBlock.circuit.exercises[2]).toEqual({
        ...newExercise,
        pendingStatus: { type: 'adding' },
      })

      // New block should be added at the end
      expect(result.blocks[2]).toEqual({
        ...newBlock,
        pendingStatus: { type: 'adding' },
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty changes array', () => {
      const mockWorkout = createMockWorkout()
      const changes: WorkoutChange[] = []
      const result = mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(result).toEqual(mockWorkout)
    })

    it('should not mutate the original workout', () => {
      const mockWorkout = createMockWorkout()
      const originalWorkout = JSON.parse(JSON.stringify(mockWorkout))
      const changes: WorkoutChange[] = [
        {
          type: 'remove-block',
          workoutIndex: 0,
          blockIndex: 0,
        },
      ]

      mergeWorkoutWithProposedChanges(mockWorkout, changes)

      expect(mockWorkout).toEqual(originalWorkout)
    })
  })
})
