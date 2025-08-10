import "server-only"

import { cache } from "react"
import { v4 as uuidv4 } from "uuid"
import type { ClientDetail, ClientHomePage } from "@/lib/domain/clients"
import type { Exercise } from "@/lib/domain/workouts"
import createAdminClient from "@/lib/supabase/create-admin-client"
import type { Maybe } from "@/lib/types/types"
import { createServerClient } from "../../create-server-client"
import { getAuthUser } from "../auth-utils"
import { resolvePrograms } from "../programs/utils"

export type DBExercises = {
  base: Exercise[]
  custom: Exercise[]
}

const getCachedAllExercisesT = cache(
  async (trainerId: string): Promise<DBExercises> => {
    const { data, error } = await getAllExercises(trainerId)
    if (error) {
      throw error
    }
    return data
  }
)

async function getAllExercises(trainerId: string): Promise<Maybe<DBExercises>> {
  const sb = await createServerClient()
  const [base, custom] = await Promise.all([
    sb.from("exercises").select("*").is("owner_id", null),
    sb.from("exercises").select("*").eq("owner_id", trainerId),
  ])
  if (base.error) {
    return {
      data: null,
      error: base.error,
    }
  }
  if (custom.error) {
    return {
      data: null,
      error: custom.error,
    }
  }

  const baseData = base.data.map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.primary_trained_colloquial || "",
    ownerId: e.owner_id,
  }))
  const customData = custom.data.map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.primary_trained_colloquial || "",
    ownerId: e.owner_id,
  }))
  return {
    data: {
      base: baseData,
      custom: customData,
    },
    error: null,
  }
}

