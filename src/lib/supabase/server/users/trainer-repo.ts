import "server-only"

import { cache } from "react"
import { v4 as uuidv4 } from "uuid"
import type {
  ClientBasic,
  ClientDetail,
  ClientHomePage,
} from "@/lib/domain/clients"
import type { Exercise } from "@/lib/domain/workouts"
import type { Maybe } from "@/lib/types/types"
import { createServerClient } from "../../create-server-client"
import { getAuthUser } from "../auth-utils"
import { resolvePrograms } from "../programs/utils"
import {
  type BaseExercisesQueryData,
  type CustomExercisesQueryData,
  createBaseExercisesQuery,
  createClientDetailsQuery,
  createClientHomePageQueries,
  createClientVerificationQuery,
  createCustomExercisesQuery,
  createTrainerAssignmentQuery,
  createUserMetadataQuery,
  createUserMutation,
  setUserClaimMutation,
  softDeleteClientMutation,
  updateUserMetadataMutation,
  updateUserProfileMutation,
} from "./trainer-queries"

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

const transformExerciseData = (
  exercises: BaseExercisesQueryData | CustomExercisesQueryData
): Exercise[] => {
  if (!exercises) return []
  return exercises.map((e): Exercise => {
    // Group category values by category
    const categoriesMap = new Map()

    for (const assignment of e.category_assignments) {
      const categoryValue = assignment.category_values
      const category = categoryValue?.categories

      if (category && categoryValue) {
        if (!categoriesMap.has(category.id)) {
          categoriesMap.set(category.id, {
            id: category.id,
            name: category.name,
            values: [],
          })
        }
        categoriesMap.get(category.id).values.push({
          id: categoryValue.id,
          name: categoryValue.name,
        })
      }
    }

    return {
      id: e.id,
      name: e.name,
      ownerId: e.owner_id,
      videoURL: e.video_url || "",
      description: e.notes || "",
      categories: Array.from(categoriesMap.values()),
    }
  })
}

async function getAllExercises(trainerId: string): Promise<Maybe<DBExercises>> {
  const sb = await createServerClient()

  const baseQuery = createBaseExercisesQuery(sb)
  const customQuery = createCustomExercisesQuery(sb, trainerId)

  const [base, custom] = await Promise.all([baseQuery, customQuery])

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

  const baseData: BaseExercisesQueryData = base.data
  const customData: CustomExercisesQueryData = custom.data
  // Transform the data to match exerciseSchema
  const baseExercises = transformExerciseData(baseData)
  const customExercises = transformExerciseData(customData)

  return {
    data: {
      base: baseExercises,
      custom: customExercises,
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
}): Promise<Maybe<ClientBasic>> {
  const { data, error } = await createUserMutation(email)
  if (error) {
    return { data: null, error }
  }

  const { error: rpcErr } = await setUserClaimMutation(
    data.user.id,
    "USER_ROLE",
    "CLIENT"
  )
  if (rpcErr) {
    return { data: null, error: rpcErr }
  }

  const { error: insertErr } = await updateUserProfileMutation(data.user.id, {
    trainer_id: trainerId,
    first_name: firstName,
    last_name: lastName,
  })
  if (insertErr) {
    return { data: null, error: insertErr }
  }

  return {
    data: {
      id: data.user.id,
      email: data.user.email || "",
      firstName,
      lastName,
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
  const { data: client, error: verifyError } =
    await createClientVerificationQuery(sb, clientId)

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
  const { error } = await softDeleteClientMutation(sb, clientId, trainerId)

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

  const { data, error } = await createUserMetadataQuery(sb, clientId)
  if (error) {
    return { data: null, error }
  }

  const metadata = (data.metadata as Record<string, unknown>) || {}
  metadata.details = ((metadata.details as ClientDetail[]) || []).filter(
    (d) => d.id !== detailId
  )

  const { data: user, error: updateErr } = await updateUserMetadataMutation(
    sb,
    clientId,
    metadata as never
  )
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
  trainerId,
  title,
  description,
}: {
  trainerId: string
  clientId: string
  title: string
  description: string
}) {
  const sb = await createServerClient()

  // check that the client belongs to the trainer
  const { data: client, error: clientError } =
    await createTrainerAssignmentQuery(sb, clientId, trainerId)
  if (clientError) {
    return { data: null, error: clientError }
  }
  if (!client) {
    return { data: null, error: new Error("Client not found or access denied") }
  }

  const { data, error } = await createUserMetadataQuery(sb, clientId)
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

  const { data: user, error: updateErr } = await updateUserMetadataMutation(
    sb,
    clientId,
    metadata as never
  )
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
  const { user, error } = await getAuthUser()
  if (error) {
    return { data: null, error }
  }

  const sb = await createServerClient()
  const { data: clientsData, error: clientError } =
    await createClientDetailsQuery(sb, user.userId)

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
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const sb = await createServerClient()
  const [clientResult, programsResult] = await createClientHomePageQueries(
    sb,
    user.userId,
    clientId
  )

  if (clientResult.error) {
    return { data: null, error: clientResult.error }
  }

  if (programsResult.error) {
    return { data: null, error: programsResult.error }
  }

  const client = clientResult.data
  const pData = programsResult.data

  // Use the same supabase client for resolvePrograms
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
