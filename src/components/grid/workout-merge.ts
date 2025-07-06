import { WorkoutChange } from '@/lib/ai/tools/diff-schema'
import { Block, ExerciseBlock, Workout } from '@/lib/domain/workouts'
import { cloneDeep } from 'lodash'

/*
This function is used to merge the proposed changes into the workout.
It is used to update the workout with the proposed changes.

Changes are processed in the following order:
1. Removals (remove-block, remove-circuit-exercise)
2. Updates (update-block, update-circuit-exercise)
3. Additions (add-block, add-circuit-exercise)

This order ensures that index-shifting operations (additions) happen last,
after all other operations that rely on original indices.
*/
export function mergeWorkoutWithProposedChanges(
  workout: Workout,
  proposedChanges: WorkoutChange[]
) {
  if (!proposedChanges?.length) return workout

  const newWorkout = cloneDeep(workout)

  // Sort changes by operation type
  const sortedChanges = [...proposedChanges].sort((a, b) => {
    // Define operation priorities (lower number = higher priority)
    const priorities: { [key: string]: number } = {
      'remove-block': 1,
      'remove-circuit-exercise': 1,
      'update-block': 2,
      'update-circuit-exercise': 2,
      'add-block': 3,
      'add-circuit-exercise': 3,
    }
    return priorities[a.type] - priorities[b.type]
  })

  sortedChanges.forEach((change) => {
    switch (change.type) {
      case 'add-block':
        const newBlock: Block = {
          ...change.block,
          pendingStatus: { type: 'adding', proposalId: change.id },
        }
        newWorkout.blocks.splice(change.afterBlockIndex, 0, newBlock)
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
          pendingStatus: { type: 'updating', oldBlock: exerciseToUpdate, proposalId: change.id },
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
