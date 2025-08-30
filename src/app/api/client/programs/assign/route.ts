import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuthBodySchema } from "@/app/api/middleware/withAuth"
import { assignProgramToUser } from "@/lib/supabase/server/database.operations.mutations"

// Define the schema for request body validation
const assignProgramSchema = z.object({
  clientId: z.string(),
  programId: z.string(),
})

// The actual handler function
async function assignProgramHandler({
  user,
  body,
}: {
  // TODO: move to server action
  user: any
  body: { clientId: string; programId: string }
}) {
  const { error: assignErr } = await assignProgramToUser({
    trainerId: user.id,
    clientId: body.clientId,
    programId: body.programId,
  })

  if (assignErr) {
    throw new Error(`${assignErr.name}: ${assignErr.message}`)
  }

  return NextResponse.json({ success: true })
}

// Wrap handler with middleware
export const POST = withAuthBodySchema(
  { schema: assignProgramSchema },
  assignProgramHandler
)
