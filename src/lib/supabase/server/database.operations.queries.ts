import "server-only"

import { cache } from "react"
import type { Client } from "@/lib/domain/clients"
import {
  type Blocks,
  type Program,
  type Workout,
  workoutSchema,
} from "@/lib/domain/workouts"
import type { Maybe } from "@/lib/types/types"
import { createServerClient } from "../create-server-client"
import { getAuthUser } from "./auth-utils"
import { resolveProgram, resolvePrograms } from "./programs/utils"

export async function getCurrentUserClients(): Promise<Maybe<Client[]>> {
  const client = await createServerClient()

  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }
  const { data: clients, error: clientError } = await client
    .from("users")
    .select("*")
    .eq("trainer_id", user.userId)

  if (clientError) {
    return { data: null, error: clientError }
  }
  return {
    data: clients.map((c) => ({
      id: c.id,
      email: c.email || "",
      firstName: c.first_name || "",
      lastName: c.last_name || "",
      createdAt: c.created_at || "",
    })),
    error: null,
  }
}

export interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "trainer"
  avatarURL?: string
}

export const getCachedUserT = cache(async (): Promise<CurrentUser> => {
  const { data: user, error } = await getCurrentUser()
  if (error || !user) {
    throw new Error("Auth'd user not found")
  }
  return user
})

export async function getCurrentUser(): Promise<Maybe<CurrentUser>> {
  const client = await createServerClient()
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }
  const { data: dbUser, error: dbErr } = await client
    .from("users")
    .select("*")
    .eq("id", user.userId)
    .single()
  if (dbErr) {
    return { data: null, error: dbErr }
  }
  return {
    data: {
      id: user.userId,
      firstName: dbUser.first_name || "",
      lastName: dbUser.last_name || "",
      email: user.email,
      // TODO: support clients
      role: "trainer",
    },
    error: null,
  }
}

export async function getUserWorkout(
  workoutid: string
): Promise<Maybe<Workout>> {
  const client = await createServerClient()
  const { user, error } = await getAuthUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from("workouts")
    .select("*")
    .eq("user_id", user.userId)
    .eq("id", workoutid)
    .single()

  if (pErr) {
    return { data: null, error: pErr }
  }

  const resData: Workout = {
    id: pData.id,
    program_order: pData.program_order,
    program_id: pData.program_id,
    name: pData.name,
    blocks: pData.blocks as Blocks,
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

export async function getExercises() {
  const client = await createServerClient()
  return client.from("exercises").select("*")
}

export const getCachedProgramByIdT = cache(
  async (programId: string): Promise<Program> => {
    const { data, error } = await getProgramById(programId)
    if (error) {
      throw error
    }
    return data
  }
)

export async function getProgramById(
  programId: string
): Promise<Maybe<Program>> {
  const client = await createServerClient()
  const { data: pData, error: pErr } = await client
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single()

  if (pErr) {
    return { data: null, error: pErr }
  }
  return resolveProgram(pData)
}

export async function getUserPrograms(): Promise<Maybe<Program[]>> {
  const client = await createServerClient()
  const { user, error } = await getAuthUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from("programs")
    .select("*")
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false })

  if (pErr) {
    return { data: null, error: pErr }
  }
  return resolvePrograms(client, pData)
}

export async function getAllPrograms(): Promise<Maybe<Program[]>> {
  const client = await createServerClient()
  const { data: wData, error: wErr } = await client
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false })
  if (wErr) {
    return { data: null, error: wErr }
  }
  return resolvePrograms(client, wData)
}
export async function getAllCurrentUserUnassignedPrograms(): Promise<
  Maybe<Program[]>
> {
  const sb = await createServerClient()
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const { data: wData, error: wErr } = await sb
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false })
    .eq("user_id", user.userId)
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
  Maybe<Program | undefined | null>
> {
  const client = await createServerClient()
  const { user, error } = await getAuthUser()
  if (error) {
    return { data: null, error }
  }
  const { data: pData, error: pErr } = await client
    .from("programs")
    .select("*")
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false })
    .limit(1) // get the latest program

  if (pErr) {
    return { data: null, error: pErr }
  }
  if (pData.length === 0 || !pData) {
    return { data: undefined, error: null }
  }
  return resolveProgram(pData[0])
}
