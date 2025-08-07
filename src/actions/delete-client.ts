"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import { withAuthInput } from "./middleware/withAuth"

// This schema is used to validate input from client.
const schema = z.object({
  clientId: z.string(),
})

export const deleteClientAction = withAuthInput(
  {
    schema,
  },
  async ({ input, user }) => {
    // Soft delete: removes client from trainer by setting trainer_id to null
    const { data: userData, error } = await newTrainerRepo().deleteClientById({
      trainerId: user.userId,
      clientId: input.clientId,
    })
    if (error) {
      return {
        data: null,
        error,
      }
    }
    revalidatePath("/home/clients")
    return {
      data: userData,
      error: null,
    }
  }
)
