import 'server-only'

import { User } from '@supabase/supabase-js'

import {
  Program,
  programSchema,
  Workout,
  WorkoutExercise,
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
import { isClient } from '../utils'

export interface Client {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface ClientWithPrograms extends Client {
  programs: Program[]
}

/*
 *
 * When logged into the client account, get the client user and their assigned programs from a trainer
 */
export async function getClientUserWithPrograms(
  clientId: string
): Promise<Res<ClientWithPrograms>> {
  const sb = await createServerClient()

  const { data: userRes, error: getUserError } = await sb.auth.getUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const { data: client, error: clientError } = await sb
    .from('users')
    .select('*')
    .eq('trainer_id', userRes.user.id)
    .eq('id', clientId)
    .single()

  if (clientError) {
    return { data: null, error: clientError }
  }

  const { data: pData, error: pErr } = await sb
    .from('programs')
    .select('*')
    .eq('user_id', client.id)
    .order('created_at', { ascending: false })

  if (pErr) {
    return { data: null, error: pErr }
  }

  const { data: progData, error: progErr } = await resolvePrograms(sb, pData)
  if (progErr) {
    return { data: null, error: progErr }
  }

  return {
    data: {
      id: client.id,
      email: client.email || '',
      firstName: client.first_name || '',
      lastName: client.last_name || '',
      programs: progData,
    },
    error: null,
  }
}

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

async function resolveProgram(
  dbProgram: Database['public']['Tables']['programs']['Row']
): Promise<Res<Program>> {
  const client = await createServerClient()
  const { data: wData, error: wErr } = await client
    .from('workouts')
    .select('*')
    .eq('program_id', dbProgram.id)
    .order('program_order', { ascending: true })

  if (wErr) {
    return { data: null, error: wErr }
  }
  const program: Program = {
    id: dbProgram.id,
    type: dbProgram.type as 'weekly' | 'splits',
    name: dbProgram.name,
    created_at: dbProgram.created_at,
    workouts: wData.map((workout) => ({
      id: workout.id,
      program_order: workout.program_order,
      program_id: workout.program_id,
      name: workout.name,
      blocks: workout.blocks as WorkoutExercise[],
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
          blocks: workout.blocks as WorkoutExercise[],
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
