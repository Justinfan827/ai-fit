"use server"

import { z } from "zod"
import type { ClientBasic } from "@/lib/domain/clients"
import { createClientT } from "@/lib/supabase/server/users/trainer-repo"
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
  age: z
    .number()
    .min(1, { error: "Age must be at least 1." })
    .max(120, { error: "Age must be less than 120." }),
  height: z.number().min(1, {
    error: "Height must be greater than 0.",
  }),
  heightUnit: z.enum(["cm", "in"], {
    error: "Please select a height unit.",
  }),
  weight: z.number().min(1, {
    error: "Weight must be greater than 0.",
  }),
  weightUnit: z.enum(["kg", "lbs"], {
    error: "Please select a weight unit.",
  }),
})

export type CreateClientInput = z.infer<typeof schema>

export const createClientAction = withAuthInput<CreateClientInput, ClientBasic>(
  {
    schema,
  },
  async ({ input, user }) => {
    // Extract basic client info
    const {
      firstName,
      lastName,
      email,
      age,
      height,
      heightUnit,
      weight,
      weightUnit,
    } = input

    const userData = await createClientT({
      trainerId: user.userId,
      newClient: {
        firstName,
        lastName,
        email,
        age,
        height,
        weight,
        heightUnit,
        weightUnit,
      },
    })
    return userData
  }
)
