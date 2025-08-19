"use server"

import { type Exercise, exerciseSchema } from "@/lib/domain/workouts"
import { createServerClient } from "@/lib/supabase/create-server-client"
import { updateExerciseCategoryAssignments } from "@/lib/supabase/server/categories"
import type { Tables } from "@/lib/supabase/types"
import { withAuthInput } from "./middleware/withAuth"

export const updateExercise = withAuthInput<Exercise, Tables<"exercises">>(
  {
    schema: exerciseSchema,
  },
  async ({ input: validatedExercise, user }) => {
    const supabase = await createServerClient()

    // Check if user owns this exercise
    const { data: existingExercise, error: fetchError } = await supabase
      .from("exercises")
      .select("owner_id")
      .eq("id", validatedExercise.id)
      .single()

    if (fetchError) {
      throw new Error(`Exercise not found: ${fetchError.message}`)
    }

    if (existingExercise.owner_id !== user.userId) {
      throw new Error("You can only update exercises you created")
    }

    // Update exercise - extract basic fields from Exercise object
    const { data: updatedExercise, error } = await supabase
      .from("exercises")
      .update({
        name: validatedExercise.name,
        notes: validatedExercise.description || null,
      })
      .eq("id", validatedExercise.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update exercise: ${error.message}`)
    }

    // Extract category value IDs from the Exercise categories structure
    const categoryValueIds = validatedExercise.categories.flatMap((category) =>
      category.values.map((value) => value.id)
    )

    // Update category assignments
    const { error: categoryError } = await updateExerciseCategoryAssignments(
      validatedExercise.id,
      categoryValueIds
    )

    if (categoryError) {
      throw new Error(
        `Failed to update exercise categories: ${categoryError.message}`
      )
    }

    return updatedExercise
  }
)
