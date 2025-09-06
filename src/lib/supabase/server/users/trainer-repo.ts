import "server-only"

import { cache } from "react"
import type {
  ClientBasic,
  ClientHomePage,
  TrainerClientNote,
} from "@/lib/domain/clients"
import type { Exercise } from "@/lib/domain/workouts"
import type { Maybe } from "@/lib/types/types"
import {
  convertHeight,
  convertWeight,
  type HeightUnit,
  type WeightUnit,
} from "@/lib/utils/biometric-units"
import { createServerClient } from "../../create-server-client"
import { getAuthUser } from "../auth-utils"
import { resolvePrograms } from "../programs/utils"
import {
  type BaseExercisesQueryData,
  type CustomExercisesQueryData,
  createBaseExercisesQuery,
  createClientDetailsQuery,
  createClientVerificationQuery,
  createCustomExercisesQuery,
  createTrainerClientNoteMutation,
  createUserMutation,
  deleteTrainerClientNoteMutation,
  getClientDetailsQuery,
  getClientTrainerAssignmentQuery,
  getTrainerClientNotesQuery,
  setUserClaimMutation,
  softDeleteClientMutation,
  updateUserProfileMutation,
} from "./trainer-queries"

export type DBExercises = {
  base: Exercise[]
  custom: Exercise[]
}

// Helper functions for safe unit type casting
const isWeightUnit = (unit: string | null): unit is WeightUnit => {
  return unit === "kg" || unit === "lbs"
}

const isHeightUnit = (unit: string | null): unit is HeightUnit => {
  return unit === "cm" || unit === "in"
}

const safeConvertWeight = (
  value: number | null,
  unit: string | null
): number => {
  if (!value) return 0
  if (!isWeightUnit(unit)) return 0
  return convertWeight.toKg(value, unit)
}

const safeConvertHeight = (
  value: number | null,
  unit: string | null
): number => {
  if (!value) return 0
  if (!isHeightUnit(unit)) return 0
  return convertHeight.toCm(value, unit)
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

async function deleteClientNoteById({
  noteId,
  clientId,
  trainerId,
}: {
  noteId: string
  clientId: string
  trainerId: string
}): Promise<Maybe<TrainerClientNote>> {
  const sb = await createServerClient()

  // Verify that the client belongs to this trainer
  const { data: client, error: clientError } =
    await getClientTrainerAssignmentQuery(sb, clientId, trainerId)
  if (clientError) {
    return { data: null, error: clientError }
  }
  if (!client) {
    return { data: null, error: new Error("Client not found or access denied") }
  }

  const { data: note, error: deleteErr } =
    await deleteTrainerClientNoteMutation(sb, noteId)
  if (deleteErr) {
    return { data: null, error: deleteErr }
  }

  return {
    data: {
      id: note.id,
      trainerId: note.trainer_id,
      clientId: note.client_id,
      title: note.title,
      description: note.description,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    },
    error: null,
  }
}

async function createClientNote({
  clientId,
  trainerId,
  title,
  description,
}: {
  trainerId: string
  clientId: string
  title: string
  description: string
}): Promise<Maybe<TrainerClientNote>> {
  const sb = await createServerClient()

  // Verify that the client belongs to this trainer
  const { data: client, error: clientError } =
    await getClientTrainerAssignmentQuery(sb, clientId, trainerId)
  if (clientError) {
    return { data: null, error: clientError }
  }
  if (!client) {
    return { data: null, error: new Error("Client not found or access denied") }
  }

  const { data: note, error: createErr } =
    await createTrainerClientNoteMutation(
      sb,
      trainerId,
      clientId,
      title,
      description
    )
  if (createErr) {
    return { data: null, error: createErr }
  }

  return {
    data: {
      id: note.id,
      trainerId: note.trainer_id,
      clientId: note.client_id,
      title: note.title,
      description: note.description,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    },
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
    return {
      id: c.id,
      email: c.email || "",
      firstName: c.first_name || "",
      lastName: c.last_name || "",
      createdAt: c.created_at || "",
      programs: [],
      age: c.age || 0,
      gender: c.gender || "",
      liftingExperienceMonths: 0, // This field will need to be added to users table if needed
      weightKg: safeConvertWeight(c.weight_value, c.weight_unit),
      heightCm: safeConvertHeight(c.height_value, c.height_unit),
      details: [], // Legacy details are now handled by trainerNotes
      trainerNotes: [], // Will be populated separately if needed
    }
  })

  return {
    data: clients,
    error: null,
  }
}

