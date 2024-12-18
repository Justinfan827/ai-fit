import 'server-only'

import { User } from '@supabase/supabase-js'

import {
  Exercise,
  Program,
  programSchema,
  Workout,
  WorkoutInstance,
  WorkoutInstanceBlock,
  workoutInstanceSchema,
  workoutSchema,
} from '@/lib/domain/workouts'
import { Res } from '@/lib/types/types'
import { z } from 'zod'
import { createServerClient } from '../create-server-client'
import { Database } from '../database.types'
import { DBClient } from '../types'

export async function getUserFirstLast(client: DBClient, user: User) {
  return client
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()
}

export async function getCurrentUser(client: DBClient): Promise<Res<User>> {
  const { data: userRes, error: getUserError } = await client.auth.getUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }
  const { user } = userRes
  return { data: user, error: null }
}

export async function getLatestWorkoutInstance(
  workoutid: string
): Promise<Res<WorkoutInstance | undefined>> {
  const client = await createServerClient()
  const { data, error } = await client.auth.getUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from('workout_instances')
    .select('*, workouts (name)')
    .eq('user_id', data.user.id)
    .eq('workout_id', workoutid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pErr) {
    return { data: null, error: pErr }
  }
  if (!pData) {
    return { data: undefined, error: null }
  }
  const resData: WorkoutInstance = {
    id: pData.id,
    start_at: pData.start_at,
    end_at: pData.end_at,
    workout_id: pData.workout_id,
    workout_name: pData.workouts!.name,
    blocks: pData.blocks as WorkoutInstanceBlock[],
  }
  const { data: wData, error: wErr } = workoutInstanceSchema.safeParse(resData)
  if (wErr) {
    return { data: null, error: wErr }
  }
  return {
    data: wData,
    error: null,
  }
}

export async function getUserWorkout(workoutid: string): Promise<Res<Workout>> {
  const client = await createServerClient()
  const { data, error } = await client.auth.getUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from('workouts')
    .select('*')
    .eq('user_id', data.user.id)
    .eq('id', workoutid)
    .single()

  if (pErr) {
    return { data: null, error: pErr }
  }

  const resData: Workout = {
    id: pData.id,
    program_order: pData.program_order,
    program_id: pData.program_id,
    name: pData.name,
    blocks: pData.blocks as Exercise[],
  }
  const { data: wData, error: wErr } = workoutSchema.safeParse(resData)
  if (wErr) {
    return { data: null, error: wErr }
  }
  return {
    data: wData,
    error: null,
  }
}

export async function getWorkoutInstances(
  programId: string
): Promise<Res<WorkoutInstance[]>> {
  const client = await createServerClient()
  const { data, error } = await client.auth.getUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from('workout_instances')
    .select('*, workouts (name)')
    .eq('user_id', data.user.id)
    .eq('program_id', programId)

  if (pErr) {
    return { data: null, error: pErr }
  }

  const resData: WorkoutInstance[] = pData.map((p) => ({
    id: p.id,
    start_at: p.start_at,
    end_at: p.end_at,
    workout_id: p.workout_id,
    workout_name: p.workouts!.name,
    blocks: p.blocks as WorkoutInstanceBlock[],
  }))
  const { data: wData, error: wErr } = z
    .array(workoutInstanceSchema)
    .safeParse(resData)
  if (wErr) {
    return { data: null, error: wErr }
  }

  return {
    data: wData,
    error: null,
  }
}
export async function getUserProgram(programId: string): Promise<Res<Program>> {
  const client = await createServerClient()
  const { data, error } = await client.auth.getUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from('programs')
    .select('*')
    .eq('user_id', data.user.id)
    .eq('id', programId)
    .single()

  if (pErr) {
    return { data: null, error: pErr }
  }

  const { data: wData, error: wErr } = await client
    .from('workouts')
    .select('*')
    .eq('program_id', programId)
    .order('program_order', { ascending: true })

  if (wErr) {
    return { data: null, error: wErr }
  }
  const program: Program = {
    id: pData.id,
    name: pData.name,
    created_at: pData.created_at,
    workouts: wData.map((workout) => ({
      id: workout.id,
      program_order: workout.program_order,
      program_id: workout.program_id,
      name: workout.name,
      blocks: workout.blocks as Exercise[],
    })),
  }
  const { data: programData, error: parseErr } =
    programSchema.safeParse(program)
  if (parseErr) {
    return { data: null, error: parseErr }
  }
  return {
    data: programData,
    error: null,
  }
}

export async function getUserPrograms(): Promise<Res<Program[]>> {
  const client = await createServerClient()
  const { data, error } = await client.auth.getUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from('programs')
    .select('*')
    .eq('user_id', data.user.id)
    .order('created_at', { ascending: false })

  if (pErr) {
    return { data: null, error: pErr }
  }
  return resolvePrograms(client, pData)
}

async function resolvePrograms(
  client: DBClient,
  pData: Database['public']['Tables']['programs']['Row'][]
): Promise<Res<Program[]>> {
  const returnData: Program[] = []
  const res = await Promise.all(
    pData.map(async (p) => {
      const { data: wData, error: wErr } = await client
        .from('workouts')
        .select('*')
        .eq('program_id', p.id)
        .order('program_order', { ascending: true })

      if (wErr) {
        return { error: wErr }
      }
      const program: Program = {
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        workouts: wData.map((workout) => ({
          id: workout.id,
          program_order: workout.program_order,
          program_id: workout.program_id,
          name: workout.name,
          blocks: workout.blocks as Exercise[],
        })),
      }
      const { data: programData, error: parseErr } =
        programSchema.safeParse(program)
      if (parseErr) {
        return { error: parseErr }
      }
      returnData.push(programData)
      return { error: null }
    })
  )

  for (const r of res) {
    if (r.error) {
      return { data: null, error: r.error }
    }
  }
  // need to sort the programs by created_at
  returnData.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  return {
    data: returnData,
    error: null,
  }
}

export async function getAllPrograms(): Promise<Res<Program[]>> {
  const client = await createServerClient()
  const { data: wData, error: wErr } = await client
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false })
  if (wErr) {
    return { data: null, error: wErr }
  }
  return resolvePrograms(client, wData)
}
