import { type Program, programSchema } from "@/lib/domain/workouts"
import type { Maybe } from "@/lib/types/types"
import { withFetchResponse } from "./with-fetch"

export default async function apiEditProgram({
  body,
}: {
  body: Program
}): Promise<Maybe<Program>> {
  return await withFetchResponse("/api/program", {
    fetchOpts: {
      method: "PUT",
      body: JSON.stringify(body),
      headers: new Headers({ "Content-Type": "application/json" }),
    },
    responseOpts: {
      expectedStatus: 200,
      schema: programSchema,
    },
  })
}
