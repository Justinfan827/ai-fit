import { revalidatePath } from "next/cache"
import { programSchema } from "@/lib/domain/workouts"
import { createProgram } from "@/lib/supabase/server/database.operations.mutations"
import { withActionAuthSchema } from "./middleware/withAuth"

export const createProgramAction = withActionAuthSchema(
  {
    schema: programSchema,
  },
  async ({ input, user }) => {
    const resp = await createProgram(user.id, input)
    if (resp.error) {
      return {
        data: null,
        error: resp.error,
      }
    }
    revalidatePath("/home/programs")
    return {
      data: resp.data,
      error: null,
    }
  }
)
