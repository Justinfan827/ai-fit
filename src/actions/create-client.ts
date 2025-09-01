"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ClientBasic } from "@/lib/domain/clients"
import { createClient } from "@/lib/supabase/server/users/trainer-repo"
import { withAuthInput } from "./middleware/with-auth"

// This schema is used to validate input from client.
const schema = z.object({
  firstName: z.string().min(2, {
    error: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    error: "Last name must be at least 2 characters.",
  }),
  email: z.email({ error: "Please enter a valid email address." }),
})

export const createClientAction = withAuthInput<
  z.infer<typeof schema>,
  ClientBasic
>(
  {
    schema,
  },
  async ({ input, user }) => {
    const { data: userData, error } = await createClient({
      trainerId: user.userId,
      newClient: input,
    })
    if (error) {
      throw error
    }
    revalidatePath("/home/clients")
    return userData
  }
)
