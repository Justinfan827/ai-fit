import "server-only"

import { cache } from "react"
import type {
  ClientBasic,
  ClientHomePage,
  ClientWithTrainerNotes,
  TrainerNote,
} from "@/lib/domain/clients"
import type { Exercise } from "@/lib/domain/workouts"
import type { Maybe } from "@/lib/types/types"
import { createServerClient } from "../../create-server-client"
import { getAuthUser } from "../auth-utils"
import {
  type BaseExercisesQueryData,
  type CustomExercisesQueryData,
  createBaseExercisesQuery,
  createClientVerificationQuery,
  createCustomExercisesQuery,
  createTrainerNoteMutation,
  createUserMutation,
  deleteTrainerNoteMutation,
  getAllTrainerClientsQuery,
  getClientDetailedQuery,
  setUserClaimMutation,
  softDeleteClientMutation,
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
      console.log("exercises", error)
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

type CreateClientParams = {
  trainerId: string
  newClient: {
    firstName: string
    lastName: string
    email: string
    age: number
    height:
      | {
          unit: "in"
          feet: number
          inches: number
        }
      | {
          unit: "cm"
          cm: number
        }
    weight:
      | {
          unit: "lbs"
          lbs: number
        }
      | {
          unit: "kg"
          kg: number
        }
  }
}

async function createClientT({
  trainerId,
  newClient,
}: CreateClientParams): Promise<ClientBasic> {
  const { data, error } = await createClient({
    trainerId,
    newClient,
  })
  if (error) {
    throw error
  }
  return data
}

/**
 * Create a new client for a trainer
 */
async function createClient({
  trainerId,
  newClient: { firstName, lastName, email, age, height, weight },
}: CreateClientParams): Promise<Maybe<ClientBasic>> {
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

  const sb = await createServerClient()
  const { error: insertErr } = await updateUserProfileMutation(
    sb,
    data.user.id,
    {
      trainer_id: trainerId,
      first_name: firstName,
      last_name: lastName,
      age,
      height_value:
        height.unit === "in" ? height.feet * 12 + height.inches : height.cm,
      weight_value: weight.unit === "lbs" ? weight.lbs : weight.kg,
      height_unit: height.unit,
      weight_unit: weight.unit,
    }
  )
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

async function deleteTrainerNoteById({
  clientId,
  trainerId,
  noteId,
}: {
  noteId: string
  clientId: string
  trainerId: string
}) {
  const sb = await createServerClient()

  const { error } = await deleteTrainerNoteMutation(sb, {
    clientId,
    trainerId,
    noteId,
  })
  if (error) {
    return { data: null, error }
  }
  return {
    data: undefined,
    error: null,
  }
}

async function createTrainerNote({
  clientId,
  trainerId,
  title,
  description,
}: {
  trainerId: string
  clientId: string
  title: string
  description: string
}): Promise<Maybe<TrainerNote>> {
  const sb = await createServerClient()
  const { data, error } = await createTrainerNoteMutation(sb, {
    clientId,
    trainerId,
    description,
    title,
  })

  if (error) {
    return { data: null, error }
  }

  return {
    data,
    error: null,
  }
}

const getCachedAllClientDetailsT = cache(async () => {
  const { data, error } = await getAllClientDetails()
  if (error) {
    console.log("client details error", error)
    throw error
  }
  return data
})

/*
  List all clients for a trainer, including their details.
  This is currently used to populate the client list in the program editor sidebar.
  */
async function getAllClientDetails(): Promise<Maybe<ClientWithTrainerNotes[]>> {
  const { user, error } = await getAuthUser()
  if (error) {
    return { data: null, error }
  }

  const sb = await createServerClient()
  const { data: clientsData, error: clientError } =
    await getAllTrainerClientsQuery(sb, user.userId)

  if (clientError) {
    return { data: null, error: clientError }
  }

  const clients: ClientWithTrainerNotes[] = clientsData.map((c) => {
    return {
      id: c.id,
      email: c.email || "",
      firstName: c.first_name || "",
      lastName: c.last_name || "",
      createdAt: c.created_at || "",
      programs: [],
      age: c.age || 0,
      gender: c.gender || "",
      // TODO: convert to weight + units
      weight: {
        value: c.weight_value || 0,
        unit: c.weight_unit || "",
      },
      height: {
        value: c.height_value || 0,
        unit: c.height_unit || "",
      },
      trainerNotes: c.trainer_client_notes as TrainerNote[],
    }
  })

  return {
    data: clients,
    error: null,
  }
}

const getCachedClientHomePageDataT = cache(async (clientId: string) => {
  const { data, error } = await getClientHomePageData(clientId)
  if (error) {
    throw error
  }
  return data
})

/*
 * Fetch the data required for the home page of the client.
 * Includes:
 * - Assigned workout programs
 * - Basic info
 * - Trainer specific notes
 */
async function getClientHomePageData(
  clientId: string
): Promise<Maybe<ClientHomePage>> {
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const sb = await createServerClient()
  const { data: client, error: clientError } = await getClientDetailedQuery(
    sb,
    user.userId,
    clientId
  )
  if (clientError) {
    return { data: null, error: clientError }
  }

  return {
    data: {
      id: client.id,
      email: client.email || "",
      firstName: client.first_name || "",
      lastName: client.last_name || "",
      createdAt: client.created_at || "",
      age: client.age || 0,
      gender: client.gender || "",
      weight: {
        value: client.weight_value || 0,
        unit: client.weight_unit || "",
      },
      height: {
        value: client.height_value || 0,
        unit: client.height_unit || "",
      },
      // TODO: snake case? but lots of fields to map. Update later.
      programs: client.programs.map((p) => ({
        ...p,
        type: p.type as "weekly" | "splits",
      })),
      trainerNotes: client.trainer_client_notes,
    },
    error: null,
  }
}

export {
  getAllExercises,
  createClient,
  deleteClientById,
  deleteTrainerNoteById,
  createTrainerNote,
  getAllClientDetails,
  getCachedAllExercisesT,
  getCachedAllClientDetailsT,
  createClientT,
  getCachedClientHomePageDataT,
}
