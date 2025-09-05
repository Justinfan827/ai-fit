import "server-only"

import type { QueryData } from "@supabase/supabase-js"

import createAdminClient from "../../create-admin-client"
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
 * Query for client details (users with trainer relationship)
 */
export const createClientDetailsQuery = (sb: DBClient, trainerId: string) =>
  sb.from("users").select("*").eq("trainer_id", trainerId)

export type ClientDetailsQueryData = QueryData<
  ReturnType<typeof createClientDetailsQuery>
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
 * Query for client with programs
 */
export const createClientWithProgramsQuery = (
  sb: DBClient,
  trainerId: string,
  clientId: string
) =>
  sb
    .from("users")
    .select("*")
    .eq("trainer_id", trainerId)
    .eq("id", clientId)
    .single()

export type ClientWithProgramsQueryData = QueryData<
  ReturnType<typeof createClientWithProgramsQuery>
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
  userId: string,
  profile: { trainer_id: string; first_name: string; last_name: string }
) => {
  const sb = createAdminClient()
  return sb.from("users").update(profile).eq("id", userId)
}

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
 * Create a new trainer client note
 */
export const createTrainerClientNoteMutation = (
  sb: DBClient,
  trainerId: string,
  clientId: string,
  title: string,
  description: string
) => {
  return sb
    .from("trainer_client_notes")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      title,
      description,
    })
    .select("*")
    .single()
}

/**
 * Update a trainer client note
 */
export const updateTrainerClientNoteMutation = (
  sb: DBClient,
  noteId: string,
  title: string,
  description: string
) => {
  return sb
    .from("trainer_client_notes")
    .update({
      title,
      description,
    })
    .eq("id", noteId)
    .select("*")
    .single()
}

/**
 * Soft delete a trainer client note
 */
export const deleteTrainerClientNoteMutation = (
  sb: DBClient,
  noteId: string
) => {
  return sb
    .from("trainer_client_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noteId)
    .select("*")
    .single()
}

// ============================================================================
// COMPOUND QUERY FUNCTIONS - For complex operations requiring multiple queries
// ============================================================================

/**
 * Get client with programs - combines client and programs queries
 */
export const createClientHomePageQueries = (
  sb: DBClient,
  trainerId: string,
  clientId: string
) => {
  const clientQuery = createClientWithProgramsQuery(sb, trainerId, clientId)
  const programsQuery = createClientProgramsQuery(sb, clientId)

  return Promise.all([clientQuery, programsQuery])
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
