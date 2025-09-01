"use server"

import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

import { programSchema } from "@/lib/domain/workouts"
import { createProgram } from "@/lib/supabase/server/database.operations.mutations"
import { withAuthInput } from "./middleware/with-auth"

const programSchemaWithoutId = programSchema.omit({ id: true })

export const createProgramAction = withAuthInput(
  {
    schema: programSchemaWithoutId,
  },
  async ({ input, user }) => {
    const resp = await createProgram(user.userId, {
      ...input,
      id: uuidv4().toString(),
    })
    if (resp.error) {
      throw resp.error
    }
    revalidatePath("/home/programs")
    return resp.data
  }
)
