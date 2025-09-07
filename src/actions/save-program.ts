"use server"

import { revalidatePath } from "next/cache"

import { programSchema } from "@/lib/domain/workouts"
import { updateProgram } from "@/lib/supabase/server/database.operations.mutations"
import { withAuthInput } from "./middleware/with-auth"

export const updateProgramAction = withAuthInput(
  {
    schema: programSchema,
  },
  async ({ input, user }) => {
    const resp = await updateProgram(input)
    if (resp.error) {
      throw resp.error
    }
    revalidatePath("/home/programs")
    return resp.data
  }
)
