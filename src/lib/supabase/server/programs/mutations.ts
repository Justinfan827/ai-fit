import "server-only"

import { createServerClient } from "@/lib/supabase/create-server-client"
import type { Maybe } from "@/lib/types/types"

export async function deleteProgramById({
  ownerId,
  programId,
}: {
  ownerId: string
  programId: string
}): Promise<Maybe<undefined>> {
  const client = await createServerClient()
  const { data, error } = await client
    .from("programs")
    .delete()
    .eq("user_id", ownerId)
    .eq("id", programId)
    .select("*")
  if (data?.length === 0) {
    return { data: null, error: new Error("Program not found") }
  }
  if (error) {
    return { data: null, error }
  }
  return { data: undefined, error: null }
}
