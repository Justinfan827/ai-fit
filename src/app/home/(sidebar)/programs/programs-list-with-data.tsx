import { getUserPrograms } from "@/lib/supabase/server/database.operations.queries"
import { ProgramsList } from "./program-list"

export default async function ProgramsListWithData() {
  const programs = await getUserPrograms()

  if (programs.error) {
    return <div>Error: {programs.error.message}</div>
  }

  return <ProgramsList programs={programs.data} />
}
