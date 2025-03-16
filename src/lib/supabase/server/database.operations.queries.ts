import 'server-only'

import { User } from '@supabase/supabase-js'

import { Client } from '@/lib/domain/clients'
import {
  Program,
  Workout,
  WorkoutExercise,
  WorkoutInstance,
  workoutSchema,
} from '@/lib/domain/workouts'
import { Res } from '@/lib/types/types'
import { createServerClient } from '../create-server-client'
import { isClient } from '../utils'
import { resolveProgram, resolvePrograms } from './programs/utils'

export async function getCurrentUserClients(): Promise<Res<Client[]>> {
  const client = await createServerClient()

  const { data: userRes, error: getUserError } = await client.auth.getUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }
  const { data: clients, error: clientError } = await client
    .from('users')
    .select('*')
    .eq('trainer_id', userRes.user.id)

  if (clientError) {
    return { data: null, error: clientError }
  }
  return {
    data: clients.map((c) => ({
      id: c.id,
      email: c.email || '',
      firstName: c.first_name || '',
      lastName: c.last_name || '',
    })),
    error: null,
  }
}

export interface CurrentUser {
  sbUser: User
  metadata: {
    firstName: string
    lastName: string
    role: 'trainer' | 'client'
  }
}
export async function getCurrentUser(): Promise<Res<CurrentUser>> {
  const client = await createServerClient()
  const { data: userRes, error: getUserError } = await client.auth.getUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const { data: dbUser, error: dbErr } = await client
    .from('users')
    .select('*')
    .eq('id', userRes.user.id)
    .single()
  if (dbErr) {
    return { data: null, error: dbErr }
  }
  const { user: sbUser } = userRes
  return {
    data: {
      sbUser,
      metadata: {
        firstName: dbUser.first_name || '',
        lastName: dbUser.last_name || '',
        // @ts-ignore TODO: fix type
        role: isClient(userRes) ? 'client' : 'trainer',
      },
    },
    error: null,
  }
}

export async function getLatestWorkoutInstance(
  _workoutid: string
): Promise<Res<WorkoutInstance | undefined>> {
  return { data: null, error: new Error('Not implemented') }
  // const client = await createServerClient()
  // const { data, error } = await client.auth.getUser()
  // if (error) {
  //   return { data: null, error }
  // }
  //
  // const { data: pData, error: pErr } = await client
  //   .from('workout_instances')
  //   .select('*, workouts (name)')
  //   .eq('user_id', data.user.id)
  //   .eq('workout_id', workoutid)
  //   .order('created_at', { ascending: false })
  //   .limit(1)
  //   .maybeSingle()
  //
  // if (pErr) {
  //   return { data: null, error: pErr }
  // }
  // if (!pData) {
  //   return { data: undefined, error: null }
  // }
  // const resData: WorkoutInstance = {
  //   id: pData.id,
  //   startAt: pData.start_at,
  //   endAt: pData.end_at,
  //   workoutId: pData.workout_id,
  //   workout_name: pData.workouts!.name,
  //   blocks: pData.blocks as WorkoutInstanceBlock[],
  // }
  // const { data: wData, error: wErr } = workoutInstanceSchema.safeParse(resData)
  // if (wErr) {
  //   return { data: null, error: wErr }
  // }
  // return {
  //   data: wData,
  //   error: null,
  // }
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
    blocks: pData.blocks as WorkoutExercise[],
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
  _: string
): Promise<Res<WorkoutInstance[]>> {
  return { data: null, error: new Error('Not implemented') }
  // const client = await createServerClient()
  // const { data, error } = await client.auth.getUser()
  // if (error) {
  //   return { data: null, error }
  // }
  // const { data: pData, error: pErr } = await client
  //   .from('workout_instances')
  //   .select('*, workouts (name)')
  //   .eq('user_id', data.user.id)
  //   .eq('program_id', programId)
  //
  // if (pErr) {
  //   return { data: null, error: pErr }
  // }
  //
  // const resData: WorkoutInstance[] = pData.map((p) => ({
  //   id: p.id,
  //   start_at: p.start_at,
  //   end_at: p.end_at,
  //   workout_id: p.workout_id,
  //   workout_name: p.workouts!.name,
  //   blocks: p.blocks as WorkoutInstanceBlock[],
  // }))
  // const { data: wData, error: wErr } = z
  //   .array(workoutInstanceSchema)
  //   .safeParse(resData)
  // if (wErr) {
  //   return { data: null, error: wErr }
  // }
  //
  // return {
  //   data: wData,
  //   error: null,
  // }
}

export async function getExercises() {
  const client = await createServerClient()
  return client.from('exercises').select('*')
}

export async function getProgramById(programId: string): Promise<Res<Program>> {
  const client = await createServerClient()
  const { data: pData, error: pErr } = await client
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single()

  if (pErr) {
    return { data: null, error: pErr }
  }
  return resolveProgram(pData)
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
export async function getAllCurrentUserUnassignedPrograms(): Promise<
  Res<Program[]>
> {
  const sb = await createServerClient()
  const { data: userRes, error: getUserError } = await sb.auth.getUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const { data: wData, error: wErr } = await sb
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false })
    .eq('user_id', userRes.user.id)
  if (wErr) {
    return { data: null, error: wErr }
  }
  return resolvePrograms(sb, wData)
}

/*
 * As the logged in client user, get the active program.
 * Currently, just the latest assigned program
 */
export async function getClientActiveProgram(): Promise<
  Res<Program | undefined | null>
> {
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
    .limit(1) // get the latest program

  if (pErr) {
    return { data: null, error: pErr }
  }
  if (pData.length === 0 || !pData) {
    return { data: undefined, error: null }
  }
  return resolveProgram(pData[0])
}

export async function signInUserCode({ code }: { code: string }): Promise<
  Res<{
    userId: string
  }>
> {
  const client = await createServerClient()
  const { data, error } = await client
    .from('user_codes')
    .select('*, users (email)')
    .eq('code', code)
    .single()
  if (error) {
    return { data: null, error }
  }

  console.log({ da: data.users })
  const { error: userErr } = await client.auth.signInWithPassword({
    email: data.users?.email || '',
    password: data.users?.email || '',
  })
  if (userErr) {
    return { data: null, error: userErr }
  }
  return { data: { userId: data.user_id }, error: null }
}