// this method will be used to create a new user
// in the database
async function createClient({
  trainerId,
  newClient: { firstName, lastName, email },
}: {
  trainerId: string
  newClient: { firstName: string; lastName: string; email: string }
}) {
  const sb = await createAdminClient()
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: email,
    email_confirm: true,
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
  })
  if (error) {
    return { data: null, error }
  }

  const { error: rpcErr } = await sb.rpc("set_claim", {
    uid: data.user.id,
    claim: "USER_ROLE",
    value: "CLIENT",
  })
  if (rpcErr) {
    return { data: null, error: rpcErr }
  }
  const { error: insertErr } = await sb
    .from("users")
    .update({
      trainer_id: trainerId,
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", data.user.id)
  if (insertErr) {
    return { data: null, error: insertErr }
  }
  return {
    data: {
      user: {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        trainer_id: trainerId,
      },
    },
    error: null,
  }
}

async function deleteClientById({
  trainerId,
  clientId,
}: {
  trainerId: string
  clientId: string
}) {
  const sb = await createServerClient()

  // First, verify that the client belongs to this trainer
  const { data: client, error: verifyError } = await sb
    .from("users")
    .select("trainer_id")
    .eq("id", clientId)
    .single()

  if (verifyError) {
    return { data: null, error: verifyError }
  }

  if (client.trainer_id !== trainerId) {
    return {
      data: null,
      error: new Error("Client not found or access denied"),
    }
  }

  // Soft delete: set trainer_id to null instead of hard deleting the user
  const { error } = await sb
    .from("users")
    .update({ trainer_id: null })
    .eq("id", clientId)
    .eq("trainer_id", trainerId) // Extra safety check

  if (error) {
    return { data: null, error }
  }

  return { data: undefined, error: null }
}

async function deleteClientDetailById({
  clientId,
  detailId,
}: {
  clientId: string
  detailId: string
}) {
  const sb = await createServerClient()
  const { data, error } = await sb
    .from("users")
    .select("metadata")
    .eq("id", clientId)
    .single()
  if (error) {
    return { data: null, error }
  }
  const metadata = (data.metadata as Record<string, unknown>) || {}
  metadata.details = ((metadata.details as ClientDetail[]) || []).filter(
    (d) => d.id !== detailId
  )
  const { data: user, error: updateErr } = await sb
    .from("users")
    .update({
      metadata: metadata as never,
    })
    .eq("id", clientId)
    .select("*")
  if (updateErr) {
    return { data: null, error: updateErr }
  }
  return {
    data: { user },
    error: null,
  }
}

async function updateClientDetails({
  clientId,
  title,
  description,
}: {
  trainerId: string
  clientId: string
  title: string
  description: string
}) {
  const sb = await createServerClient()
  const { data, error } = await sb
    .from("users")
    .select("metadata")
    .eq("id", clientId)
    .single()
  if (error) {
    return { data: null, error }
  }
  const metadata = (data.metadata as Record<string, unknown>) || {}
  const details = (metadata.details as ClientDetail[]) || []
  details.push({
    id: uuidv4(),
    title,
    description,
  })
  metadata.details = details

  const { data: user, error: updateErr } = await sb
    .from("users")
    .update({
      metadata: metadata as never,
    })
    .eq("id", clientId)
    .select("*")
  if (updateErr) {
    return { data: null, error: updateErr }
  }
  return {
    data: { user },
    error: null,
  }
}

const getCachedAllClientDetailsT = cache(
  async (): Promise<ClientHomePage[]> => {
    const { data, error } = await fetchAllClientDetails()
    if (error) {
      throw error
    }
    return data
  }
)

/*
  List all clients for a trainer, including their details.
  This is currentlyused to populate the client list in the program editor sidebar.
  */
async function fetchAllClientDetails(): Promise<Maybe<ClientHomePage[]>> {
  const sb = await createServerClient()
  const { user, error } = await getAuthUser()
  if (error) {
    return { data: null, error }
  }
  const { data: clientsData, error: clientError } = await sb
    .from("users")
    .select("*")
    .eq("trainer_id", user.userId)

  if (clientError) {
    return { data: null, error: clientError }
  }

  const clients: ClientHomePage[] = clientsData.map((c) => {
    const metadata = (c.metadata as Record<string, unknown>) || {}
    return {
      id: c.id,
      email: c.email || "",
      firstName: c.first_name || "",
      lastName: c.last_name || "",
      createdAt: c.created_at || "",
      programs: [],
      age: (metadata.age as number) || 0,
      gender: (metadata.gender as string) || "",
      liftingExperienceMonths:
        (metadata.lifting_experience_months as number) || 0,
      weightKg: (metadata.weight_kg as number) || 0,
      heightCm: (metadata.height_cm as number) || 0,
      details: (metadata?.details as ClientDetail[]) || [],
    }
  })

  return {
    data: clients,
    error: null,
  }
}

/*
 * Fetch the data required for the home page of the client.
 * Includes:
 * - Assigned client programs
 * - Client details e.g. any trainer created notes
 */
async function getClientHomePageData(
  clientId: string
): Promise<Maybe<ClientHomePage>> {
  const sb = await createServerClient()
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const { data: client, error: clientError } = await sb
    .from("users")
    .select("*")
    .eq("trainer_id", user.userId)
    .eq("id", clientId)
    .single()

  if (clientError) {
    return { data: null, error: clientError }
  }

  const { data: pData, error: pErr } = await sb
    .from("programs")
    .select("*")
    .eq("user_id", client.id)
    .order("created_at", { ascending: false })

  if (pErr) {
    return { data: null, error: pErr }
  }

  const { data: progData, error: progErr } = await resolvePrograms(sb, pData)
  if (progErr) {
    return { data: null, error: progErr }
  }

  const metadata = (client.metadata as Record<string, unknown>) || {}

  return {
    data: {
      id: client.id,
      email: client.email || "",
      firstName: client.first_name || "",
      lastName: client.last_name || "",
      createdAt: client.created_at || "",
      programs: progData,
      age: (metadata.age as number) || 0,
      gender: (metadata.gender as string) || "",
      liftingExperienceMonths:
        (metadata.lifting_experience_months as number) || 0,
      weightKg: (metadata.weight_kg as number) || 0,
      heightCm: (metadata.height_cm as number) || 0,
      details: (metadata?.details as ClientDetail[]) || [],
    },
    error: null,
  }
}

export {
  getAllExercises,
  createClient,
  deleteClientById,
  deleteClientDetailById,
  updateClientDetails,
  fetchAllClientDetails,
  getClientHomePageData,
  getCachedAllExercisesT,
  getCachedAllClientDetailsT,
}
