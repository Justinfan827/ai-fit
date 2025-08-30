"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/create-server-client"

const createExerciseSchema = z.object({
  name: z.string().min(1, { error: "Exercise name is required" }),
  notes: z.string().optional(),
  video_url: z.url().optional().or(z.literal("")),
  primary_benefit: z.string().optional(),
  primary_trained_colloquial: z.string().optional(),
  skill_requirement: z.string().optional(),
})

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>

export const createExercise = async (data: CreateExerciseInput) => {
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
  const validatedData = createExerciseSchema.parse(data)

  // Create exercise
  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({
      name: validatedData.name,
      notes: validatedData.notes || null,
      video_url: validatedData.video_url || null,
      primary_benefit: validatedData.primary_benefit || null,
      primary_trained_colloquial:
        validatedData.primary_trained_colloquial || null,
      skill_requirement: validatedData.skill_requirement || null,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`)
  }

  return exercise
}
