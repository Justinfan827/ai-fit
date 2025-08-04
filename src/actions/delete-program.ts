"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteProgramById } from "@/lib/supabase/server/programs/mutations"
import { withActionAuthSchema } from "./middleware/withAuth"

// This schema is used to validate input from client.
const schema = z.object({
  programId: z.string(),
})

export const deleteProgramAction = withActionAuthSchema(
  {
    schema,
  },
  async ({ input, user }) => {
    const { data: userData, error } = await deleteProgramById({
      ownerId: user.id,
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
