"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { withAuthInput } from "@/actions/middleware/with-auth"
import { deleteClientNoteById } from "@/lib/supabase/server/users/trainer-repo"

// This schema is used to validate input from client.
const schema = z.object({
  noteId: z.string(),
  clientId: z.string(), // For revalidation path
})

export const deleteClientNoteAction = withAuthInput(
  {
    schema,
  },
  async ({ input, user }) => {
    const { data: noteData, error } = await deleteClientNoteById({
      noteId: input.noteId,
      clientId: input.clientId,
      trainerId: user.userId,
    })
    if (error) {
      return {
        data: null,
        error,
      }
    }
    revalidatePath(`/home/clients/${input.clientId}`)
    return {
      data: noteData,
      error: null,
    }
  }
)
