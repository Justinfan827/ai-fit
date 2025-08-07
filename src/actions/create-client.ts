"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import newTrainerRepo from "@/lib/supabase/server/users/trainer-repo"
import { withAuthInput } from "./middleware/withAuth"

// This schema is used to validate input from client.
const schema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({ message: "Please enter a valid email address." }),
})

export const createClientAction = withAuthInput(
  {
    schema,
  },
  async ({ input, user }) => {
    const { data: userData, error } = await newTrainerRepo().createClient({
      trainerId: user.userId,
      newClient: input,
    })
    if (error) {
      return {
        data: null,
        error,
      }
    }
    revalidatePath("/home")
    return {
      data: userData,
      error,
    }
  }
)
