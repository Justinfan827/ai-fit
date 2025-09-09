"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteTrainerNoteById } from "@/lib/supabase/server/users/trainer-repo"
import { withAuthInput } from "./middleware/with-auth"

// This schema is used to validate input from client.
const schema = z.object({
  detailId: z.string(),
  clientId: z.string(),
})

export const deleteTrainerNoteAction = withAuthInput(
  {
    schema,
  },
  async ({ input, user }) => {
    const { data: userData, error } = await deleteTrainerNoteById({
      trainerId: user.userId,
      clientId: input.clientId,
      noteId: input.detailId,
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