async function getTrainerNotesForClient({
  trainerId,
  clientId,
}: {
  trainerId: string
  clientId: string
}): Promise<Maybe<TrainerClientNote[]>> {
  const sb = await createServerClient()

  // Verify that the client belongs to this trainer
  const { data: client, error: clientError } =
    await getClientTrainerAssignmentQuery(sb, clientId, trainerId)
  if (clientError) {
    return { data: null, error: clientError }
  }
  if (!client) {
    return { data: null, error: new Error("Client not found or access denied") }
  }

  const { data: notes, error } = await getTrainerClientNotesQuery(
    sb,
    trainerId,
    clientId
  )
  if (error) {
    return { data: null, error }
  }

  const transformedNotes: TrainerClientNote[] = notes.map((note) => ({
    id: note.id,
    trainerId: note.trainer_id,
    clientId: note.client_id,
    title: note.title,
    description: note.description,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  }))

  return {
    data: transformedNotes,
    error: null,
  }
}

const getCachedClientHomePageDataT = cache(
  async (clientId: string): Promise<ClientHomePage> => {
    const { data, error } = await getClientHomePageData(clientId)
    if (error) {
      throw error
    }
    return data
  }
)
/*
 * Fetch the data required for the home page of the client.
 * Includes:
 * - Assigned client programs (with workouts)
 * - Client biometric data
 * - Trainer created notes
 *
 * OPTIMIZED VERSION: Uses parallel queries and SQL joins to minimize waterfalls
 */
async function getClientHomePageData(
  clientId: string
): Promise<Maybe<ClientHomePage>> {
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const sb = await createServerClient()

  // Execute queries in parallel to eliminate async waterfalls
  const [clientResult, notesResult] = await Promise.all([
    getClientDetailsQuery(sb, user.userId, clientId),
    getTrainerClientNotesQuery(sb, user.userId, clientId),
  ])

  if (clientResult.error) {
    return { data: null, error: clientResult.error }
  }
  if (notesResult.error) {
    return { data: null, error: notesResult.error }
  }

  const client = clientResult.data
  // Transform trainer notes
  const transformedNotes: TrainerClientNote[] = notesResult.data.map(
    (note) => ({
      id: note.id,
      trainerId: note.trainer_id,
      clientId: note.client_id,
      title: note.title,
      description: note.description,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })
  )

  // Transform the programs data (already includes workouts from the SQL join)
  const { data: progData, error: progErr } = await resolvePrograms(
    sb,
    client.programs || []
  )
  if (progErr) {
    return { data: null, error: progErr }
  }

  return {
    data: {
      id: client.id,
      email: client.email || "",
      firstName: client.first_name || "",
      lastName: client.last_name || "",
      createdAt: client.created_at || "",
      programs: progData,
      age: client.age || 0,
      gender: client.gender || "",
      liftingExperienceMonths: 0, // This field will need to be added to users table if needed
      weightKg: safeConvertWeight(client.weight_value, client.weight_unit),
      heightCm: safeConvertHeight(client.height_value, client.height_unit),
      details: [], // Legacy details are now handled by trainerNotes
      trainerNotes: transformedNotes,
    },
    error: null,
  }
}

export {
  getAllExercises,
  createClient,
  deleteClientById,
  deleteClientNoteById,
  createClientNote,
  getTrainerNotesForClient,
  fetchAllClientDetails,
  getClientHomePageData,
  getCachedAllExercisesT,
  getCachedAllClientDetailsT,
  getCachedClientHomePageDataT,
}
