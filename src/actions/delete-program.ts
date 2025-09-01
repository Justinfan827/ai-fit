"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteProgramById } from "@/lib/supabase/server/programs/mutations"
import { withAuthInput } from "./middleware/with-auth"

// This schema is used to validate input from client.
const schema = z.object({
  programId: z.string(),
})

export const deleteProgramAction = withAuthInput(
  {
    schema,
  },
  async ({ input, user }) => {
    const { data: userData, error } = await deleteProgramById({
      ownerId: user.userId,
      programId: input.programId,
    })
    if (error) {
      return {
        data: null,
        error,
      }
    }
    revalidatePath("/home/programs")
    return {
      data: userData,
      error: null,
    }
  }
)
