import "server-only"

import type { QueryData } from "@supabase/supabase-js"

import createAdminClient from "../../create-admin-client"
import type { Database } from "../../database.types"
import type { DBClient } from "../../types"

/**
 * Query for base exercises (platform exercises with no owner)
 */
export const createBaseExercisesQuery = (sb: DBClient) =>
  sb
    .from("exercises")
    .select(`
      id,
      name,
      video_url,
      owner_id,
      notes,
      category_assignments (
        category_values (
          id,
          name,
          categories (
            id,
            name
          )
        )
      )
    `)
    .is("owner_id", null)

export type BaseExercisesQueryData = QueryData<
  ReturnType<typeof createBaseExercisesQuery>
>

/**
 * Query for custom exercises (trainer-owned exercises)
 */
export const createCustomExercisesQuery = (sb: DBClient, trainerId: string) =>
  sb
    .from("exercises")
    .select(`
      id,
      name,
      video_url,
      owner_id,
      notes,
      category_assignments (
        category_values (
          id,
          name,
          categories (
            id,
            name
          )
        )
      )
    `)
    .eq("owner_id", trainerId)

export type CustomExercisesQueryData = QueryData<
  ReturnType<typeof createCustomExercisesQuery>
>

/**
 * Get all the client details for a trainer
 */
export const getAllTrainerClientsQuery = (sb: DBClient, trainerId: string) =>
  sb
    .from("users")
    .select(`
      *, 
      trainer_client_notes!client_id (
        id,
        title,
        description
      )
    `)
    .order("trainer_client_notes.created_at", { ascending: false })
    .eq("trainer_id", trainerId)

export type GetAllTrainerClientsQueryData = QueryData<
  ReturnType<typeof getAllTrainerClientsQuery>
>

/**
 * Query for single client verification
 */
export const createClientVerificationQuery = (sb: DBClient, clientId: string) =>
  sb.from("users").select("trainer_id").eq("id", clientId).single()

export type ClientVerificationQueryData = QueryData<
  ReturnType<typeof createClientVerificationQuery>
>

/**
 * Query for client with programs + trainer notes
 */
export const getClientDetailedQuery = (
  sb: DBClient,
  trainerId: string,
  clientId: string
) =>
  sb
    .from("users")
    .select(`
      *,
      trainer_client_notes!client_id (
      *
      ),
      programs (
        *,
        workouts (
          *
        )
      )
    `)
    .eq("trainer_id", trainerId)
    .eq("id", clientId)
    .single()

export type GetClientDetailedQueryData = QueryData<
  ReturnType<typeof getClientDetailedQuery>
>

/**
 * Query for client programs
 */
export const createClientProgramsQuery = (sb: DBClient, clientId: string) =>
  sb
    .from("programs")
    .select("*")
    .eq("user_id", clientId)
    .order("created_at", { ascending: false })

export type ClientProgramsQueryData = QueryData<
  ReturnType<typeof createClientProgramsQuery>
>

/**
 * Query for trainer assignment verification
 */
export const getClientTrainerAssignmentQuery = (
  sb: DBClient,
  clientId: string,
  trainerId: string
) =>
  sb
    .from("trainer_assigned_programs")
    .select("client_id")
    .eq("client_id", clientId)
    .eq("trainer_id", trainerId)
    .single()

export type TrainerAssignmentQueryData = QueryData<
  ReturnType<typeof getClientTrainerAssignmentQuery>
>

/**
 * Query for user metadata
 */
export const createUserMetadataQuery = (sb: DBClient, clientId: string) =>
  sb.from("users").select("metadata").eq("id", clientId).single()

export type UserMetadataQueryData = QueryData<
  ReturnType<typeof createUserMetadataQuery>
>

/**
 * Query for trainer client notes
 */
export const getTrainerClientNotesQuery = (
  sb: DBClient,
  trainerId: string,
  clientId: string
) =>
  sb
    .from("trainer_client_notes")
    .select("*")
    .eq("trainer_id", trainerId)
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

export type TrainerClientNotesQueryData = QueryData<
  ReturnType<typeof getTrainerClientNotesQuery>
>

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Create a new user via admin client
 */
export const createUserMutation = (email: string) => {
  const sb = createAdminClient()
  return sb.auth.admin.createUser({
    email,
    password: email,
    email_confirm: true,
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
  })
}

/**
 * Set user claim via admin client
 */
export const setUserClaimMutation = (
  uid: string,
  claim: string,
  value: string
) => {
  const sb = createAdminClient()
  return sb.rpc("set_claim", {
    uid,
    claim,
    value,
  })
}

/**
 * Update user profile
 */
export const updateUserProfileMutation = (
  sb: DBClient,
  userId: string,
  profile: Database["public"]["Tables"]["users"]["Update"]
) => sb.from("users").update(profile).eq("id", userId).select("*")

/**
 * Soft delete client (remove trainer assignment)
 */
export const softDeleteClientMutation = (
  sb: DBClient,
  clientId: string,
  trainerId: string
) => {
  return sb
    .from("users")
    .update({ trainer_id: null })
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
}

/**
 * Create trainer note
 */
export const createTrainerNoteMutation = (
  sb: DBClient,
  {
    clientId,
    trainerId,
    description,
    title,
  }: {
    clientId: string
    trainerId: string
    description: string
    title: string
  }
) => {
  return sb
    .from("trainer_client_notes")
    .insert({ client_id: clientId, trainer_id: trainerId, description, title })
    .select("*")
    .single()
}

/**
 * Delete trainer note (soft delete)
 */
export const deleteTrainerNoteMutation = (
  sb: DBClient,
  {
    clientId,
    trainerId,
    noteId,
  }: {
    clientId: string
    trainerId: string
    noteId: string
  }
) => {
  return sb
    .from("trainer_client_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("trainer_id", trainerId)
    .eq("client_id", clientId)
}

/**
 * Query for client home page data with single SQL join
 */
export const getClientDetailsQuery = (
  sb: DBClient,
  trainerId: string,
  clientId: string
) =>
  sb
    .from("users")
    .select(`
      id,
      email,
      first_name,
      last_name,
      created_at,
      age,
      gender,
      weight_unit,
      weight_value,
      height_unit,
      height_value,
      programs (
        id,
        name,
        type,
        is_template,
        template_id,
        created_at,
        user_id,
        workouts (
          id,
          name,
          program_order,
          week,
          blocks,
          created_at
        )
      )
    `)
    .eq("trainer_id", trainerId)
    .eq("id", clientId)
    .single()

export type ClientHomePageQueryData = QueryData<
  ReturnType<typeof getClientDetailsQuery>
>
