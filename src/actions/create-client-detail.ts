"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { withAuthInput } from "@/actions/middleware/with-auth"
import { updateClientDetails } from "@/lib/supabase/server/users/trainer-repo"

// This schema is used to validate input from client.
const schema = z.object({
  clientId: z.string(),
  title: z.string().min(2, {
    error: "Title must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    error: "Description must be at least 2 characters.",
  }),
})

export const createClientDetailAction = withAuthInput(
  {
    schema,
  },
  async ({ input, user }) => {
    const { data: userData, error } = await updateClientDetails({
      trainerId: user.userId,
      ...input,
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
