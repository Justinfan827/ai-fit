import "server-only"

import type { Maybe } from "@/lib/types/types"
import { createServerClient } from "../create-server-client"
import { getAuthUser } from "./auth-utils"

export interface ExerciseCategoryAssignment {
  category_value_id: string
  category_name: string
  category_value_name: string
}

export async function getExerciseCategoryAssignments(
  exerciseId: string
): Promise<Maybe<ExerciseCategoryAssignment[]>> {
  const client = await createServerClient()
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  const { data, error } = await client
    .from("category_assignments")
    .select(`
      category_value_id,
      category_values (
        name,
        categories (
          name
        )
      )
    `)
    .eq("exercise_id", exerciseId)

  if (error) {
    return { data: null, error }
  }

  const assignments: ExerciseCategoryAssignment[] =
    data?.map((assignment: any) => ({
      category_value_id: assignment.category_value_id,
      category_name: assignment.category_values.categories.name,
      category_value_name: assignment.category_values.name,
    })) || []

  return { data: assignments, error: null }
}

export async function updateExerciseCategoryAssignments(
  exerciseId: string,
  categoryValueIds: string[]
): Promise<Maybe<boolean>> {
  const client = await createServerClient()
  const { user, error: getUserError } = await getAuthUser()
  if (getUserError) {
    return { data: null, error: getUserError }
  }

  // Verify the exercise belongs to the user
  const { data: exercise, error: exerciseError } = await client
    .from("exercises")
    .select("owner_id")
    .eq("id", exerciseId)
    .single()

  if (exerciseError) {
    return { data: null, error: exerciseError }
  }

  if (exercise.owner_id !== user.userId) {
    return {
      data: null,
      error: new Error("You can only modify exercises you created"),
    }
  }

  // Remove all existing assignments for this exercise
  const { error: deleteError } = await client
    .from("category_assignments")
    .delete()
    .eq("exercise_id", exerciseId)

  if (deleteError) {
    return { data: null, error: deleteError }
  }

  // Add new assignments if any
  if (categoryValueIds.length > 0) {
    const assignments = categoryValueIds.map((categoryValueId) => ({
      exercise_id: exerciseId,
      category_value_id: categoryValueId,
    }))

    const { error: insertError } = await client
      .from("category_assignments")
      .insert(assignments)

    if (insertError) {
      return { data: null, error: insertError }
    }
  }

  return { data: true, error: null }
}
