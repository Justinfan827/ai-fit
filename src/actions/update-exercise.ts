"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/create-server-client"

const updateExerciseSchema = z.object({
  id: z.string().uuid("Invalid exercise ID"),
  name: z.string().min(1, "Exercise name is required"),
  notes: z.string().optional(),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primary_benefit: z.string().optional(),
  primary_trained_colloquial: z.string().optional(),
  skill_requirement: z.string().optional(),
})

export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>

export const updateExercise = async (data: UpdateExerciseInput) => {
  const supabase = await createServerClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // Validate input
  const validatedData = updateExerciseSchema.parse(data)

  // Check if user owns this exercise
  const { data: existingExercise, error: fetchError } = await supabase
    .from("exercises")
    .select("owner_id")
    .eq("id", validatedData.id)
    .single()

  if (fetchError) {
    throw new Error(`Exercise not found: ${fetchError.message}`)
  }

  if (existingExercise.owner_id !== user.id) {
    throw new Error("You can only update exercises you created")
  }

  // Update exercise
  const { data: exercise, error } = await supabase
    .from("exercises")
    .update({
      name: validatedData.name,
      notes: validatedData.notes || null,
      video_url: validatedData.video_url || null,
      primary_benefit: validatedData.primary_benefit || null,
      primary_trained_colloquial:
        validatedData.primary_trained_colloquial || null,
      skill_requirement: validatedData.skill_requirement || null,
    })
    .eq("id", validatedData.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update exercise: ${error.message}`)
  }

  return exercise
}
