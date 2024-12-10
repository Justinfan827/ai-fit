import 'server-only'

import { User } from '@supabase/supabase-js'

import { Exercise, Program, programSchema } from '@/lib/domain/workouts'
import { Res } from '@/lib/types/types'
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

  if (wErr) {
    return { data: null, error: wErr }
  }
  const program: Program = {
    id: pData.id,
    name: pData.name,
    workouts: wData.map((workout) => ({
      id: workout.id,
      name: workout.name,
      rows: workout.blocks as Exercise[],
    })),
  }
  const { data: workoutData, error: parseErr } =
    programSchema.safeParse(program)
  if (parseErr) {
    return { data: null, error: parseErr }
  }
  return {
    data: program,
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

      if (wErr) {
        return { error: wErr }
      }
      const program: Program = {
        id: p.id,
        name: p.name,
        workouts: wData.map((workout) => ({
          id: workout.id,
          name: workout.name,
          rows: workout.blocks as Exercise[],
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

  return {
    data: returnData,
    error: null,
  }
}

export async function getAllPrograms(): Promise<Res<Program[]>> {
  const client = await createServerClient()
  const { data: wData, error: wErr } = await client.from('programs').select('*')
  if (wErr) {
    return { data: null, error: wErr }
  }
  return resolvePrograms(client, wData)
}
