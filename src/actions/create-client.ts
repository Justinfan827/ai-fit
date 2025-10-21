"use server"

import { z } from "zod"
import type { ClientBasic } from "@/lib/domain/clients"
import { createClientT } from "@/lib/supabase/server/users/trainer-repo"
import { withAuthInput } from "./middleware/with-auth"

const weightSchema = z.discriminatedUnion("unit", [
  z.object({
    unit: z.literal("lbs"),
    lbs: z.number(),
  }),
  z.object({
    unit: z.literal("kg"),
    kg: z.number(),
  }),
])

const heightSchema = z.discriminatedUnion("unit", [
  z.object({
    unit: z.literal("in"),
    feet: z.number(),
    inches: z.number(),
  }),
  z.object({
    unit: z.literal("cm"),
    cm: z.number(),
  }),
])

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
  gender: z.enum(["male", "female"], {
    error: "Please select a valid gender.",
  }),
  height: heightSchema,
  weight: weightSchema,
})

export type CreateClientInput = z.infer<typeof schema>

export const createClientAction = withAuthInput<CreateClientInput, ClientBasic>(
  {
    schema,
  },
  async ({ input, user }) => {
    // Extract basic client info
    const { firstName, lastName, email, age, gender, height, weight } = input

    const userData = await createClientT({
      trainerId: user.userId,
      newClient: {
        firstName,
        lastName,
        email,
        age,
        gender,
        height,
        weight,
      },
    })
    return userData
  }
)
