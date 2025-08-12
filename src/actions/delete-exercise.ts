"use server"

import { createServerClient } from "@/lib/supabase/create-server-client"
import { getCachedAuthUserT } from "@/lib/supabase/server/auth-utils"
import type { Maybe } from "@/lib/types/types"

export async function deleteExerciseAction({
  exerciseId,
}: {
  exerciseId: string
}): Promise<Maybe<undefined>> {
  try {
    const authUser = await getCachedAuthUserT()
    const client = await createServerClient()

    // First, verify that the exercise belongs to this user (only custom exercises can be deleted)
    const { data: exercise, error: verifyError } = await client
      .from("exercises")
      .select("owner_id")
      .eq("id", exerciseId)
      .single()

    if (verifyError) {
      return { data: null, error: verifyError }
    }

    // Only allow deletion of custom exercises (exercises with owner_id)
    if (!exercise.owner_id || exercise.owner_id !== authUser.userId) {
      return {
        data: null,
        error: new Error("Exercise not found or cannot be deleted"),
      }
    }

    // Delete the exercise
    const { data, error } = await client
      .from("exercises")
      .delete()
      .eq("id", exerciseId)
      .eq("owner_id", authUser.userId) // Extra safety check
      .select("*")

    if (data?.length === 0) {
      return { data: null, error: new Error("Exercise not found") }
    }

    if (error) {
      return { data: null, error }
    }

    return { data: undefined, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
  }
}
