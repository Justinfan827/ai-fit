import { WorkoutChange } from '@/lib/ai/tools/diff-schema'
import { Block, ExerciseBlock, Workout } from '@/lib/domain/workouts'
import { cloneDeep } from 'lodash'

/*
This function is used to merge the proposed changes into the workout.
It is used to update the workout with the proposed changes.

Changes are processed in the following order:
1. Removals (remove-block, remove-circuit-exercise)
2. Updates (update-block, update-circuit-exercise)
3. Additions for circuit exercises (add-circuit-exercise) - sorted by circuit block index descending, then exercise index descending
4. Additions for blocks (add-block) - sorted by block index descending

This order ensures that:
- Index-shifting operations (additions) happen last, after all other operations that rely on original indices
- Additions are processed from highest index to lowest index to avoid index shifting issues
*/
export function mergeWorkoutWithProposedChanges(
  workout: Workout,
  proposedChanges: WorkoutChange[]
) {
  if (!proposedChanges?.length) return workout

  const newWorkout = cloneDeep(workout)

  // Group changes by type
  const groupedChanges = {
    'remove-block': proposedChanges.filter((c) => c.type === 'remove-block'),
    'remove-circuit-exercise': proposedChanges.filter(
      (c) => c.type === 'remove-circuit-exercise'
    ),
    'update-block': proposedChanges.filter((c) => c.type === 'update-block'),
    'update-circuit-exercise': proposedChanges.filter(
      (c) => c.type === 'update-circuit-exercise'
    ),
    'add-circuit-exercise': proposedChanges.filter(
      (c) => c.type === 'add-circuit-exercise'
    ),
    'add-block': proposedChanges.filter((c) => c.type === 'add-block'),
  }

  // Sort each group as needed
  // For add-circuit-exercise: sort by circuitBlockIndex descending, then exerciseIndex descending
  groupedChanges['add-circuit-exercise'].sort((a, b) => {
    const circuitBlockDiff = b.circuitBlockIndex - a.circuitBlockIndex
    if (circuitBlockDiff !== 0) {
      return circuitBlockDiff
    }
    return b.exerciseIndex - a.exerciseIndex
  })

  // For add-block: sort by blockIndex descending
  groupedChanges['add-block'].sort((a, b) => b.blockIndex - a.blockIndex)

  // Flatten back to single array in processing order
  const sortedChanges = [
    ...groupedChanges['remove-block'],
    ...groupedChanges['remove-circuit-exercise'],
    ...groupedChanges['update-block'],
    ...groupedChanges['update-circuit-exercise'],
    ...groupedChanges['add-circuit-exercise'],
    ...groupedChanges['add-block'],
  ]

  sortedChanges.forEach((change) => {
    switch (change.type) {
      case 'add-block':
        const newBlock: Block = {
          ...change.block,
          pendingStatus: { type: 'adding', proposalId: change.id },
        }
        newWorkout.blocks.splice(change.blockIndex, 0, newBlock)
        break
      case 'update-block':
        const blockToUpdate = workout.blocks[change.blockIndex]
        const updatedBlock: Block = {
          ...change.block,
          pendingStatus: {
            type: 'updating',
            oldBlock: blockToUpdate,
            proposalId: change.id,
          },
        }
        newWorkout.blocks[change.blockIndex] = updatedBlock
        break
      case 'remove-block':
        const blockToRemove = workout.blocks[change.blockIndex]
        const removedBlock: Block = {
          ...blockToRemove,
          pendingStatus: { type: 'removing', proposalId: change.id },
        }
        newWorkout.blocks[change.blockIndex] = removedBlock
        break
      case 'add-circuit-exercise':
        const circuitBlock = workout.blocks[change.circuitBlockIndex]
        if (circuitBlock.type !== 'circuit') {
          console.log('Attempted to add an exercise to a non-circuit block')
          break
        }
        const newExercise: ExerciseBlock = {
          ...change.exercise,
          pendingStatus: { type: 'adding', proposalId: change.id },
        }
        const targetCircuitBlock = newWorkout.blocks[change.circuitBlockIndex]
        if (targetCircuitBlock.type === 'circuit') {
          targetCircuitBlock.circuit.exercises.splice(
            change.exerciseIndex,
            0,
            newExercise
          )
        }
        break
      case 'remove-circuit-exercise':
        const circuitBlockToRemove = workout.blocks[change.circuitBlockIndex]
        if (circuitBlockToRemove.type !== 'circuit') {
          console.log(
            'Attempted to remove an exercise from a non-circuit block'
          )
          break
        }
        const exerciseToRemove =
          circuitBlockToRemove.circuit.exercises[change.exerciseIndex]
        const exerciseToRemoveWithPendingStatus: ExerciseBlock = {
          ...exerciseToRemove,
          pendingStatus: { type: 'removing', proposalId: change.id },
        }
        const targetRemoveCircuitBlock =
          newWorkout.blocks[change.circuitBlockIndex]
        if (targetRemoveCircuitBlock.type === 'circuit') {
          targetRemoveCircuitBlock.circuit.exercises[change.exerciseIndex] =
            exerciseToRemoveWithPendingStatus
        }
        break
      case 'update-circuit-exercise':
        const circuitBlockToUpdate = workout.blocks[change.circuitBlockIndex]
        if (circuitBlockToUpdate.type !== 'circuit') {
          console.log('Attempted to update an exercise in a non-circuit block')
          break
        }
        const exerciseToUpdate =
          circuitBlockToUpdate.circuit.exercises[change.exerciseIndex]
        const exerciseToUpdateWithPendingStatus: ExerciseBlock = {
          ...change.exercise,
          pendingStatus: {
            type: 'updating',
            oldBlock: exerciseToUpdate,
            proposalId: change.id,
          },
        }
        const targetUpdateCircuitBlock =
          newWorkout.blocks[change.circuitBlockIndex]
        if (targetUpdateCircuitBlock.type === 'circuit') {
          targetUpdateCircuitBlock.circuit.exercises[change.exerciseIndex] =
            exerciseToUpdateWithPendingStatus
        }
        break
    }
  })
  return newWorkout
}
