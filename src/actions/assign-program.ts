"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { assignProgramToUser } from "@/lib/supabase/server/database.operations.mutations"
import { withAuthInput } from "./middleware/with-auth"

const assignProgramSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  programId: z.string().min(1, "Program ID is required"),
})

export const assignProgramAction = withAuthInput(
  {
    schema: assignProgramSchema,
  },
  async ({ input, user }) => {
    const { error } = await assignProgramToUser({
      trainerId: user.userId,
      clientId: input.clientId,
      programId: input.programId,
    })

    if (error) {
      throw error
    }

    revalidatePath(`/home/clients/${input.clientId}`)
    return { success: true }
  }
)
