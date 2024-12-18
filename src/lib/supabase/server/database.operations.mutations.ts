import 'server-only'

import {
  Program,
  Workout,
  WorkoutInstance,
  WorkoutInstanceBlock,
} from '@/lib/domain/workouts'
import { Res } from '@/lib/types/types'
import { v4 } from 'uuid'
import { createServerClient } from '../create-server-client'
import { Database } from '../database.types'

export async function createProgram(
  userId: string,
  body: Program
): Promise<Res<Program>> {
  const client = await createServerClient()
  const { data, error } = await client
    .from('programs')
    .insert({
      name: body.name,
      user_id: userId,
    })
    .select('*')
    .single()
  if (error) {
    return { data: null, error: new Error('Failed to create program') }
  }

  const insertWorkouts: Database['public']['Tables']['workouts']['Insert'][] =
    body.workouts.map((workout, idx) => ({
      name: workout.name,
      program_order: idx,
      program_id: data.id,
      user_id: userId,
      blocks: workout.blocks,
    }))
  const { error: wErr } = await client.from('workouts').insert(insertWorkouts)
  if (wErr) {
    return { data: null, error: new Error('Failed to create workouts') }
  }
  return {
    data: {
      created_at: data.created_at,
      id: data.id,
      name: body.name,
      workouts: body.workouts,
    },
    error,
  }
}

export async function updateProgram(
  userId: string,
  program: Program
): Promise<Res<Program>> {
  const client = await createServerClient()
  const { data: dbProgramData, error } = await client
    .from('programs')
    .update({
      name: program.name,
    })
    .eq('id', program.id)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) {
    return { data: null, error: new Error('Failed to update program') }
  }

  // TODO: incrementally update workouts
  const { error: dErr } = await client
    .from('workouts')
    .delete()
    .eq('program_id', program.id)

  if (dErr) {
    return { data: null, error: new Error('Failed to delete workouts') }
  }

  const res = await Promise.all(
    program.workouts.map(async (workout, idx) => {
      const { error: wErr } = await client
        .from('workouts')
        .upsert(
          {
            id: workout.id,
            name: workout.name,
            program_id: program.id,
            program_order: idx,
            user_id: userId,
            blocks: workout.blocks,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        )
        .eq('id', workout.id)
        .select('*')
        .single()
      if (wErr) {
        return { error: wErr }
      }
      return { error: null }
    })
  )

  for (const r of res) {
    if (r.error) {
      return { data: null, error: r.error }
    }
  }
  return {
    data: {
      id: dbProgramData.id,
      created_at: dbProgramData.created_at,
      name: program.name,
      workouts: program.workouts,
    },
    error,
  }
}

export async function updateWorkoutInstance(
  workoutInstance: WorkoutInstance
): Promise<Res<undefined>> {
  const client = await createServerClient()
  const { error } = await client
    .from('workout_instances')
    .update({
      blocks: workoutInstance.blocks,
      ...(workoutInstance.end_at && { end_at: workoutInstance.end_at }),
    })
    .eq('id', workoutInstance.id)
  if (error) {
    return { data: null, error: new Error('Failed to end workout instance') }
  }
  return { data: undefined, error }
}

export async function createWorkoutInstance(
  userId: string,
  workout: Workout
): Promise<Res<WorkoutInstance>> {
  const exerciseSets: WorkoutInstanceBlock[] = workout.blocks.map(
    (exercise) => {
      const numSets = Number(exercise.sets)
      return {
        id: v4().toString(),
        type: 'exercise' as const,
        exercise: {
          id: v4().toString(),
          name: exercise.exercise_name,
          sets: Array.from({ length: numSets }).map(() => {
            return {
              planned: {
                reps: exercise.reps,
                rest: exercise.rest,
                weight: exercise.weight,
                notes: exercise.notes,
              },
              actual: {
                reps: '',
                rest: '',
                weight: '',
                notes: '',
              },
            }
          }),
        },
      }
    }
  )

  const client = await createServerClient()
  const { data, error } = await client
    .from('workout_instances')
    .insert({
      user_id: userId,
      start_at: new Date().toISOString(),
      program_id: workout.program_id,
      workout_id: workout.id,
      blocks: exerciseSets,
    })
    .select('*')
    .single()
  if (error) {
    return { data: null, error: new Error('Failed to create workout instance') }
  }
  return {
    data: {
      id: data.id,
      workout_id: workout.id,
      workout_name: workout.name,
      start_at: data.start_at,
      blocks: exerciseSets,
    },
    error,
  }
}
