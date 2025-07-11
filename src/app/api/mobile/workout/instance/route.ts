import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { z } from "zod"
import { APIError } from "@/app/api/errors"
import { withPublic } from "@/app/api/middleware/withAuth"
import { workoutInstanceBlockSchema } from "@/lib/domain/workouts"
import { saveWorkoutInstance } from "@/lib/supabase/server/database.operations.mutations"

const CompletedWorkoutInstance = z.object({
  id: z.string(),
  workoutId: z.string(),
  programId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  blocks: z.array(workoutInstanceBlockSchema),
})

export const POST = withPublic(async ({ req }) => {
  const client = createClient(
    // this is http://kong:8000 on localhost. Interesting.
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  )
  const body = await req.json()
  // Get the session or user object
  const authHeader = req.headers.get("Authorization") || ""
  const token = authHeader.replace("Bearer ", "")
  const { data: userdata, error } = await client.auth.getUser(token)
  if (!userdata) {
    throw new APIError({
      code: "unauthorized",
      message: "No user found from auth token",
    })
  }
  if (error) {
    throw new APIError({
      code: "unauthorized",
      message: "Failed to get user from auth token",
    })
  }
  const { data: bData, error: bError } =
    CompletedWorkoutInstance.safeParse(body)
  if (bError) {
    throw bError
  }
  const { error: saveErr } = await saveWorkoutInstance({
    id: bData.id,
    startAt: bData.startAt,
    endAt: bData.endAt,
    blocks: bData.blocks,
    workoutId: bData.workoutId,
    programId: bData.programId,
    userId: userdata.user.id,
  })
  if (saveErr) {
    throw saveErr
  }
  return NextResponse.json({ saved: true })
})
