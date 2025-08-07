"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import { withAuthInput } from "./middleware/withAuth"

// This schema is used to validate input from client.
const schema = z.object({
  detailId: z.string(),
  clientId: z.string(),
})

export const deleteClientDetailAction = withAuthInput(
  {
    schema,
  },
  async ({ input }) => {
    const { data: userData, error } =
      await newTrainerRepo().deleteClientDetailById({
        clientId: input.clientId,
        detailId: input.detailId,
      })
    if (error) {
      return {
        data: null,
        error,
      }
    }
    revalidatePath(`/home/clients/${input.clientId}`)
    return {
      data: userData,
      error: null,
    }
  }
)
